package io.github.deepseekbridge;
import android.content.Context;
import android.graphics.*;
import android.media.ExifInterface;
import android.util.Base64;
import android.webkit.MimeTypeMap;
import org.json.*;
import java.io.*;
import java.security.MessageDigest;

/** Immutable image copies keep old chat pixels stable when a project file changes. */
public final class ChatMedia {
    private final File directory;
    public ChatMedia(Context context){directory=new File(context.getFilesDir(),"chat-media");}
    public JSONObject attach(File source,String project,String path)throws Exception{
        if(!source.isFile())throw new IOException("附件不存在");String name=source.getName(),extension=name.contains(".")?name.substring(name.lastIndexOf('.')+1).toLowerCase(java.util.Locale.ROOT):"";
        String mime=MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);JSONObject value=new JSONObject().put("name",name).put("path",path).put("project",project).put("bytes",source.length()).put("mime",mime==null?"application/octet-stream":mime).put("image",false);
        if(!raster(source))return value;
        BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(source.getPath(),bounds);
        if(bounds.outWidth<1||bounds.outHeight<1)return value;
        if(source.length()>20971520L||(long)bounds.outWidth*bounds.outHeight>100000000L)throw new IOException("图片过大：支持 20 MiB、1 亿像素以内的图片");
        MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(source)){byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)digest.update(b,0,n);}String id=RuntimeInstaller.hex(digest.digest());
        if(!directory.isDirectory()&&!directory.mkdirs())throw new IOException("无法创建图片存储");File target=new File(directory,id+".jpg");
        if(!target.isFile()){
            BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=1;while(bounds.outWidth/options.inSampleSize>1600||bounds.outHeight/options.inSampleSize>1600)options.inSampleSize*=2;
            Bitmap decoded=BitmapFactory.decodeFile(source.getPath(),options);if(decoded==null)throw new IOException("图片解码失败");Bitmap normalized=null;
            try{int orientation=1;try{orientation=new ExifInterface(source.getPath()).getAttributeInt(ExifInterface.TAG_ORIENTATION,1);}catch(IOException ignored){}Matrix matrix=new Matrix();if(orientation==6)matrix.postRotate(90);else if(orientation==3)matrix.postRotate(180);else if(orientation==8)matrix.postRotate(270);else if(orientation==2)matrix.postScale(-1,1);else if(orientation==4)matrix.postScale(1,-1);
                Bitmap rotated=Bitmap.createBitmap(decoded,0,0,decoded.getWidth(),decoded.getHeight(),matrix,true);
                normalized=Bitmap.createBitmap(rotated.getWidth(),rotated.getHeight(),Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(normalized);canvas.drawColor(Color.WHITE);canvas.drawBitmap(rotated,0,0,null);if(rotated!=decoded)rotated.recycle();
                ByteArrayOutputStream bytes=new ByteArrayOutputStream();int quality=85;do{bytes.reset();normalized.compress(Bitmap.CompressFormat.JPEG,quality,bytes);quality-=15;}while(bytes.size()>700000&&quality>=25);if(bytes.size()>900000)throw new IOException("图片编码后仍过大，请降低图片尺寸");
                File temp=File.createTempFile("image-",".tmp",directory);boolean saved=false;try{try(FileOutputStream out=new FileOutputStream(temp)){bytes.writeTo(out);out.getFD().sync();}if(!temp.renameTo(target)&&!target.isFile())throw new IOException("图片保存失败");saved=true;}finally{if(!saved||temp.exists())temp.delete();}
            }finally{decoded.recycle();if(normalized!=null)normalized.recycle();}
        }
        return value.put("image",true).put("id",id).put("url","https://bridge.local/chat-media/"+id).put("width",bounds.outWidth).put("height",bounds.outHeight).put("modelMime","image/jpeg");
    }
    static boolean raster(File source)throws IOException{byte[] b=new byte[32];int n;try(InputStream in=new FileInputStream(source)){n=in.read(b);}if(n<4)return false;if((b[0]&255)==255&&(b[1]&255)==216&&(b[2]&255)==255)return true;if((b[0]&255)==137&&b[1]==80&&b[2]==78&&b[3]==71)return true;String head=new String(b,0,n,java.nio.charset.StandardCharsets.ISO_8859_1);return head.startsWith("GIF87a")||head.startsWith("GIF89a")||head.startsWith("BM")||head.startsWith("RIFF")&&head.length()>=12&&head.substring(8,12).equals("WEBP")||head.length()>=12&&head.substring(4,8).equals("ftyp")&&head.substring(8,12).matches("avif|avis|heic|heix|hevc|hevx|mif1|msf1");}
    public File file(String id)throws IOException{if(id==null||!id.matches("[a-f0-9]{64}"))throw new IOException("Invalid image ID");File file=new File(directory,id+".jpg");if(!file.isFile())throw new IOException("图片附件已不存在");return file;}
    public String data(String id)throws IOException{File file=file(id);if(file.length()>900000)throw new IOException("图片超出传输限制");ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=new FileInputStream(file)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}return "data:image/jpeg;base64,"+Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);}
}
