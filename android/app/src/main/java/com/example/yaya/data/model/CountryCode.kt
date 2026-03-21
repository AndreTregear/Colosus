package com.example.yaya.data.model

data class CountryCode(
    val code: String,
    val country: String,
    val flag: String,
    val iso: String
)

object CountryCodes {
    val all = listOf(
        CountryCode("+51", "Peru", "\uD83C\uDDF5\uD83C\uDDEA", "PE"),
        CountryCode("+52", "Mexico", "\uD83C\uDDF2\uD83C\uDDFD", "MX"),
        CountryCode("+54", "Argentina", "\uD83C\uDDE6\uD83C\uDDF7", "AR"),
        CountryCode("+55", "Brasil", "\uD83C\uDDE7\uD83C\uDDF7", "BR"),
        CountryCode("+56", "Chile", "\uD83C\uDDE8\uD83C\uDDF1", "CL"),
        CountryCode("+57", "Colombia", "\uD83C\uDDE8\uD83C\uDDF4", "CO"),
        CountryCode("+58", "Venezuela", "\uD83C\uDDFB\uD83C\uDDEA", "VE"),
        CountryCode("+591", "Bolivia", "\uD83C\uDDE7\uD83C\uDDF4", "BO"),
        CountryCode("+593", "Ecuador", "\uD83C\uDDEA\uD83C\uDDE8", "EC"),
        CountryCode("+595", "Paraguay", "\uD83C\uDDF5\uD83C\uDDFE", "PY"),
        CountryCode("+598", "Uruguay", "\uD83C\uDDFA\uD83C\uDDFE", "UY"),
        CountryCode("+1", "Estados Unidos", "\uD83C\uDDFA\uD83C\uDDF8", "US"),
        CountryCode("+34", "Espana", "\uD83C\uDDEA\uD83C\uDDF8", "ES"),
    )
    val default = all.first()
}
