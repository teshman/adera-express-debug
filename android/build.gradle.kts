// android/build.gradle.kts
// Root build file for configuring all modules and defining buildscript dependencies

plugins {
    id("com.android.application") version "8.4.0" apply false // Android Gradle Plugin version
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false // Kotlin version
    id("com.google.gms.google-services") version "4.4.2" apply false // Firebase Google Services plugin
    id("com.android.library") version "8.4.0" apply false // Android Library Plugin (for modules)
}

buildscript {
    val kotlinVersion = "1.9.0"
    val googleServicesVersion = "4.4.2"
    val androidGradlePluginVersion = "8.4.0"

    dependencies {
        classpath("com.android.tools.build:gradle:$androidGradlePluginVersion")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
        classpath("com.google.gms:google-services:$googleServicesVersion")
        classpath("com.google.firebase:firebase-crashlytics-gradle:2.9.9")
    }
}

allprojects {
    extra["minSdkVersion"] = 24
    extra["compileSdkVersion"] = 35
    extra["targetSdkVersion"] = 35

    extra["hermesEnabled"] = true
    extra["jscFlavor"] = "org.webkit:android-jsc:r250230"
}

tasks.register<Delete>("clean") {
    delete(rootProject.buildDir)
}
