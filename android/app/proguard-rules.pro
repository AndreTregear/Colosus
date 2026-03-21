# Yaya ProGuard/R8 Rules

# --- Retrofit ---
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>

# --- Moshi ---
-keep @com.squareup.moshi.JsonClass class * { *; }
-keepclassmembers class * {
    @com.squareup.moshi.FromJson <methods>;
    @com.squareup.moshi.ToJson <methods>;
}
-keep class **JsonAdapter { *; }
-keep class com.example.yaya.data.remote.dto.** { *; }

# --- Room ---
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }

# --- Enums (used by Room type converters and Moshi) ---
-keepclassmembers enum * { *; }

# --- OkHttp ---
-dontwarn okhttp3.**
-dontwarn okio.**

# --- EncryptedSharedPreferences ---
-keep class androidx.security.crypto.** { *; }

# --- Hilt ---
-dontwarn dagger.hilt.**

# --- SSE Event types ---
-keep class com.example.yaya.data.remote.SseEvent { *; }
-keep class com.example.yaya.data.remote.SseEvent$* { *; }

# --- Source file names for crash reports ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
