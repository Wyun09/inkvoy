package io.github.deepseekbridge;
import java.net.*;
import java.io.*;
import javax.net.ssl.SSLException;
/** Classify transport failures without changing authorization or leaking tokens. */
final class NetworkErrors {
 static String code(Throwable error){for(Throwable e=error;e!=null;e=e.getCause()){if(e instanceof UnknownHostException)return "dns_resolution";if(e instanceof SocketTimeoutException)return "network_timeout";if(e instanceof SSLException)return "tls_failure";if(e instanceof ConnectException||e instanceof NoRouteToHostException)return "network_unreachable";}return "provider_error";}
 static String message(Throwable error,String host){switch(code(error)){case "dns_resolution":return "无法解析 "+host+"。账号授权仍保留，请检查系统网络、VPN 分流与 DNS 后重试；无需重新登录。";case "network_timeout":return "连接 "+host+" 超时。请检查网络或代理后重试，账号授权未清除。";case "tls_failure":return "与 "+host+" 的安全连接失败。请检查系统时间、证书与代理；未降低 TLS 校验。";case "network_unreachable":return "当前网络无法连接 "+host+"。请检查 VPN 分流与网络后重试。";default:return null;}}
}
