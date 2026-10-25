#define _GNU_SOURCE
#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <dirent.h>
#include <errno.h>
#include <signal.h>
#include <sys/syscall.h>
#include <sys/resource.h>

static void failure(JNIEnv *env,const char *message){jclass type=(*env)->FindClass(env,"java/io/IOException");if(type)(*env)->ThrowNew(env,type,message);}
static char *copy_string(JNIEnv *env,jstring value){
    if(!value){failure(env,"Null native argument");return NULL;}
    /* execve expects standard UTF-8, not JNI's modified UTF-8 for emoji/NUL. */
    jclass type=(*env)->FindClass(env,"java/lang/String");if(!type)return NULL;
    jmethodID encode=(*env)->GetMethodID(env,type,"getBytes","(Ljava/lang/String;)[B");
    jstring charset=(*env)->NewStringUTF(env,"UTF-8");
    if(!encode||!charset){(*env)->DeleteLocalRef(env,type);return NULL;}
    jbyteArray bytes=(*env)->CallObjectMethod(env,value,encode,charset);
    (*env)->DeleteLocalRef(env,charset);(*env)->DeleteLocalRef(env,type);
    if((*env)->ExceptionCheck(env)||!bytes)return NULL;
    jsize length=(*env)->GetArrayLength(env,bytes);char *copy=calloc((size_t)length+1,1);
    if(copy)(*env)->GetByteArrayRegion(env,bytes,0,length,(jbyte*)copy);
    (*env)->DeleteLocalRef(env,bytes);
    if(!copy){failure(env,"Native allocation failed");return NULL;}
    if(memchr(copy,0,(size_t)length)){free(copy);failure(env,"NUL is not allowed in process arguments");return NULL;}
    return copy;
}
static void free_array(char **array){if(array){for(char **p=array;*p;p++)free(*p);free(array);}}
static char **copy_array(JNIEnv *env,jobjectArray input){jsize length=input?(*env)->GetArrayLength(env,input):0;if(length>256){failure(env,"Too many native arguments");return NULL;}char **values=calloc((size_t)length+1,sizeof(char*));if(!values){failure(env,"Native allocation failed");return NULL;}for(jsize i=0;i<length;i++){jstring s=(*env)->GetObjectArrayElement(env,input,i);values[i]=copy_string(env,s);if(s)(*env)->DeleteLocalRef(env,s);if(!values[i]){free_array(values);return NULL;}}return values;}

static jintArray spawn(JNIEnv *env,jstring command,jstring cwd,jobjectArray arguments,jobjectArray environment,int with_stdin){
    char *cmd=copy_string(env,command),*directory=NULL;char **argv=NULL,**envp=NULL;
    int output[2]={-1,-1},error[2]={-1,-1},input_pipe[2]={-1,-1};jintArray result=NULL;
    if(!cmd)goto done;directory=copy_string(env,cwd);if(!directory)goto done;
    argv=copy_array(env,arguments);if(!argv)goto done;envp=copy_array(env,environment);if(!envp)goto done;
    if(pipe2(output,O_CLOEXEC)||pipe2(error,O_CLOEXEC)||(with_stdin&&pipe2(input_pipe,O_CLOEXEC))){failure(env,"Cannot create command pipes");goto done;}
    pid_t pid=fork();if(pid<0){failure(env,"Cannot fork command process");goto done;}
    if(pid==0){
        /* Java threads may block SIGQUIT. The PRoot cancellation handler must
         * receive it after exec; otherwise its descendants keep running. */
        sigset_t unblocked;sigfillset(&unblocked);sigprocmask(SIG_UNBLOCK,&unblocked,NULL);
        setsid();int input=with_stdin?input_pipe[0]:open("/dev/null",O_RDONLY);
        if(input<0||dup2(input,STDIN_FILENO)<0||dup2(output[1],STDOUT_FILENO)<0||dup2(error[1],STDERR_FILENO)<0)_exit(126);
        /* Close inherited WebView and Java descriptors before exec. */
#ifdef __NR_close_range
        if(syscall(__NR_close_range,3U,~0U,0)<0)
#endif
        {DIR *fds=opendir("/proc/self/fd");if(fds){int keep=dirfd(fds);struct dirent *entry;while((entry=readdir(fds))){int fd=atoi(entry->d_name);if(fd>2&&fd!=keep)close(fd);}closedir(fds);}else{struct rlimit bound;if(getrlimit(RLIMIT_NOFILE,&bound)==0)for(rlim_t fd=3;fd<bound.rlim_cur;fd++)close((int)fd);}}
        if(chdir(directory)<0){const char message[]="Cannot enter project directory\n";write(STDERR_FILENO,message,sizeof(message)-1);_exit(126);}
        execve(cmd,argv,envp);const char message[]="Cannot execute packaged native launcher\n";write(STDERR_FILENO,message,sizeof(message)-1);_exit(127);
    }
    close(output[1]);output[1]=-1;close(error[1]);error[1]=-1;
    if(with_stdin){close(input_pipe[0]);input_pipe[0]=-1;}
    jint values[4]={(jint)pid,(jint)output[0],(jint)error[0],(jint)input_pipe[1]};int count=with_stdin?4:3;result=(*env)->NewIntArray(env,count);
    if(result){(*env)->SetIntArrayRegion(env,result,0,count,values);output[0]=error[0]=input_pipe[1]=-1;}else{kill(pid,SIGQUIT);}
done:
    for(int i=0;i<2;i++){if(output[i]>=0)close(output[i]);if(error[i]>=0)close(error[i]);if(input_pipe[i]>=0)close(input_pipe[i]);}
    free(cmd);free(directory);free_array(argv);free_array(envp);return result;
}
JNIEXPORT jintArray JNICALL Java_io_github_deepseekbridge_NativePty_spawnPiped(JNIEnv *env,jclass ignored,jstring command,jstring cwd,jobjectArray arguments,jobjectArray environment){(void)ignored;return spawn(env,command,cwd,arguments,environment,0);}
JNIEXPORT jintArray JNICALL Java_io_github_deepseekbridge_NativePty_spawnStdio(JNIEnv *env,jclass ignored,jstring command,jstring cwd,jobjectArray arguments,jobjectArray environment){(void)ignored;return spawn(env,command,cwd,arguments,environment,1);}
