package com.example.yaya.ui.screens.onboarding

import android.content.Intent
import android.graphics.BitmapFactory
import android.provider.Settings
import android.util.Base64
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeliveryDining
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import com.example.yaya.data.model.CountryCodes
import com.example.yaya.ui.components.CountryCodePicker
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.PendingAmber
import com.example.yaya.ui.theme.RejectedRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    onOnboardingComplete: () -> Unit,
    viewModel: OnboardingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Check notification access on resume (for NOTIFICATION_ACCESS step)
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            val enabledListeners = Settings.Secure.getString(
                context.contentResolver,
                "enabled_notification_listeners"
            )
            viewModel.checkNotificationAccess(enabledListeners)
        }
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Progress bar at top
        if (uiState.step != OnboardingStep.WELCOME && uiState.step != OnboardingStep.DONE) {
            LinearProgressIndicator(
                progress = { uiState.currentStepIndex.toFloat() / uiState.totalSteps.toFloat() },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Step content
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (uiState.step) {
                OnboardingStep.WELCOME -> WelcomeStep(
                    onStart = { viewModel.nextStep() }
                )

                OnboardingStep.BUSINESS_TYPE -> BusinessTypeStep(
                    selectedType = uiState.businessType,
                    onTypeSelected = viewModel::updateBusinessType,
                    error = uiState.error,
                    onNext = { viewModel.nextStep() },
                    onBack = { viewModel.previousStep() }
                )

                OnboardingStep.BUSINESS_INFO -> BusinessInfoStep(
                    businessName = uiState.businessName,
                    phoneNumber = uiState.phoneNumber,
                    countryCode = uiState.countryCode,
                    address = uiState.address,
                    yapeNumber = uiState.yapeNumber,
                    error = uiState.error,
                    onBusinessNameChange = viewModel::updateBusinessName,
                    onPhoneNumberChange = viewModel::updatePhoneNumber,
                    onCountryCodeChange = viewModel::updateCountryCode,
                    onAddressChange = viewModel::updateAddress,
                    onYapeNumberChange = viewModel::updateYapeNumber,
                    onNext = { viewModel.nextStep() },
                    onBack = { viewModel.previousStep() }
                )

                OnboardingStep.ACCOUNT_CREATION -> AccountCreationStep(
                    phoneNumber = uiState.phoneNumber,
                    countryCode = uiState.countryCode,
                    password = uiState.password,
                    confirmPassword = uiState.confirmPassword,
                    isLoginMode = uiState.isLoginMode,
                    isLoading = uiState.isLoading,
                    error = uiState.error,
                    onPhoneNumberChange = viewModel::updatePhoneNumber,
                    onCountryCodeChange = viewModel::updateCountryCode,
                    onPasswordChange = viewModel::updatePassword,
                    onConfirmPasswordChange = viewModel::updateConfirmPassword,
                    onToggleLoginMode = viewModel::toggleLoginMode,
                    onSubmit = viewModel::registerOrLogin,
                    onBack = { viewModel.previousStep() }
                )

                OnboardingStep.WHATSAPP_CONNECTION -> WhatsAppConnectionStep(
                    whatsappStatus = uiState.whatsappStatus,
                    qrDataUrl = uiState.qrDataUrl,
                    isLoading = uiState.isLoading,
                    error = uiState.error,
                    onConnect = viewModel::connectWhatsApp,
                    onNext = { viewModel.nextStep() },
                    onSkip = { viewModel.skipStep() }
                )

                OnboardingStep.FIRST_PRODUCT -> FirstProductStep(
                    productName = uiState.firstProductName,
                    productPrice = uiState.firstProductPrice,
                    isLoading = uiState.isLoading,
                    productAdded = uiState.firstProductAdded,
                    error = uiState.error,
                    onProductNameChange = viewModel::updateFirstProductName,
                    onProductPriceChange = viewModel::updateFirstProductPrice,
                    onAddProduct = viewModel::addFirstProduct,
                    onNext = { viewModel.nextStep() },
                    onSkip = { viewModel.skipStep() }
                )

                OnboardingStep.NOTIFICATION_ACCESS -> NotificationAccessStep(
                    isEnabled = uiState.notificationAccessEnabled,
                    onOpenSettings = {
                        context.startActivity(
                            Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                        )
                    },
                    onNext = { viewModel.nextStep() }
                )

                OnboardingStep.DONE -> DoneStep(
                    businessType = uiState.businessType,
                    businessName = uiState.businessName,
                    whatsappConnected = uiState.whatsappStatus == "connected",
                    isLoading = uiState.isLoading,
                    onFinish = {
                        viewModel.completeOnboarding()
                        onOnboardingComplete()
                    }
                )
            }
        }
    }
}

// ── WELCOME ─────────────────────────────────────────

@Composable
private fun WelcomeStep(
    onStart: () -> Unit
) {
    Spacer(modifier = Modifier.height(64.dp))

    Icon(
        imageVector = Icons.Default.Store,
        contentDescription = null,
        modifier = Modifier.size(120.dp),
        tint = MaterialTheme.colorScheme.primary
    )

    Spacer(modifier = Modifier.height(32.dp))

    Text(
        text = "Bienvenido a Yaya",
        style = MaterialTheme.typography.headlineLarge,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        textAlign = TextAlign.Center
    )

    Spacer(modifier = Modifier.height(12.dp))

    Text(
        text = "Tu asistente de ventas por WhatsApp",
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
    )

    Spacer(modifier = Modifier.height(64.dp))

    Button(
        onClick = onStart,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Comenzar")
    }
}

// ── BUSINESS TYPE ───────────────────────────────────

@Composable
private fun BusinessTypeStep(
    selectedType: String,
    onTypeSelected: (String) -> Unit,
    error: String?,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    Text(
        text = "Que tipo de negocio tienes?",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(24.dp))

    BusinessTypeCard(
        icon = Icons.Default.ShoppingBag,
        title = "Tienda",
        description = "Venta de productos",
        isSelected = selectedType == "tienda",
        onClick = { onTypeSelected("tienda") }
    )

    Spacer(modifier = Modifier.height(12.dp))

    BusinessTypeCard(
        icon = Icons.Default.CalendarMonth,
        title = "Servicio",
        description = "Citas y reservas",
        isSelected = selectedType == "servicio",
        onClick = { onTypeSelected("servicio") }
    )

    Spacer(modifier = Modifier.height(12.dp))

    BusinessTypeCard(
        icon = Icons.Default.DeliveryDining,
        title = "Delivery",
        description = "Entregas a domicilio",
        isSelected = selectedType == "delivery",
        onClick = { onTypeSelected("delivery") }
    )

    if (error != null) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }

    Spacer(modifier = Modifier.height(32.dp))

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.weight(1f)
        ) {
            Text("Atras")
        }

        Button(
            onClick = onNext,
            modifier = Modifier.weight(1f),
            enabled = selectedType.isNotBlank()
        ) {
            Text("Siguiente")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BusinessTypeCard(
    icon: ImageVector,
    title: String,
    description: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    OutlinedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        border = if (isSelected) {
            BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
        } else {
            BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = if (isSelected) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

// ── BUSINESS INFO ───────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BusinessInfoStep(
    businessName: String,
    phoneNumber: String,
    countryCode: String,
    address: String,
    yapeNumber: String,
    error: String?,
    onBusinessNameChange: (String) -> Unit,
    onPhoneNumberChange: (String) -> Unit,
    onCountryCodeChange: (String) -> Unit,
    onAddressChange: (String) -> Unit,
    onYapeNumberChange: (String) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    val selectedCountry = remember(countryCode) {
        CountryCodes.all.find { it.code == countryCode } ?: CountryCodes.default
    }

    Text(
        text = "Informacion de tu negocio",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(24.dp))

    OutlinedTextField(
        value = businessName,
        onValueChange = onBusinessNameChange,
        label = { Text("Nombre del negocio") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true
    )

    Spacer(modifier = Modifier.height(16.dp))

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        CountryCodePicker(
            selectedCountry = selectedCountry,
            onCountrySelected = { country ->
                onCountryCodeChange(country.code)
            },
            modifier = Modifier.width(120.dp)
        )

        Spacer(modifier = Modifier.width(8.dp))

        OutlinedTextField(
            value = phoneNumber,
            onValueChange = onPhoneNumberChange,
            label = { Text("Numero de telefono") },
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = address,
        onValueChange = onAddressChange,
        label = { Text("Direccion (opcional)") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = yapeNumber,
        onValueChange = onYapeNumberChange,
        label = { Text("Numero de Yape (opcional)") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
    )

    if (error != null) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }

    Spacer(modifier = Modifier.height(32.dp))

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.weight(1f)
        ) {
            Text("Atras")
        }

        Button(
            onClick = onNext,
            modifier = Modifier.weight(1f)
        ) {
            Text("Siguiente")
        }
    }
}

// ── ACCOUNT CREATION ────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AccountCreationStep(
    phoneNumber: String,
    countryCode: String,
    password: String,
    confirmPassword: String,
    isLoginMode: Boolean,
    isLoading: Boolean,
    error: String?,
    onPhoneNumberChange: (String) -> Unit,
    onCountryCodeChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onConfirmPasswordChange: (String) -> Unit,
    onToggleLoginMode: () -> Unit,
    onSubmit: () -> Unit,
    onBack: () -> Unit
) {
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    val selectedCountry = remember(countryCode) {
        CountryCodes.all.find { it.code == countryCode } ?: CountryCodes.default
    }

    Text(
        text = if (isLoginMode) "Inicia sesion" else "Crea tu cuenta",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(24.dp))

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        CountryCodePicker(
            selectedCountry = selectedCountry,
            onCountrySelected = { country ->
                onCountryCodeChange(country.code)
            },
            modifier = Modifier.width(120.dp)
        )

        Spacer(modifier = Modifier.width(8.dp))

        OutlinedTextField(
            value = phoneNumber,
            onValueChange = onPhoneNumberChange,
            label = { Text("Telefono") },
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = password,
        onValueChange = onPasswordChange,
        label = { Text("Contrasena") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        visualTransformation = if (passwordVisible) {
            VisualTransformation.None
        } else {
            PasswordVisualTransformation()
        },
        trailingIcon = {
            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                Icon(
                    imageVector = if (passwordVisible) {
                        Icons.Filled.Visibility
                    } else {
                        Icons.Filled.VisibilityOff
                    },
                    contentDescription = if (passwordVisible) {
                        "Ocultar contrasena"
                    } else {
                        "Mostrar contrasena"
                    }
                )
            }
        },
        supportingText = { Text("Minimo 6 caracteres") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
    )

    if (!isLoginMode) {
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = confirmPassword,
            onValueChange = onConfirmPasswordChange,
            label = { Text("Confirmar contrasena") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = if (confirmPasswordVisible) {
                VisualTransformation.None
            } else {
                PasswordVisualTransformation()
            },
            trailingIcon = {
                IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                    Icon(
                        imageVector = if (confirmPasswordVisible) {
                            Icons.Filled.Visibility
                        } else {
                            Icons.Filled.VisibilityOff
                        },
                        contentDescription = if (confirmPasswordVisible) {
                            "Ocultar contrasena"
                        } else {
                            "Mostrar contrasena"
                        }
                    )
                }
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )
    }

    if (error != null) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }

    Spacer(modifier = Modifier.height(8.dp))

    TextButton(onClick = onToggleLoginMode) {
        Text(
            text = if (isLoginMode) "No tengo cuenta" else "Ya tengo cuenta"
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.weight(1f),
            enabled = !isLoading
        ) {
            Text("Atras")
        }

        Button(
            onClick = onSubmit,
            modifier = Modifier.weight(1f),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(if (isLoginMode) "Iniciar sesion" else "Crear cuenta")
            }
        }
    }
}

// ── WHATSAPP CONNECTION ─────────────────────────────

@Composable
private fun WhatsAppConnectionStep(
    whatsappStatus: String,
    qrDataUrl: String?,
    isLoading: Boolean,
    error: String?,
    onConnect: () -> Unit,
    onNext: () -> Unit,
    onSkip: () -> Unit
) {
    Text(
        text = "Conecta tu WhatsApp",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(16.dp))

    // Status indicator
    WhatsAppStatusIndicator(status = whatsappStatus)

    Spacer(modifier = Modifier.height(16.dp))

    // QR code display
    if (whatsappStatus != "connected" && qrDataUrl != null) {
        QrCodeImage(
            dataUrl = qrDataUrl,
            modifier = Modifier.size(250.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))
    } else if (whatsappStatus != "connected" && qrDataUrl == null) {
        Box(
            modifier = Modifier.size(250.dp),
            contentAlignment = Alignment.Center
        ) {
            if (whatsappStatus == "connecting") {
                CircularProgressIndicator()
            } else {
                Text(
                    text = "Presiona Conectar para generar el codigo QR",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
    }

    // Instructions
    Text(
        text = "Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth()
    )

    if (error != null) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }

    Spacer(modifier = Modifier.height(24.dp))

    if (whatsappStatus == "connected") {
        Button(
            onClick = onNext,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Siguiente")
        }
    } else {
        Button(
            onClick = onConnect,
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading && whatsappStatus != "connecting"
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text("Conectar")
        }
    }

    Spacer(modifier = Modifier.height(8.dp))

    TextButton(onClick = onSkip) {
        Text("Conectar despues")
    }
}

@Composable
private fun WhatsAppStatusIndicator(status: String) {
    val (color, label) = when (status) {
        "connected" -> Pair(ConfirmedGreen, "Conectado")
        "connecting", "waiting" -> Pair(PendingAmber, "Conectando...")
        else -> Pair(RejectedRed, "Desconectado")
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium,
            color = color
        )
    }
}

@Composable
private fun QrCodeImage(
    dataUrl: String,
    modifier: Modifier = Modifier
) {
    val bitmap = remember(dataUrl) {
        try {
            val base64Data = if (dataUrl.contains(",")) {
                dataUrl.substringAfter(",")
            } else {
                dataUrl
            }
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
        } catch (e: Exception) {
            null
        }
    }

    if (bitmap != null) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "Codigo QR de WhatsApp",
            modifier = modifier,
            contentScale = ContentScale.Fit
        )
    } else {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No se pudo cargar el codigo QR",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ── FIRST PRODUCT ───────────────────────────────────

@Composable
private fun FirstProductStep(
    productName: String,
    productPrice: String,
    isLoading: Boolean,
    productAdded: Boolean,
    error: String?,
    onProductNameChange: (String) -> Unit,
    onProductPriceChange: (String) -> Unit,
    onAddProduct: () -> Unit,
    onNext: () -> Unit,
    onSkip: () -> Unit
) {
    Text(
        text = "Agrega tu primer producto",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(8.dp))

    Text(
        text = "Asi la IA podra recomendarlo a tus clientes",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(24.dp))

    if (productAdded) {
        // Success state
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = ConfirmedGreen
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Producto agregado exitosamente",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = ConfirmedGreen,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onNext,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Siguiente")
        }
    } else {
        OutlinedTextField(
            value = productName,
            onValueChange = onProductNameChange,
            label = { Text("Nombre del producto") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = productPrice,
            onValueChange = onProductPriceChange,
            label = { Text("Precio") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            prefix = { Text("S/ ") }
        )

        if (error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onAddProduct,
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text("Agregar producto")
        }

        Spacer(modifier = Modifier.height(8.dp))

        TextButton(onClick = onSkip) {
            Text("Saltar")
        }
    }
}

// ── NOTIFICATION ACCESS ─────────────────────────────

@Composable
private fun NotificationAccessStep(
    isEnabled: Boolean,
    onOpenSettings: () -> Unit,
    onNext: () -> Unit
) {
    Text(
        text = "Captura pagos de Yape",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(12.dp))

    Text(
        text = "Yaya detecta las notificaciones de Yape para confirmar pagos automaticamente",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.fillMaxWidth()
    )

    Spacer(modifier = Modifier.height(32.dp))

    if (isEnabled) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = ConfirmedGreen
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Acceso habilitado",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = ConfirmedGreen,
            textAlign = TextAlign.Center
        )
    } else {
        Icon(
            imageVector = Icons.Default.Notifications,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onOpenSettings,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Activar acceso")
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Busca \"Yaya\" en la lista y activa el acceso",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }

    Spacer(modifier = Modifier.height(32.dp))

    Button(
        onClick = onNext,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Siguiente")
    }
}

// ── DONE ────────────────────────────────────────────

@Composable
private fun DoneStep(
    businessType: String,
    businessName: String,
    whatsappConnected: Boolean,
    isLoading: Boolean,
    onFinish: () -> Unit
) {
    Spacer(modifier = Modifier.height(48.dp))

    Icon(
        imageVector = Icons.Default.CheckCircle,
        contentDescription = null,
        modifier = Modifier.size(120.dp),
        tint = ConfirmedGreen
    )

    Spacer(modifier = Modifier.height(24.dp))

    Text(
        text = "Tu negocio esta listo!",
        style = MaterialTheme.typography.headlineMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        textAlign = TextAlign.Center
    )

    Spacer(modifier = Modifier.height(24.dp))

    ElevatedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            SummaryRow(label = "Tipo", value = businessType.replaceFirstChar { it.uppercase() })
            SummaryRow(label = "Nombre", value = businessName)
            if (whatsappConnected) {
                SummaryRow(label = "WhatsApp", value = "Conectado")
            }
        }
    }

    Spacer(modifier = Modifier.height(48.dp))

    Button(
        onClick = onFinish,
        modifier = Modifier.fillMaxWidth(),
        enabled = !isLoading
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text("Ir al inicio")
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}
