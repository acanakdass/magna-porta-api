# Airwallex Global Account Service

Bu servis, Airwallex API'si üzerinden global hesap bilgilerini çekmek için kullanılır.

## Özellikler

- **Global Accounts Listesi**: Tüm global hesapları listeler
- **Bank Details**: Banka bilgilerini içerir
- **Multi-Currency**: Farklı para birimlerinde hesaplar
- **Pagination**: Büyük veri setleri için sayfalama desteği

## API Endpoints

### 1. Get All Global Accounts
```
GET /airwallex/global-accounts
```

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Global accounts retrieved successfully",
  "data": {
    "items": [
      {
        "id": "global_acc_123",
        "currency": "USD",
        "account_name": "Global USD Account",
        "account_number": "1234567890",
        "identifier": "US123456789",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z",
        "bank_details": {
          "country_code": "US",
          "bank_name": "Chase Bank",
          "bank_code": "021000021"
        }
      },
      {
        "id": "global_acc_456",
        "currency": "EUR",
        "account_name": "Global EUR Account",
        "account_number": "0987654321",
        "identifier": "DE098765432",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z",
        "bank_details": {
          "country_code": "DE",
          "bank_name": "Deutsche Bank",
          "bank_code": "DEUTDEFF"
        }
      }
    ],
    "page_after": "cursor_123",
    "page_before": "cursor_456"
  }
}
```

### 2. Create Global Account
```
POST /airwallex/global-accounts/create
```

### 3. Get Global Account Details
```
GET /airwallex/global-accounts/:globalAccountId
```

**Request Body:**
```json
{
  "country_code": "US",
  "nick_name": "US Dollar Account",
  "required_features": [
    {
      "currency": "USD",
      "transfer_method": "LOCAL"
    },
    {
      "currency": "USD", 
      "transfer_method": "SWIFT"
    }
  ]
}
```

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Global account created successfully",
  "data": {
    "id": "global_acc_123",
    "account_name": "US Dollar Account",
    "account_number": "1234567890",
    "currency": "USD",
    "country_code": "US",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "bank_details": {
      "bank_name": "Chase Bank",
      "bank_code": "021000021"
    }
  }
}
```

## Kullanım Örnekleri

### Tüm Global Accounts'ları Getir
```typescript
const result = await globalAccountService.getGlobalAccounts();
```

### Belirli Hesap için Global Accounts Getir
```typescript
const result = await globalAccountService.getGlobalAccounts('account_123');
```

### Yeni Global Account Oluştur
```typescript
const result = await globalAccountService.createGlobalAccount({
  country_code: "US",
  nick_name: "US Dollar Account",
  required_features: [
    {
      currency: "USD",
      transfer_method: "LOCAL"
    },
    {
      currency: "USD",
      transfer_method: "SWIFT"
    }
  ]
}, 'account_123');
```

### Global Account Detayları Getir
```typescript
const result = await globalAccountService.getGlobalAccountById('global_acc_123', 'account_123');
```

## Global Account Özellikleri

### **Temel Bilgiler:**
- **id**: Benzersiz hesap ID'si
- **currency**: Para birimi (USD, EUR, GBP, vb.)
- **account_name**: Hesap adı
- **account_number**: Hesap numarası
- **identifier**: Ülke bazlı tanımlayıcı
- **status**: Hesap durumu (active, inactive, vb.)
- **created_at**: Oluşturulma tarihi

### **Banka Bilgileri:**
- **country_code**: Ülke kodu (US, DE, GB, vb.)
- **bank_name**: Banka adı
- **bank_code**: Banka kodu

## Hata Yönetimi

Servis, aşağıdaki hata durumlarını yönetir:

- **401 Unauthorized**: Kimlik doğrulama hatası
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Sunucu hatası

Tüm hatalar `BaseApiResponse` formatında döndürülür:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Güvenlik

- Tüm endpoint'ler JWT authentication gerektirir
- `@UseGuards(JwtAuthGuard)` decorator'ı kullanılır
- Account ID parametresi opsiyonel

## Logging

Servis, tüm API çağrılarını ve hataları detaylı şekilde loglar:

- API çağrı başlangıcı
- Token alma işlemi
- API response durumu
- Hata detayları
- Response normalizasyonu

## Global Accounts vs Connected Accounts

### **Global Accounts:**
- Farklı ülkelerdeki banka hesapları
- Multi-currency desteği
- Banka bilgileri detaylı
- Uluslararası işlemler için

### **Connected Accounts:**
- Bağlı hesap bilgileri
- Daha genel hesap yönetimi
- İç işlemler için 