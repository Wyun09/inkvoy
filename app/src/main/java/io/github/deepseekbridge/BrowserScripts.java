package io.github.deepseekbridge;
import java.io.IOException;
import org.json.JSONObject;
final class BrowserScripts {
 static String source(String template,String script,String key)throws Exception {
  if(script==null||script.trim().isEmpty()||script.length()>32768)throw new IOException("脚本需为 1–32768 字符");
  if(template==null||!template.contains("__INKVOY_SCRIPT_BODY__")||!template.contains("__INKVOY_SCRIPT_KEY__"))throw new IOException("脚本运行器缺失，请更新完整 APK");
  return template.replace("__INKVOY_SCRIPT_KEY__",JSONObject.quote(key)).replace("__INKVOY_SCRIPT_BODY__",script);
 }
}
