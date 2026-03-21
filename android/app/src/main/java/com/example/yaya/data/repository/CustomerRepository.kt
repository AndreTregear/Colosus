package com.example.yaya.data.repository

import com.example.yaya.data.local.db.CustomerDao
import com.example.yaya.data.model.CustomerEntity
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.CustomerDto
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerRepository @Inject constructor(
    private val apiService: YayaApiService,
    private val customerDao: CustomerDao
) {
    suspend fun getCustomers(): Result<List<CustomerDto>> =
        safeApiCall { apiService.getCustomers() }
            .map { it.customers }
            .onSuccess { customers -> customerDao.insertAll(customers.map { it.toEntity() }) }
            .recoverCatching {
                val cached = customerDao.getAll()
                if (cached.isNotEmpty()) cached.map { it.toDto() }
                else throw it
            }

    suspend fun getCustomerById(id: Int): Result<CustomerDto> =
        safeApiCall { apiService.getCustomerById(id) }
}

private fun CustomerDto.toEntity() = CustomerEntity(
    id = id, channel = channel, jid = jid, name = name,
    phone = phone, location = location, address = address, notes = notes
)

private fun CustomerEntity.toDto() = CustomerDto(
    id = id, tenantId = "", channel = channel, jid = jid, name = name,
    phone = phone, location = location, address = address, notes = notes,
    createdAt = "", updatedAt = ""
)
