package com.example.yaya.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey
    val id: Int,
    val channel: String,
    val jid: String,
    val name: String?,
    val phone: String?,
    val location: String?,
    val address: String?,
    val notes: String?,
    val cachedAt: Long = System.currentTimeMillis()
)
