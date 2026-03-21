package com.example.yaya.data.remote

sealed class ApiError : Exception() {
    data class Http(val code: Int, val errorBody: String?) : ApiError() {
        override val message: String get() = "HTTP $code${errorBody?.let { ": $it" } ?: ""}"
    }

    data class Network(override val cause: Throwable) : ApiError() {
        override val message: String get() = "Error de conexion"
    }

    data class EmptyBody(val code: Int) : ApiError() {
        override val message: String get() = "Respuesta vacia ($code)"
    }

    data object Unauthorized : ApiError() {
        override val message: String get() = "Sesion expirada"
    }

    data class Unknown(override val cause: Throwable) : ApiError() {
        override val message: String get() = cause.message ?: "Error desconocido"
    }
}
