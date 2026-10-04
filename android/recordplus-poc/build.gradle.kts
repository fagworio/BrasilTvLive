import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.Exec

plugins {
    id("com.android.application")
}

// Package the same Vite/React app used by Electron into the APK. The web
// bundle is generated into the ignored assets directory so a clean checkout
// can reproduce the APK without committing build output.
val webProjectDir = rootProject.projectDir.parentFile
val buildWebApp = tasks.register<Exec>("buildWebApp") {
    workingDir(webProjectDir)
    commandLine("npm", "run", "build")
}
val syncWebAssets = tasks.register<Copy>("syncWebAssets") {
    dependsOn(buildWebApp)
    from(webProjectDir.resolve("dist"))
    into(projectDir.resolve("src/main/assets/web"))
}
tasks.named("preBuild") { dependsOn(syncWebAssets) }

android {
    namespace = "com.fagworio.brasiltvlive.recordpluspoc"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fagworio.brasiltvlive.recordpluspoc"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Social authentication must run in a browser/Custom Tab. Google blocks
    // OAuth inside embedded Android WebViews.
    implementation("androidx.browser:browser:1.8.0")
    implementation("androidx.webkit:webkit:1.12.1")
    // Android 9 WebView exposes MediaSource but cannot reliably decode the
    // MPEG-TS HLS feeds used by the public broadcasters. Keep the shared
    // React surface, and use Media3 only as the native HLS rendering path.
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.4.1")
}
