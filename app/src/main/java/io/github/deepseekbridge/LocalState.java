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
    private boolean available;
    private String reason = "unavailable";
    public LocalState(Context context) {
        try {
            KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null);
            final String alias = "deepseek-bridge-local-state-v1";
            if (!keys.containsAlias(alias)) {
                KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
                generator.generateKey();
            }
            store = new EncryptedStateStore(new File(context.getFilesDir(), "bridge-state-v1.enc"), (SecretKey) keys.getKey(alias, null));
            store.load(); available = true; reason = "ready";
        } catch (Exception error) { available = false; reason = "unreadable"; }
    }
    public synchronized String load() {
        if (!available) return "{}";
        try { return store.load(); }
        catch (Exception error) { available = false; reason = "unreadable"; return "{}"; }
    }
    public synchronized boolean save(String value) {
        if (!available) return false;
        try { store.save(value); return true; }
        catch (Exception error) { available = false; reason = "write_failed"; return false; }
    }
    public synchronized String status() { return "{\"available\":" + available + ",\"encrypted\":" + available + ",\"reason\":\"" + reason + "\"}"; }
}
