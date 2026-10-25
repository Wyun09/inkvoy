# Android startup regression tests

These tests run the production Java classes with Robolectric 4.16.1 and AOSP
native SQLite on Android API 26 and 33. They do not replace a physical phone,
WebView page rendering or native PRoot/PTY verification.

Using JDK 17 and Maven 3.9.11:

```powershell
py scripts/provision-android-test.py
mvn -B -ntp -f test/android-runtime/pom.xml test
```

The two small JARs under `lib/` are the classes from AndroidX Test Monitor 1.8.0
and Espresso Idling Resource 3.7.0 AARs, supplied to this standalone Maven test
module because Maven does not expand Android AARs. Their URLs and input/output
hashes are in `lib/origins.json`. Both AndroidX components are Apache-2.0,
copyright The Android Open Source Project; a copy of Apache-2.0 is supplied at
`third_party/termux-pty/LICENSE.txt`. These are test-only dependencies, never
part of the APK. The Maven local-path warning does not affect the standalone
test run; this test module is not published for other modules to depend on.

The regression requires the old `execSQL("PRAGMA journal_mode=WAL")` call to
raise Android's row-returning-query exception. The corrected production
initializer must enable WAL with the Android API, use FULL synchronization,
and preserve completed tool results after reopening. Other cases cover lazy
database opening, a failed service constructor, bounded redacted diagnostics,
and the launcher's native recovery page.

The runtime-asset cases require an APK built by `scripts/build-apk.ps1`.
They default to `build/resources.apk`; to test the signed release directly:

```powershell
mvn -B -ntp -Dstudio.testApk=C:\build\deepseek-android-bridge-v2.0.2.apk -f test/android-runtime/pom.xml test
```

They verify canonical paths through Android AssetManager, raw ZIP entry names,
the entire offline image's length and SHA-256, compatibility with a controlled
legacy backslash APK, retryable manifest loading and nonblocking status reads.
Permission cases exercise app-specific settings intents and AppOps grant state.
The complete suite has 27 cases across API 26 and 33. Renderer process lifetime,
offscreen rendering and battery management still require a real Android device;
Robolectric's WebView does not model a running Chromium renderer.
