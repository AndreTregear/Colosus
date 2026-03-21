package com.example.yaya.data.remote.interceptor

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class BaseUrlInterceptor @Inject constructor() : Interceptor {

    @Volatile
    var cachedBaseUrl: String = ""

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val baseUrl = cachedBaseUrl

        if (baseUrl.isBlank()) {
            return chain.proceed(original)
        }

        val newUrl = baseUrl.toHttpUrlOrNull() ?: return chain.proceed(original)

        val updatedUrl = original.url.newBuilder()
            .scheme(newUrl.scheme)
            .host(newUrl.host)
            .port(newUrl.port)
            .build()

        val updatedRequest = original.newBuilder()
            .url(updatedUrl)
            .build()

        return chain.proceed(updatedRequest)
    }
}
