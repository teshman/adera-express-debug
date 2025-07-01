// C:\Melakia\adera_express\android\settings.gradle.kts

// This MUST be the first actual block in the file (after comments)
pluginManagement {
    // This tells Gradle to look for plugins within your local node_modules composite build
    includeBuild("../node_modules/@react-native/gradle-plugin")
    
    // These repositories are for resolving other plugins that might be applied
    // (e.g., Android Gradle Plugin, Kotlin Gradle Plugin)
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

// These plugins are applied at the settings script level
// This makes the 'com.facebook.react.settings' plugin available to the settings file itself.
plugins {
    id("com.facebook.react.settings")
}

// Configure the React Native settings extension using the reified type parameter.
// 'settings.' explicitly indicates that 'extensions' is part of the settings object.
// 'this' inside this lambda refers directly to the ReactSettingsExtension instance.
settings.extensions.configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand() // Or .autolinkLibrariesWithApp()
}

// The root project name
rootProject.name = "adera_express"

// Explicitly define the project directory for the :app module
// This is critical for the "double android" path issue and correct module inclusion.
include(":app")
project(":app").projectDir = file("app")
// Manually include React Native Firebase modules (to override potential autolinking issues with naming)
include(":react-native-firebase-app")
include(":react-native-firebase-app")
project(":react-native-firebase-app").projectDir = file("../node_modules/@react-native-firebase/app/android")

include(":react-native-firebase-auth")
project(":react-native-firebase-auth").projectDir = file("../node_modules/@react-native-firebase/auth/android")


// This block configures how *dependencies* (not plugins) are resolved for all projects
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
        // Add any other custom maven repositories here that your project might need for dependencies
        // maven { url = uri("https://www.jitpack.io") }
    }
}