package io.github.deepseekbridge;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import java.io.File;
import java.security.KeyStore;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

/** Only the packaged engine has access to this private, Keystore-backed file. */
public final class LocalState {
    private EncryptedStateStore store;
    private volatile boolean available;
    private volatile String cached = "{}";
    private volatile String diagnostic = "{\"available\":false,\"encrypted\":false,\"reason\":\"unavailable\"}";
    public LocalState(Context context) {
        this(context, "bridge-state-v1", "deepseek-bridge-local-state-v1");
    }
    LocalState(EncryptedStateStore store) throws Exception { this.store = store; cached = store.load(); state(true, "ready"); }
    public LocalState(Context context, String filename, String alias) {
        try {
            KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null);
            if (!keys.containsAlias(alias)) {
                KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
                generator.generateKey();
            }
            store = new EncryptedStateStore(new File(context.getFilesDir(), filename + ".enc"), (SecretKey) keys.getKey(alias, null));
            cached = store.load(); state(true, "ready");
        } catch (Exception error) { state(false, "unreadable"); }
    }
    // Readers never wait on Keystore encryption or an fsync in the writer.
    public String load() { return cached; }
    public synchronized boolean save(String value) {
        if (!available) return false;
        if (cached.equals(value)) return true;
        try { store.save(value); cached = value; return true; }
        catch (Exception error) { state(false, "write_failed"); return false; }
    }
    private void state(boolean ok, String reason) { available = ok; diagnostic = "{\"available\":" + ok + ",\"encrypted\":" + ok + ",\"reason\":\"" + reason + "\"}"; }
    public String status() { return diagnostic; }
}
