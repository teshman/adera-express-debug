// File: android/app/build.gradle.kts

// Imports are removed as they are not explicitly used in this standard configuration.
// import java.io.ByteArrayOutputStream
// import java.io.File

plugins {
    id("com.android.application")
    id("com.facebook.react") // The main React Native Gradle plugin
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services") // Firebase plugin
}
react {
    // Set the root of your project using a hardcoded absolute path.
    // Make sure this path points directly to your project's root folder (where package.json is).
    root.set(file("C:/Melakia/adera_express")) 
}

android {
    namespace = "adera.express"
    // Using rootProject.extra for SDK versions is a common and good practice
    compileSdk = (rootProject.extra["compileSdkVersion"] as Int)

    defaultConfig {
        applicationId = "adera.express"
        minSdk = (rootProject.extra["minSdkVersion"] as Int)
        targetSdk = (rootProject.extra["targetSdkVersion"] as Int)
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
    }

    buildTypes {
        release {
            isMinifyEnabled = project.properties["enableProguardInReleaseBuilds"]?.toString()?.toBoolean() ?: false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    packaging.resources.excludes += setOf("/META-INF/{AL2.0,LGPL2.1}")

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions.jvmTarget = JavaVersion.VERSION_17.toString()
}

dependencies {
    val hermesEnabled = rootProject.extra["hermesEnabled"] as? Boolean ?: false
    val jscFlavor = rootProject.extra["jscFlavor"] as? String ?: "org.webkit:android-jsc:r250230"

    if (hermesEnabled) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation(jscFlavor)
    }
    implementation("androidx.annotation:annotation:1.7.1")
    implementation("androidx.core:core-ktx:1.10.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.annotation:annotation:1.9.1")

    // Core React Native Android dependency.
    implementation("com.facebook.react:react-android:0.80.0")

    implementation(platform("com.google.firebase:firebase-bom:33.15.0"))
    implementation("com.google.firebase:firebase-analytics")
    
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-functions")
    implementation("com.google.firebase:firebase-storage")

    implementation("androidx.navigation:navigation-fragment-ktx:2.7.7")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.7")
    implementation("androidx.activity:activity-ktx:1.8.0")
    implementation("androidx.fragment:fragment-ktx:1.6.0")

    // Autolinking handles linking native modules from node_modules.
    // Do NOT add 'implementation(project(":module-name"))' lines here.

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")

    implementation(project(":react-native-firebase-app"))
    implementation(project(":react-native-firebase-auth"))
}

// Custom autolinking generation tasks are managed by the @react-native/gradle-plugin.
// Do NOT add custom logic for autolinking generation here.