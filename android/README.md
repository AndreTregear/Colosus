# YapeReader

Android app that intercepts Yape payment notifications on a merchant's phone, parses payment data (sender name + amount), stores it locally in a Room database, and syncs to a backend API. The backend then triggers a WhatsApp AI agent to confirm orders (handled separately).

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Data Flow](#data-flow)
- [Notification Parsing](#notification-parsing)
- [Deduplication](#deduplication)
- [Sync Strategy](#sync-strategy)
- [Security](#security)
- [Backend API Contract](#backend-api-contract)
- [Database Schema](#database-schema)
- [Screens](#screens)
- [Permissions](#permissions)
- [AGP 9 Compatibility Notes](#agp-9-compatibility-notes)
- [Build & Run](#build--run)
- [Testing](#testing)

---

## Architecture

MVVM with Jetpack Compose, following an **offline-first** approach:

```
Yape Notification
      |
      v
NotificationListenerService
      |
      v
NotificationParser (regex extraction)
      |
      v
DeduplicationManager (SHA-256 + 5s window)
      |
      v
Room Database (payments table)
      |
      v
WorkManager SyncWorker
      |
      v
Retrofit -> Backend API
```

Key architectural decisions:

- **Offline-first**: All payments are persisted to Room immediately on capture. Sync to the backend happens asynchronously via WorkManager. The app is fully functional without network connectivity.
- **MVVM**: Each screen has a dedicated ViewModel that exposes UI state via `StateFlow`. Screens are pure composable functions that observe state.
- **Hilt DI**: All dependencies are provided through Hilt modules (`AppModule`, `NetworkModule`, `RepositoryModule`). ViewModels use `@HiltViewModel`, workers use `@HiltWorker`.
- **Repository pattern**: `PaymentRepository` and `AuthRepository` abstract data sources. The UI layer never interacts directly with Room or Retrofit.

## Project Structure

```
com.example.yaya/
├── data/
│   ├── local/
│   │   ├── datastore/
│   │   │   └── PreferencesManager.kt        # DataStore preferences (config, onboarding state)
│   │   └── db/
│   │       ├── PaymentDao.kt                 # Room DAO with Flow-based queries
│   │       └── YayaDatabase.kt               # Room database definition
│   ├── model/
│   │   ├── Payment.kt                        # Room entity
│   │   ├── PaymentStatus.kt                  # PENDING | CONFIRMED | REJECTED | EXPIRED
│   │   └── SyncStatus.kt                     # UNSYNCED | SYNCING | SYNCED | FAILED
│   ├── remote/
│   │   ├── api/
│   │   │   └── YayaApiService.kt             # Retrofit interface (4 endpoints)
│   │   ├── dto/
│   │   │   ├── RegisterRequest.kt
│   │   │   ├── RegisterResponse.kt
│   │   │   ├── PaymentSyncRequest.kt
│   │   │   ├── PaymentSyncResponse.kt
│   │   │   ├── BatchSyncRequest.kt
│   │   │   └── BatchSyncResponse.kt
│   │   └── interceptor/
│   │       ├── AuthInterceptor.kt            # Adds Bearer token header
│   │       └── BaseUrlInterceptor.kt         # Dynamic base URL from DataStore
│   └── repository/
│       ├── AuthRepository.kt                 # Device registration, connection test
│       └── PaymentRepository.kt              # Payment CRUD, sync logic
├── di/
│   ├── AppModule.kt                          # Database, DAO, managers
│   ├── NetworkModule.kt                      # OkHttp, Retrofit, Moshi
│   └── RepositoryModule.kt                   # Repositories
├── security/
│   └── TokenManager.kt                       # EncryptedSharedPreferences for API token
├── service/
│   ├── DeduplicationManager.kt               # SHA-256 hash + time window check
│   ├── NotificationParser.kt                 # Regex-based Yape notification parser
│   └── YapeNotificationListener.kt           # NotificationListenerService
├── worker/
│   ├── SyncScheduler.kt                      # Schedules immediate + periodic sync
│   └── SyncWorker.kt                         # HiltWorker that syncs unsynced payments
├── ui/
│   ├── theme/
│   │   ├── Color.kt                          # Yape purple (#742284), status colors
│   │   ├── Type.kt                           # Material 3 typography
│   │   └── Theme.kt                          # Light/dark theme with dynamic color
│   ├── navigation/
│   │   ├── Screen.kt                         # Sealed class: 4 routes
│   │   └── NavGraph.kt                       # NavHost composition
│   ├── components/
│   │   ├── PaymentCard.kt                    # Payment display card
│   │   ├── StatusBadge.kt                    # Color-coded payment status chip
│   │   └── SyncStatusIndicator.kt            # Cloud sync status icon + label
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── OnboardingViewModel.kt
│   │   │   └── OnboardingScreen.kt           # Business info + notification access
│   │   ├── dashboard/
│   │   │   ├── DashboardViewModel.kt
│   │   │   └── DashboardScreen.kt            # Today's stats + recent payments
│   │   ├── payments/
│   │   │   ├── PaymentListViewModel.kt
│   │   │   └── PaymentListScreen.kt          # Filterable payment list
│   │   └── settings/
│   │       ├── SettingsViewModel.kt
│   │       └── SettingsScreen.kt             # Backend URL, notification access, battery
│   └── MainViewModel.kt                      # Determines start destination
├── MainActivity.kt                           # @AndroidEntryPoint, Compose entry
└── YayaApplication.kt                        # @HiltAndroidApp, WorkManager config
```

## Tech Stack

| Component | Library | Version |
|---|---|---|
| Build system | Android Gradle Plugin | 9.0.1 |
| Language | Kotlin (built into AGP 9) | 2.1.20 |
| Annotation processing | KSP | 2.1.20-1.0.32 |
| UI framework | Jetpack Compose (BOM) | 2025.05.00 |
| UI toolkit | Material 3 | via Compose BOM |
| Navigation | Navigation Compose | 2.9.0 |
| Lifecycle | Lifecycle Runtime/ViewModel Compose | 2.9.0 |
| Local database | Room | 2.7.1 |
| Dependency injection | Hilt | 2.56.2 |
| Networking | Retrofit | 2.11.0 |
| JSON serialization | Moshi (codegen) | 1.15.2 |
| HTTP client | OkHttp (logging interceptor) | 4.12.0 |
| Background work | WorkManager | 2.10.1 |
| Preferences | DataStore Preferences | 1.1.7 |
| Token storage | Security Crypto (EncryptedSharedPreferences) | 1.0.0 |
| Async | Kotlin Coroutines | 1.10.2 |
| Min SDK | 24 (Android 7.0) | |
| Target/Compile SDK | 36 | |

## Data Flow

### Payment Capture

1. **Yape sends a push notification** to the merchant's phone.
2. `YapeNotificationListener` (a `NotificationListenerService`) receives all notifications and filters by package name `com.bcp.innovacxion.yapeapp`.
3. The notification text is extracted from `EXTRA_BIG_TEXT` (preferred) or `EXTRA_TEXT` (fallback).
4. `NotificationParser.parse()` attempts to match the text against two regex patterns. Returns a `ParsedPayment(senderName, amount, rawText)` or null.
5. `DeduplicationManager` computes a SHA-256 hash of the raw text and checks if the same hash exists in the database within the last 5 seconds.
6. If not a duplicate, a `Payment` entity is inserted into Room with `syncStatus = UNSYNCED`.
7. `SyncScheduler.scheduleImmediateSync()` enqueues a one-time `SyncWorker`.

### Sync to Backend

1. `SyncWorker` queries all payments with `syncStatus = UNSYNCED`.
2. If 1 payment: sends a single `POST /api/v1/payments/sync` request.
3. If multiple payments: sends a batch `POST /api/v1/payments/sync/batch` request.
4. On success: marks payments as `SYNCED` with the backend-assigned ID.
5. On failure: marks as `FAILED` and increments `retryCount`. WorkManager retries with exponential backoff (30s base, up to 5 attempts).
6. A periodic sync (every 15 minutes) acts as a safety net for any missed immediate syncs.

## Notification Parsing

The parser handles two known Yape notification formats:

| Format | Regex | Example |
|---|---|---|
| "te envio" | `(.+?)\s+te\s+envio\s+S/\s*([0-9,]+\.?[0-9]*)` | `Juan te envio S/ 25.50` |
| "Recibiste de" | `Recibiste\s+de\s+(.+?)\s+por\s+S/\s*([0-9,]+\.?[0-9]*)` | `Recibiste de Maria por S/ 150.00` |

Both patterns are case-insensitive. Amount extraction handles commas (thousands separator) and optional decimal places.

**Not parsed**: Operation reference numbers are not available in Yape push notifications — only sender name and amount are extracted.

## Deduplication

Android may deliver the same notification multiple times. Deduplication uses two factors:

1. **SHA-256 hash** of the raw notification text
2. **5-second time window** — the same hash within 5 seconds is considered a duplicate

The `notificationHash` column in the payments table is indexed for fast lookups.

## Sync Strategy

| Trigger | Type | Policy | Constraint |
|---|---|---|---|
| Each payment capture | One-time | `REPLACE` (latest wins) | Network connected |
| App startup | Periodic (15 min) | `KEEP` (don't restart if running) | Network connected |

Both use exponential backoff starting at 30 seconds, with a maximum of 5 retry attempts per worker run.

The `PaymentRepository.syncUnsyncedPayments()` method handles both single and batch sync:
- 1 unsynced payment: `POST /api/v1/payments/sync`
- 2+ unsynced payments: `POST /api/v1/payments/sync/batch`

## Security

- **API token** is stored in `EncryptedSharedPreferences` backed by Android Keystore (AES256-SIV key encryption, AES256-GCM value encryption).
- **Bearer token** is attached to every API request via `AuthInterceptor`.
- **Base URL** is configurable at runtime via `BaseUrlInterceptor` reading from DataStore, allowing the merchant to point to their own backend without rebuilding the app.

## Backend API Contract

The app expects a REST API with the following endpoints. All request/response bodies are JSON.

### Authentication

All endpoints except `POST /register` and `GET /health` require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### `POST /api/v1/devices/register`

Register a merchant device.

**Request:**
```json
{
  "businessName": "Mi Tienda",
  "phoneNumber": "+51999888777",
  "deviceId": "uuid-v4-string"
}
```

**Response (200):**
```json
{
  "businessId": "biz_abc123",
  "token": "jwt-or-opaque-token"
}
```

The returned `token` is stored securely on the device and used for all subsequent API calls. The `businessId` is saved in DataStore for reference.

---

### `POST /api/v1/payments/sync`

Sync a single captured payment.

**Request:**
```json
{
  "senderName": "Juan Perez",
  "amount": 25.50,
  "capturedAt": 1709145600000,
  "notificationHash": "sha256-hex-string"
}
```

| Field | Type | Description |
|---|---|---|
| `senderName` | string | Name extracted from the Yape notification |
| `amount` | number | Payment amount in PEN (soles) |
| `capturedAt` | long | Unix timestamp in milliseconds when the notification was received |
| `notificationHash` | string | SHA-256 hex digest of the raw notification text (for server-side dedup) |

**Response (200):**
```json
{
  "id": "pay_xyz789",
  "status": "PENDING"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Backend-assigned payment ID |
| `status` | string | Initial payment status (typically `PENDING`) |

---

### `POST /api/v1/payments/sync/batch`

Sync multiple payments in one request.

**Request:**
```json
{
  "payments": [
    {
      "senderName": "Juan Perez",
      "amount": 25.50,
      "capturedAt": 1709145600000,
      "notificationHash": "sha256-hex-1"
    },
    {
      "senderName": "Maria Lopez",
      "amount": 100.00,
      "capturedAt": 1709145660000,
      "notificationHash": "sha256-hex-2"
    }
  ]
}
```

**Response (200):**
```json
{
  "results": [
    { "id": "pay_001", "status": "PENDING" },
    { "id": "pay_002", "status": "PENDING" }
  ]
}
```

The `results` array must be in the same order as the `payments` request array so the app can match backend IDs to local records by index.

---

### `GET /api/v1/health`

Health check endpoint used by the Settings screen to test connectivity.

**Response (200):** Empty body (status code 200 is sufficient).

---

### Error Handling

The app treats any non-2xx response as a sync failure. On failure:
- The payment's `syncStatus` is set to `FAILED`
- `retryCount` is incremented
- WorkManager retries with exponential backoff

The backend should return appropriate HTTP status codes:
- `401` — Invalid or expired token
- `409` — Duplicate payment (same `notificationHash`, backend should handle idempotently)
- `422` — Validation error
- `500` — Server error

## Database Schema

### `payments` table

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK, auto) | Local auto-increment ID |
| `senderName` | TEXT | Payment sender name |
| `amount` | REAL | Payment amount in PEN |
| `rawNotification` | TEXT | Original notification text |
| `notificationHash` | TEXT (indexed) | SHA-256 hex of raw text, used for dedup |
| `capturedAt` | INTEGER | Unix timestamp ms of capture |
| `paymentStatus` | TEXT | `PENDING`, `CONFIRMED`, `REJECTED`, `EXPIRED` |
| `syncStatus` | TEXT | `UNSYNCED`, `SYNCING`, `SYNCED`, `FAILED` |
| `syncedAt` | INTEGER (nullable) | Unix timestamp ms of successful sync |
| `backendId` | TEXT (nullable) | ID assigned by the backend |
| `retryCount` | INTEGER | Number of failed sync attempts |

## Screens

### 1. Onboarding (first launch only)

Two-step flow:
1. **Business info**: Name and phone number fields. "Registrar dispositivo" calls the register API. "Continuar sin registro" skips API registration for offline-only use.
2. **Notification access**: Prompts the user to enable notification access for Yaya via `ACTION_NOTIFICATION_LISTENER_SETTINGS`. Checks status on resume. "Comenzar" proceeds to dashboard.

### 2. Dashboard

- Today's payment count and total amount in a stats card
- Last 10 payments in a scrollable list
- Top bar actions: manual sync trigger, settings

### 3. Payment List

- Filter chips: Todos, Pendientes, Confirmados, Rechazados, Expirados
- Full payment list with `PaymentCard` components showing sender, amount, status badge, time, and sync status

### 4. Settings

- Notification access status with link to system settings
- Backend URL configuration with connection test button
- Battery optimization guidance with link to system settings
- Business name display

## Permissions

| Permission | Purpose |
|---|---|
| `INTERNET` | API calls to backend |
| `ACCESS_NETWORK_STATE` | WorkManager network constraint checks |
| `RECEIVE_BOOT_COMPLETED` | Resume periodic sync after device reboot |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Guidance for disabling battery optimization |
| `POST_NOTIFICATIONS` | Required on Android 13+ for foreground notifications |
| Notification Listener access | Granted by user in system settings (not a manifest permission) |

## AGP 9 Compatibility Notes

This project uses Android Gradle Plugin 9.0.1 which includes several breaking changes from AGP 8.x:

1. **Built-in Kotlin**: AGP 9 bundles Kotlin, so the `kotlin-android` plugin is NOT applied separately. Applying it causes a "Cannot add extension with name 'kotlin'" error.

2. **No `kotlinOptions` block**: Replaced by AGP's built-in Kotlin configuration. The `jvmTarget` is inferred from `compileOptions`.

3. **Hilt Gradle plugin incompatible**: The `com.google.dagger.hilt.android` plugin references `BaseExtension` which was removed in AGP 9. Workaround: omit the Hilt plugin and manually extend Hilt-generated base classes:
   ```kotlin
   @HiltAndroidApp(Application::class)
   class YayaApplication : Hilt_YayaApplication()

   @AndroidEntryPoint(ComponentActivity::class)
   class MainActivity : Hilt_MainActivity()
   ```

4. **KSP source sets**: KSP adds Kotlin source sets which conflicts with AGP 9's built-in Kotlin. Fixed with `android.disallowKotlinSourceSets=false` in `gradle.properties`.

5. **`compileSdk` syntax**: AGP 9 supports both `compileSdk = 36` (integer) and the new `compileSdk { version = release(36) { ... } }` block syntax. This project uses the integer form for simplicity.

## Build & Run

**Prerequisites:**
- Android Studio with AGP 9.0.1 support
- JDK 17+ (Android Studio's bundled JBR works)
- Android SDK Platform 36

```bash
# Build debug APK
./gradlew assembleDebug

# Run unit tests
./gradlew testDebugUnitTest

# Install on connected device
./gradlew installDebug
```

If `JAVA_HOME` is not set, point it to Android Studio's bundled JBR:
```bash
export JAVA_HOME=/path/to/android-studio/jbr
export ANDROID_HOME=/path/to/Android/Sdk
```

## Testing

Unit tests cover the `NotificationParser` with 13 test cases:

- Both "te envio" and "Recibiste de" formats
- Integer and decimal amounts
- Amounts with comma thousands separators
- Amounts without space after `S/`
- Case insensitivity
- Whitespace trimming and multiple spaces
- Null return for unrelated notifications, empty strings, and missing amounts
- Raw text preservation

```bash
./gradlew testDebugUnitTest
```

### Manual Testing

1. Install the app on a device
2. Complete onboarding (optionally skip registration for offline testing)
3. Grant notification listener access when prompted
4. Send a Yape payment to the merchant's phone
5. Verify the payment appears on the Dashboard
6. Check logcat for `YapeNotificationListener` and `SyncWorker` tags
