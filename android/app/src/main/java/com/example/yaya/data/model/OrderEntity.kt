package com.example.yaya.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey
    val id: Int,
    val customerId: Int,
    val status: String,
    val total: Double,
    val deliveryType: String,
    val deliveryAddress: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val cachedAt: Long = System.currentTimeMillis()
)
