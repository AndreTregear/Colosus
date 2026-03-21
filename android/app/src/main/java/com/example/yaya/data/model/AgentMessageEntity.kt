package com.example.yaya.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "agent_messages")
data class AgentMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val remoteId: String? = null,
    val role: String,
    val content: String,
    val contentType: String = "text",
    val dataJson: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
