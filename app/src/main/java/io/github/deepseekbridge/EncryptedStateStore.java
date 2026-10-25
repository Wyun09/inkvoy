package io.github.deepseekbridge;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import java.util.Arrays;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.SecretKey;

/** Bounded, authenticated and atomic local state. The key is supplied by the
 * Android Keystore in production; host tests use an isolated generated key. */
public final class EncryptedStateStore {
    public static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final byte[] MAGIC = { 68, 83, 72, 49 };
    private final File file;
    private final SecretKey key;
    public EncryptedStateStore(File file, SecretKey key) { this.file = file; this.key = key; }
    public synchronized String load() throws IOException, GeneralSecurityException {
        if (!file.exists()) return "{}";
        if (file.length() > MAX_BYTES + 64 || file.length() < 32) throw new IOException("Invalid local state size");
        byte[] data = Files.readAllBytes(file.toPath());
        if (!Arrays.equals(MAGIC, Arrays.copyOf(data, 4))) throw new IOException("Unknown local state version");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, Arrays.copyOfRange(data, 4, 16)));
        cipher.updateAAD(MAGIC);
        return new String(cipher.doFinal(Arrays.copyOfRange(data, 16, data.length)), StandardCharsets.UTF_8);
    }
    public synchronized void save(String value) throws IOException, GeneralSecurityException {
        byte[] plain = value.getBytes(StandardCharsets.UTF_8);
        if (plain.length > MAX_BYTES) throw new IOException("Local state exceeds limit");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key); // Keystore generates a fresh IV.
        byte[] iv = cipher.getIV(); if (iv.length != 12) throw new GeneralSecurityException("Unexpected GCM IV length");
        cipher.updateAAD(MAGIC); byte[] encrypted = cipher.doFinal(plain);
        File parent = file.getParentFile(); if (!parent.isDirectory() && !parent.mkdirs()) throw new IOException("Local state folder unavailable");
        File temp = new File(parent, file.getName() + ".pending");
        try (FileOutputStream output = new FileOutputStream(temp)) { output.write(MAGIC); output.write(iv); output.write(encrypted); output.getFD().sync(); }
        try { Files.move(temp.toPath(), file.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); }
        catch (AtomicMoveNotSupportedException error) { Files.move(temp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING); }
    }
}
