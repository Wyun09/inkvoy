package io.github.deepseekbridge;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.*;

/** User-configured API transport. Runs outside both Android and JavaScript UI
 * threads. Credentials are sent only to the explicitly configured origin. */
final class ProviderGateway {
    private static final java.util.regex.Pattern DONE=java.util.regex.Pattern.compile("(?:^|\\n)data:[\\t ]*\\[DONE\\][\\t ]*\\r?\\n\\r?\\n");
    interface Sink { void event(String id, JSONObject value); }
    // Up to three cluster workers plus one foreground/background catalog read.
    private final ExecutorService workers=Executors.newFixedThreadPool(4,r->new Thread(r,"studio-model-api"));
    private final ConcurrentHashMap<String,Job> jobs=new ConcurrentHashMap<>();
    private static final class Job { volatile HttpURLConnection connection; volatile String accountId; final AtomicBoolean cancelled=new AtomicBoolean(); }
    static URL endpoint(String raw,boolean models)throws Exception {
        URI uri=new URI(raw.trim());String scheme=uri.getScheme();
        if(!("https".equalsIgnoreCase(scheme)||"http".equalsIgnoreCase(scheme))||uri.getHost()==null||uri.getRawUserInfo()!=null||uri.getRawFragment()!=null||raw.length()>4096)throw new IOException("请输入完整的 HTTP(S) API 地址，地址中不能包含账号或片段。");
        String path=uri.getPath();if(path==null||path.isEmpty()||path.equals("/"))path="/v1";
        path=path.replaceAll("/+$","");if(path.endsWith("/chat/completions"))path=path.substring(0,path.length()-17);
        path+=models?"/models":"/chat/completions";
        return new URI(scheme,uri.getAuthority(),path,uri.getQuery(),null).toURL();
    }
    static String safe(String message,String key){String clean=message==null?"自定义接口请求失败":message;if(key!=null&&!key.isEmpty())clean=clean.replace(key,"[已隐藏]");clean=clean.replaceAll("(?i)Bearer\\s+[^\\s\"']+","Bearer [已隐藏]").replaceAll("[\\r\\n\\t]+"," ");return clean.substring(0,Math.min(clean.length(),500));}
    private void emit(Sink sink,String id,String type,String text)throws JSONException{JSONObject value=new JSONObject().put("type",type);if(text!=null)value.put(type.equals("error")?"message":"text",text);sink.event(id,value);}
    void request(String id,String raw,Sink sink){
        request(id,raw,sink,null);
    }
    void request(String id,String raw,Sink sink,java.util.concurrent.Callable<OpenAiAccounts> accounts){
        if(id==null||id.length()>128||raw==null||raw.length()>4000000){try{emit(sink,id,"error","接口请求超过限制");}catch(JSONException ignored){}return;}
        Job job=new Job();if(jobs.size()>=8||jobs.putIfAbsent(id,job)!=null){try{emit(sink,id,"error","已有接口请求在处理，请稍后再试");}catch(JSONException ignored){}return;}
        workers.execute(()->{
            String key="",host="API 端点";
            try{
                JSONObject input=new JSONObject(raw);boolean account="openai-account".equals(input.optString("kind"));boolean models="models".equals(input.optString("operation"));
                if(account){if(accounts==null)throw new IOException("账号登录通道不可用");job.accountId=input.getString("accountId");key=accounts.call().access(job.accountId);}else key=input.optString("key");if(key.length()>16384||key.indexOf('\r')>=0||key.indexOf('\n')>=0)throw new IOException("API 凭据格式不正确");
                URL url=account?new URL(OpenAiAccounts.RESOURCE+(models?"/models":"/responses")):endpoint(input.getString("endpoint"),models);
                host=url.getHost();
                HttpURLConnection connection=NetworkSettings.open(url);job.connection=connection;connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(20000);connection.setReadTimeout(45000);
                connection.setRequestProperty("Accept",models?"application/json":"text/event-stream, application/json");if(!key.isEmpty())connection.setRequestProperty("Authorization","Bearer "+key);
                if(job.cancelled.get())throw new InterruptedIOException("请求已停止");
                if(!models){JSONObject requestBody=input.getJSONObject("body");if(account){requestBody.put("store",false).put("stream",true);}byte[] body=requestBody.toString().getBytes(StandardCharsets.UTF_8);if(body.length>4000000)throw new IOException("API 请求超过 4 MB");connection.setRequestMethod("POST");connection.setRequestProperty("Content-Type","application/json; charset=utf-8");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(body.length);try(OutputStream out=connection.getOutputStream()){out.write(body);}}
                int status=connection.getResponseCode();
                if(status>=300&&status<400)throw new IOException("接口返回重定向，请填写最终 API 地址后重试（HTTP "+status+"）");
                if(status<200||status>=300){String detail="";try(InputStream error=connection.getErrorStream()){if(error!=null){String value=read(error,32768);try{detail=new JSONObject(value).optJSONObject("error").optString("message");}catch(Exception ignored){}}}throw new IOException("接口请求失败（HTTP "+status+"）"+(detail.isEmpty()?"":"："+detail));}
                String contentType=connection.getContentType();
                try(InputStream inputStream=connection.getInputStream();PushbackReader reader=new PushbackReader(new InputStreamReader(inputStream,StandardCharsets.UTF_8),128)){
                    // Some gateways label Responses SSE as JSON or omit the header.
                    // Inspect only its prefix, preserving it for incremental delivery.
                    boolean streaming=!models&&looksLikeEventStream(reader,contentType);
                    if(!streaming){
                        String result=readText(reader,models?1048576:8388608);if(job.cancelled.get())throw new InterruptedIOException("请求已停止");JSONObject value;try{value=new JSONObject(result);}catch(JSONException e){throw new IOException("接口响应格式无法识别；预期 JSON 或 SSE 事件流，请检查连接状态");}sink.event(id,new JSONObject().put("type","response").put("body",value));
                    }else{
                        char[] buffer=new char[2048];int count,total=0;StringBuilder chunk=new StringBuilder();String tail="";long lastEmit=0,deadline=System.nanoTime()+600000000000L;
                        while((count=reader.read(buffer))!=-1){if(job.cancelled.get())throw new InterruptedIOException("请求已停止");if(System.nanoTime()>deadline)throw new IOException("接口生成超时");total+=count;if(total>8388608)throw new IOException("接口响应超过 8 MB，已停止接收");chunk.append(buffer,0,count);String observed=tail+new String(buffer,0,count);boolean done=DONE.matcher(observed).find();tail=observed.substring(Math.max(0,observed.length()-128));long now=System.nanoTime();if(done||chunk.indexOf("\n\n")>=0||chunk.indexOf("\r\n\r\n")>=0||now-lastEmit>=32000000L||chunk.length()>=16384){emit(sink,id,"data",chunk.toString());chunk.setLength(0);lastEmit=now;}if(done)break;}
                        if(job.cancelled.get())throw new InterruptedIOException("请求已停止");if(chunk.length()>0)emit(sink,id,"data",chunk.toString());
                        emit(sink,id,"end",null);
                    }
                }
            }catch(Exception error){try{String reason=NetworkErrors.message(error,host);sink.event(id,new JSONObject().put("type","error").put("code",job.cancelled.get()?"cancelled":NetworkErrors.code(error)).put("retryable",!job.cancelled.get()&&!NetworkErrors.code(error).equals("provider_error")).put("host",host).put("message",job.cancelled.get()?"请求已停止":reason==null?safe(error.getMessage(),key):reason));}catch(JSONException ignored){}}
            finally{if(job.connection!=null)job.connection.disconnect();jobs.remove(id,job);}
        });
    }
    private static boolean looksLikeEventStream(PushbackReader reader,String contentType)throws IOException {
        if(contentType!=null&&contentType.toLowerCase(java.util.Locale.ROOT).contains("text/event-stream"))return true;
        StringBuilder prefix=new StringBuilder();int first;
        // A UTF-8 BOM is permitted before the first SSE field.
        while((first=reader.read())!=-1){if(prefix.length()==0&&first==0xfeff)continue;prefix.append((char)first);if(!Character.isWhitespace((char)first)||prefix.length()>=96)break;}
        String token=prefix.toString().trim();
        if(!token.isEmpty()&&!token.equals("{")&&!token.equals("[")&&!token.equals(":")){
            while(prefix.length()<120){int c=reader.read();if(c==-1)break;prefix.append((char)c);if(c==':'||c=='\n'||c=='\r')break;}
        }
        token=prefix.toString().trim();if(prefix.length()>0)reader.unread(prefix.toString().toCharArray());
        return token.startsWith(":")||token.startsWith("event:")||token.startsWith("data:")||token.startsWith("id:")||token.startsWith("retry:");
    }
    private static String readText(Reader reader,int limit)throws IOException {StringBuilder text=new StringBuilder();char[] chunk=new char[4096];int n;while((n=reader.read(chunk))!=-1){if(text.length()+n>limit)throw new IOException("接口响应超过限制");text.append(chunk,0,n);}return text.toString();}
    private static String read(InputStream input,int limit)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int count;while((count=input.read(buffer))!=-1){if(out.size()+count>limit)throw new IOException("接口响应超过限制");out.write(buffer,0,count);}return new String(out.toByteArray(),StandardCharsets.UTF_8);}
    void cancel(String id){Job job=jobs.get(id);if(job==null)return;job.cancelled.set(true);HttpURLConnection connection=job.connection;if(connection!=null){Thread closer=new Thread(connection::disconnect,"studio-api-cancel");closer.setDaemon(true);closer.start();}}
    void cancelAccount(String account){for(java.util.Map.Entry<String,Job> entry:jobs.entrySet())if(account.equals(entry.getValue().accountId))cancel(entry.getKey());}
    void cancelAll(){for(String id:jobs.keySet())cancel(id);}
    void close(){cancelAll();workers.shutdownNow();}
}
