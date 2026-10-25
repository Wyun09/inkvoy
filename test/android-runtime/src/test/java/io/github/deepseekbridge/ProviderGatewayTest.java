package io.github.deepseekbridge;
import android.app.Application;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class ProviderGatewayTest {
    interface Serve {void run(Socket socket,String headers)throws Exception;}
    private static class Server implements AutoCloseable {
        final ServerSocket server;final AtomicReference<String> request=new AtomicReference<>();final AtomicReference<Throwable> failure=new AtomicReference<>();
        Server(Serve handler)throws Exception{server=new ServerSocket(0,4,InetAddress.getByName("127.0.0.1"));Thread worker=new Thread(()->{try(Socket s=server.accept()){s.setSoTimeout(5000);ByteArrayOutputStream bytes=new ByteArrayOutputStream();InputStream in=s.getInputStream();int value;String header="";while((value=in.read())!=-1){bytes.write(value);header=new String(bytes.toByteArray(),StandardCharsets.UTF_8);if(header.endsWith("\r\n\r\n"))break;}request.set(header);handler.run(s,header);}catch(Throwable error){failure.set(error);}},"fixture-http");worker.setDaemon(true);worker.start();}
        String base(){return "http://127.0.0.1:"+server.getLocalPort()+"/v1";}
        public void close()throws Exception{server.close();}
    }
    private JSONObject request(String endpoint,String op)throws Exception{return new JSONObject().put("endpoint",endpoint).put("operation",op).put("key","fixture-key").put("body",new JSONObject().put("model","fixture-model").put("messages",new JSONArray()).put("stream",true));}
    private void response(Socket socket,int status,String type,String text)throws Exception{byte[] bytes=text.getBytes(StandardCharsets.UTF_8);OutputStream out=socket.getOutputStream();out.write(("HTTP/1.1 "+status+" Fixture\r\nContent-Type: "+type+"\r\nContent-Length: "+bytes.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.UTF_8));out.write(bytes);out.flush();}
    @Test public void threeClusterEndpointsAndCatalogCanReceiveRequestsBeforeAnyAnswerCompletes()throws Exception{
        CountDownLatch entered=new CountDownLatch(4),release=new CountDownLatch(1),done=new CountDownLatch(4);List<JSONObject> errors=new CopyOnWriteArrayList<>();
        Serve handler=(socket,headers)->{entered.countDown();release.await(5,TimeUnit.SECONDS);response(socket,200,"application/json",headers.startsWith("GET")?"{\"data\":[]}":"{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"actual endpoint response\"}}]}");};
        try(Server a=new Server(handler);Server b=new Server(handler);Server c=new Server(handler);Server catalog=new Server(handler)){
            ProviderGateway gateway=new ProviderGateway();try{
                ProviderGateway.Sink sink=(id,event)->{if(event.optString("type").equals("error"))errors.add(event);if(event.optString("type").equals("response")||event.optString("type").equals("error"))done.countDown();};
                gateway.request("worker-a",request(a.base(),"chat").put("key","fixture-a").toString(),sink);
                gateway.request("worker-b",request(b.base(),"chat").put("key","fixture-b").toString(),sink);
                gateway.request("worker-c",request(c.base(),"chat").put("key","fixture-c").toString(),sink);
                gateway.request("catalog",request(catalog.base(),"models").toString(),sink);
                assertTrue("Native transport must not serialize the cluster behind two threads",entered.await(5,TimeUnit.SECONDS));assertEquals(4,done.getCount());
                assertTrue(a.request.get().contains("Bearer fixture-a"));assertFalse(a.request.get().contains("fixture-b"));assertTrue(b.request.get().contains("Bearer fixture-b"));assertTrue(c.request.get().contains("Bearer fixture-c"));assertTrue(catalog.request.get().startsWith("GET /v1/models"));
                release.countDown();assertTrue(done.await(5,TimeUnit.SECONDS));assertTrue(errors.toString(),errors.isEmpty());
            }finally{release.countDown();gateway.close();}
        }
    }
    @Test public void endpointsAcceptBasesAndFullPathsWithoutDuplicatingV1()throws Exception{assertEquals("https://example.test/v1/chat/completions",ProviderGateway.endpoint("https://example.test/v1/chat/completions",false).toString());assertEquals("http://127.0.0.1:11434/v1/models",ProviderGateway.endpoint("http://127.0.0.1:11434/v1/",true).toString());assertEquals("https://example.test/v1/chat/completions",ProviderGateway.endpoint("https://example.test",false).toString());try{ProviderGateway.endpoint("file:///private",false);fail();}catch(IOException expected){}}
    @Test public void nativeTransportEmitsFirstSseBeforeServerCompletes()throws Exception{
        CountDownLatch finishServer=new CountDownLatch(1),first=new CountDownLatch(1),done=new CountDownLatch(1),closeServer=new CountDownLatch(1);List<String> parts=new CopyOnWriteArrayList<>();AtomicReference<String> error=new AtomicReference<>();
        try(Server server=new Server((socket,headers)->{OutputStream out=socket.getOutputStream();out.write("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nConnection: close\r\n\r\ndata: FIRST\n\n".getBytes(StandardCharsets.UTF_8));out.flush();finishServer.await(5,TimeUnit.SECONDS);out.write("data: 第二段\n\ndata: [DONE]\n\n".getBytes(StandardCharsets.UTF_8));out.flush();closeServer.await(5,TimeUnit.SECONDS);})){
            ProviderGateway gateway=new ProviderGateway();try{gateway.request("stream",request(server.base(),"chat").toString(),(id,event)->{if(event.optString("type").equals("data")){parts.add(event.optString("text"));first.countDown();}if(event.optString("type").equals("error"))error.set(event.toString());if(event.optString("type").equals("end")||event.optString("type").equals("error"))done.countDown();});assertTrue(first.await(5,TimeUnit.SECONDS));assertEquals(1,done.getCount());assertTrue(server.request.get().contains("POST /v1/chat/completions"));assertTrue(server.request.get().contains("Bearer fixture-key"));finishServer.countDown();assertTrue("DONE must finish while server keeps socket open",done.await(2,TimeUnit.SECONDS));assertEquals(1,closeServer.getCount());assertNull(error.get());assertTrue(String.join("",parts).contains("第二段"));}finally{finishServer.countDown();closeServer.countDown();gateway.close();}
        }
    }
    @Test public void modelListUsesGetAndReturnsJson()throws Exception{CountDownLatch done=new CountDownLatch(1);AtomicReference<JSONObject> result=new AtomicReference<>();try(Server server=new Server((s,h)->response(s,200,"application/json","{\"data\":[{\"id\":\"actual-fixture-model\"}]}"))){ProviderGateway gateway=new ProviderGateway();try{gateway.request("models",request(server.base(),"models").toString(),(id,e)->{result.set(e);done.countDown();});assertTrue(done.await(5,TimeUnit.SECONDS));assertTrue(server.request.get().startsWith("GET /v1/models"));assertEquals("actual-fixture-model",result.get().getJSONObject("body").getJSONArray("data").getJSONObject(0).getString("id"));}finally{gateway.close();}}}
    @Test public void responsesSseIsDetectedWithoutTrustingAProxyContentTypeAndStaysLive()throws Exception {
        for(String type:new String[]{"application/json",null}){
            CountDownLatch first=new CountDownLatch(1),release=new CountDownLatch(1),done=new CountDownLatch(1);List<JSONObject> events=new CopyOnWriteArrayList<>();
            try(Server server=new Server((socket,headers)->{OutputStream out=socket.getOutputStream();out.write(("HTTP/1.1 200 OK\r\n"+(type==null?"":"Content-Type: "+type+"\r\n")+"Connection: close\r\n\r\n\uFEFFevent: response.output_text.delta\r\ndata: {\"type\":\"response.output_text.delta\",\"delta\":\"首段中文\"}\r\n\r\n").getBytes(StandardCharsets.UTF_8));out.flush();release.await(5,TimeUnit.SECONDS);out.write("event: response.completed\ndata: {\"type\":\"response.completed\",\"response\":{\"status\":\"completed\",\"output\":[]}}\n\n".getBytes(StandardCharsets.UTF_8));out.flush();})){
                ProviderGateway gateway=new ProviderGateway();try{gateway.request("responses",request(server.base(),"chat").toString(),(id,event)->{events.add(event);if(event.optString("type").equals("data")&&event.optString("text").contains("首段中文"))first.countDown();if(event.optString("type").equals("end")||event.optString("type").equals("error"))done.countDown();});assertTrue("First SSE must arrive before response completes, type="+type+" events="+events,first.await(2,TimeUnit.SECONDS));assertEquals(1,release.getCount());assertEquals(1,done.getCount());release.countDown();assertTrue(done.await(5,TimeUnit.SECONDS));assertFalse(events.toString(),events.stream().anyMatch(e->e.optString("type").equals("error")));assertTrue(events.toString(),events.stream().anyMatch(e->e.optString("text").contains("首段中文")));}finally{release.countDown();gateway.close();}
            }
        }
    }
    @Test public void jsonCompletionStillWorksAndHtmlDoesNotLeakAParserException()throws Exception {
        for(String text:new String[]{"{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"正常 JSON\"}}]}","<html>gateway failure</html>"}){CountDownLatch done=new CountDownLatch(1);AtomicReference<JSONObject> result=new AtomicReference<>();try(Server server=new Server((s,h)->response(s,200,"text/plain",text))){ProviderGateway gateway=new ProviderGateway();try{gateway.request("body",request(server.base(),"chat").toString(),(id,e)->{result.set(e);done.countDown();});assertTrue(done.await(5,TimeUnit.SECONDS));if(text.startsWith("{"))assertEquals("正常 JSON",result.get().getJSONObject("body").getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content"));else{assertEquals("error",result.get().getString("type"));assertTrue(result.get().getString("message"),result.get().getString("message").contains("响应格式"));}}finally{gateway.close();}}}
    }
    @Test public void redirectIsNotFollowedAndSecretsAreRedactedFromErrors()throws Exception{CountDownLatch done=new CountDownLatch(1);AtomicReference<JSONObject> result=new AtomicReference<>();try(Server server=new Server((s,h)->response(s,401,"application/json","{\"error\":{\"message\":\"invalid fixture-key\"}}"))){ProviderGateway gateway=new ProviderGateway();try{gateway.request("error",request(server.base(),"chat").toString(),(id,e)->{result.set(e);done.countDown();});assertTrue(done.await(5,TimeUnit.SECONDS));assertEquals("error",result.get().getString("type"));assertFalse(result.get().toString().contains("fixture-key"));assertTrue(result.get().getString("message").contains("401"));}finally{gateway.close();}}
        CountDownLatch redirected=new CountDownLatch(1);try(Server server=new Server((s,h)->{s.getOutputStream().write("HTTP/1.1 302 Found\r\nLocation: http://127.0.0.1:1/steal\r\nContent-Length: 0\r\n\r\n".getBytes(StandardCharsets.UTF_8));s.getOutputStream().flush();})){ProviderGateway gateway=new ProviderGateway();try{gateway.request("redirect",request(server.base(),"chat").toString(),(id,e)->{result.set(e);redirected.countDown();});assertTrue(redirected.await(5,TimeUnit.SECONDS));assertTrue(result.get().getString("message").contains("重定向"));}finally{gateway.close();}}}
}
