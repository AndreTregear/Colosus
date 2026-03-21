package com.example.yaya.data.remote

import retrofit2.Response
import java.net.SocketTimeoutException
import java.net.UnknownHostException

suspend fun <T> safeApiCall(
    apiCall: suspend () -> Response<T>
): Result<T> {
    return try {
        val response = apiCall()
        when {
            response.code() == 401 -> Result.failure(ApiError.Unauthorized)
            response.isSuccessful && response.body() != null -> Result.success(response.body()!!)
            response.isSuccessful -> Result.failure(ApiError.EmptyBody(response.code()))
            else -> Result.failure(
                ApiError.Http(response.code(), response.errorBody()?.string())
            )
        }
    } catch (e: UnknownHostException) {
        Result.failure(ApiError.Network(e))
    } catch (e: SocketTimeoutException) {
        Result.failure(ApiError.Network(e))
    } catch (e: java.io.IOException) {
        Result.failure(ApiError.Network(e))
    } catch (e: Exception) {
        Result.failure(ApiError.Unknown(e))
    }
}
