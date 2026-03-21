package com.example.yaya.data.remote.interceptor

import com.example.yaya.security.TokenManager
import io.mockk.every
import io.mockk.mockk
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class AuthInterceptorTest {

    private lateinit var server: MockWebServer
    private lateinit var tokenManager: TokenManager
    private lateinit var client: OkHttpClient

    @Before
    fun setup() {
        server = MockWebServer()
        server.start()
        tokenManager = mockk()
        val interceptor = AuthInterceptor(tokenManager)
        client = OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .build()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `adds Authorization header when token exists`() {
        every { tokenManager.getToken() } returns "test-token"
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/mobile/orders"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertEquals("Bearer test-token", request.getHeader("Authorization"))
    }

    @Test
    fun `skips auth header for login endpoint`() {
        every { tokenManager.getToken() } returns "test-token"
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/mobile/auth/login"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
    }

    @Test
    fun `skips auth header for register endpoint`() {
        every { tokenManager.getToken() } returns "test-token"
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/mobile/auth/register"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
    }

    @Test
    fun `skips auth header for refresh endpoint`() {
        every { tokenManager.getToken() } returns "test-token"
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/mobile/auth/refresh"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
    }

    @Test
    fun `skips auth header for health endpoint`() {
        every { tokenManager.getToken() } returns "test-token"
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/health"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
    }

    @Test
    fun `does not add header when token is null`() {
        every { tokenManager.getToken() } returns null
        server.enqueue(MockResponse().setBody("ok"))

        client.newCall(
            Request.Builder()
                .url(server.url("/api/v1/mobile/orders"))
                .build()
        ).execute()

        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
    }
}
