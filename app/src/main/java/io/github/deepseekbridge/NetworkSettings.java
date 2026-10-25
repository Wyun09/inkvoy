package io.github.deepseekbridge;

import android.content.*;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;

/** Native model/auth transport. Explicit proxy selection never changes TLS validation. */
public final class NetworkSettings {
    private static volatile Context application;
    private static final ExecutorService dnsWorkers=Executors.newFixedThreadPool(2,r->{Thread t=new Thread(r,"studio-dns-check");t.setDaemon(true);return t;});
    static void install(Context context){application=context.getApplicationContext();}
    static JSONObject config(Context context)throws JSONException{
        android.content.SharedPreferences p=context.getSharedPreferences("studio-network",Context.MODE_PRIVATE);
        return new JSONObject().put("mode",p.getString("mode","system")).put("host",p.getString("host","127.0.0.1")).put("port",p.getInt("port",0));
    }
    static JSONObject configure(Context context,JSONObject a)throws Exception{
        String mode=a.optString("mode","system"),host=a.optString("host","127.0.0.1").trim();int port=a.optInt("port",0);
        if(!mode.equals("system")&&!mode.equals("http_proxy"))throw new IOException("不支持的网络模式");
        if(mode.equals("http_proxy")&&(host.isEmpty()||host.length()>253||!host.matches("[a-zA-Z0-9._:-]+")||port<1||port>65535))throw new IOException("请填写 VPN 提供的 HTTP 代理主机和端口；不要填订阅地址");
        if(!context.getSharedPreferences("studio-network",Context.MODE_PRIVATE).edit().putString("mode",mode).putString("host",host).putInt("port",port).commit())throw new IOException("网络设置未能保存");install(context);return config(context);
    }
    static HttpURLConnection open(URL url)throws IOException{return open(url,application);}
    static HttpURLConnection open(URL url,Context context)throws IOException{
        if(!url.getProtocol().equals("https")&&!url.getProtocol().equals("http"))throw new IOException("网络请求仅支持 HTTP/HTTPS");
        String host=url.getHost();if(host.equals("127.0.0.1")||host.equals("localhost")||host.equals("[::1]")||host.equals("::1"))return (HttpURLConnection)url.openConnection(Proxy.NO_PROXY);
        if(context!=null){android.content.SharedPreferences p=context.getSharedPreferences("studio-network",Context.MODE_PRIVATE);if(p.getString("mode","system").equals("http_proxy"))return (HttpURLConnection)url.openConnection(new Proxy(Proxy.Type.HTTP,InetSocketAddress.createUnresolved(p.getString("host","127.0.0.1"),p.getInt("port",0))));}
        return (HttpURLConnection)url.openConnection();
    }
    static JSONObject diagnose(Context context)throws Exception{
        if(context==null)context=application;JSONObject settings=context==null?new JSONObject().put("mode","system"):config(context);JSONArray targets=new JSONArray();
        for(String host:new String[]{"auth.openai.com","api.openai.com"}){
            URL url=new URL("https://"+host+(host.startsWith("auth.")?"/.well-known/openid-configuration":"/v1/models"));
            JSONObject target=new JSONObject().put("host",host).put("dns",resolve(host)).put("system",probe(url,null));
            if(settings.optString("mode").equals("http_proxy"))target.put("selected",probe(url,context));else target.put("selected",target.getJSONObject("system"));targets.put(target);
        }
        boolean api=targets.getJSONObject(1).getJSONObject("selected").optBoolean("reachable"),vpn=false;
        if(context!=null)try{ConnectivityManager c=(ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);NetworkCapabilities n=c.getNetworkCapabilities(c.getActiveNetwork());vpn=n!=null&&n.hasTransport(NetworkCapabilities.TRANSPORT_VPN);}catch(Exception ignored){}
        return new JSONObject().put("ok",api).put("apiReachable",api).put("vpnActiveForApplication",vpn).put("mode",settings.optString("mode")).put("targets",targets).put("message",api?"应用内 API 域名的 HTTPS 已连通；诊断未携带令牌，请重试读取模型。":"应用内 API 请求仍未连通。授权页由系统浏览器打开，不能代表此应用或 api.openai.com 已走同一 VPN 路径；可检查分应用代理，或填写 VPN 提供的本机 HTTP 代理端口。");
    }
    private static JSONObject probe(URL url,Context selected)throws JSONException{
        long start=System.currentTimeMillis();HttpURLConnection c=null;JSONObject result=new JSONObject();
        try{c=selected==null?(HttpURLConnection)url.openConnection():open(url,selected);c.setInstanceFollowRedirects(false);c.setConnectTimeout(4000);c.setReadTimeout(4000);c.setRequestMethod("GET");c.setRequestProperty("Accept","application/json");int status=c.getResponseCode();result.put("reachable",true).put("httpStatus",status);}
        catch(Exception e){result.put("reachable",false).put("code",NetworkErrors.code(e)).put("message",NetworkErrors.message(e,url.getHost())==null?"网络连接未成功":NetworkErrors.message(e,url.getHost()));}
        finally{if(c!=null)c.disconnect();}return result.put("elapsedMs",System.currentTimeMillis()-start);
    }
    private static JSONObject resolve(String host)throws JSONException{
        Future<InetAddress[]> work=dnsWorkers.submit(()->InetAddress.getAllByName(host));JSONObject result=new JSONObject();
        try{JSONArray addresses=new JSONArray();for(InetAddress address:work.get(3,TimeUnit.SECONDS))if(addresses.length()<10)addresses.put(address.getHostAddress());return result.put("ok",true).put("addresses",addresses);}
        catch(Exception error){work.cancel(true);Throwable cause=error instanceof ExecutionException?error.getCause():error;return result.put("ok",false).put("code",cause instanceof TimeoutException?"dns_timeout":NetworkErrors.code(cause)).put("message",cause instanceof TimeoutException?"系统解析超过 3 秒":"系统未返回可用地址；该结果不能单独证明 DNS 污染");}
    }
}
