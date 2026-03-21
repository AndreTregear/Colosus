package com.example.yaya.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val productType: String,
    val stock: Int?,
    val imageUrl: String?,
    val active: Boolean,
    val cachedAt: Long = System.currentTimeMillis()
)
