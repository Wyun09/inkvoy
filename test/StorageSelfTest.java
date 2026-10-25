import io.github.deepseekbridge.EncryptedStateStore;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import javax.crypto.*;
public final class StorageSelfTest {
    static int checks;
    static void check(boolean condition) { if (!condition) throw new AssertionError(); checks++; }
    public static void main(String[] args) throws Exception {
        Path root = Files.createTempDirectory("bridge-state-test-"); File target = root.resolve("state.enc").toFile();
        KeyGenerator generator = KeyGenerator.getInstance("AES"); generator.init(256); SecretKey key = generator.generateKey();
        EncryptedStateStore store = new EncryptedStateStore(target, key);
        check(store.load().equals("{}"));
        String value = "{\"task\":\"PRIVATE_FIXTURE_中文\"}";
        store.save(value); check(store.load().equals(value));
        byte[] first = Files.readAllBytes(target.toPath()); check(!new String(first, StandardCharsets.ISO_8859_1).contains("PRIVATE_FIXTURE"));
        store.save(value); byte[] second = Files.readAllBytes(target.toPath()); check(!java.util.Arrays.equals(first, second));
        check(new EncryptedStateStore(target, key).load().equals(value));
        try { new EncryptedStateStore(target, generator.generateKey()).load(); throw new AssertionError(); } catch (GeneralSecurityException expected) { checks++; }
        second[second.length - 1] ^= 1; Files.write(target.toPath(), second);
        try { store.load(); throw new AssertionError(); } catch (GeneralSecurityException expected) { checks++; }
        store.save(value); check(store.load().equals(value));
        try { store.save(new String(new char[EncryptedStateStore.MAX_BYTES + 1]).replace('\0', 'x')); throw new AssertionError(); } catch (IOException expected) { checks++; }
        check(store.load().equals(value)); check(!root.resolve("state.enc.pending").toFile().exists());
        System.out.println("STORAGE_PASS assertions=" + checks);
    }
}
