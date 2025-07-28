# Airwallex Controllers - API Endpoints

Bu dokümantasyon, Airwallex entegrasyonu için oluşturulan tüm controller'ları ve API endpoint'lerini açıklar.

## 📋 Mevcut Controller'lar

### 1. **AwBalancesController** - Bakiye İşlemleri
**Base Path:** `/airwallex/balances`

#### Endpoints:
- **GET** `/current` - Mevcut bakiyeleri getir

**Query Parameters:**
- `account_id` (optional): Hesap ID'si
- `sca_token_5m` (optional): 5 dakikalık geçerli SCA token

**Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "items": [
      {
        "available_amount": 1000,
        "pending_amount": 100,
        "reserved_amount": 50,
        "total_amount": 1150,
        "currency": "USD"
      }
    ],
    "page_num": 1,
    "page_size": 100,
    "total_count": 1
  }
}
```

---

### 2. **AwAccountController** - Hesap İşlemleri
**Base Path:** `/airwallex/accounts`

#### Endpoints:
- **POST** `/create` - Yeni hesap oluştur
- **GET** `/:accountId` - Hesap detaylarını getir

**Create Account Request Body:**
```json
{
  "profile": {
    "type": "individual",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-01",
    "phone_number": "+1234567890",
    "email": "john.doe@example.com"
  },
  "customer_agreements": {
    "terms_and_conditions": {
      "service_agreement_type": "FULL"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "acc_123456",
    "status": "active",
    "profile": { ... }
  }
}
```

---

### 3. **AwAuthorizationController** - Yetkilendirme İşlemleri
**Base Path:** `/airwallex/authorization`

#### Endpoints:
- **POST** `/code` - Yetkilendirme kodu al

**Query Parameters:**
- `auth_type` (optional): Yetkilendirme tipi (scaSetup, kyc, vb.)
- `account_id` (optional): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Authorization code generated successfully",
  "data": {
    "code": "auth_code_123",
    "code_verifier": "verifier_123",
    "expires_in": 300
  }
}
```

---

### 4. **AwConversionController** - Döviz İşlemleri
**Base Path:** `/airwallex/conversions`

#### Endpoints:
- **GET** `/` - Tüm conversion'ları listele
- **POST** `/create` - Yeni conversion oluştur
- **GET** `/:conversionId` - Conversion detaylarını getir

**Query Parameters (List):**
- `buy_currency` (optional): Alınan para birimi
- `sell_currency` (optional): Satılan para birimi
- `from_created_at` (optional): Başlangıç tarihi
- `to_created_at` (optional): Bitiş tarihi
- `status` (optional): İşlem durumu
- `page_num` (optional): Sayfa numarası
- `page_size` (optional): Sayfa boyutu
- `account_id` (optional): Hesap ID'si

**Create Conversion Request Body:**
```json
{
  "buy_currency": "EUR",
  "sell_currency": "USD",
  "buy_amount": "1000",
  "sell_amount": "1100",
  "conversion_date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversions retrieved successfully",
  "data": {
    "items": [
      {
        "id": "conv_123456",
        "from_currency": "USD",
        "to_currency": "EUR",
        "from_amount": 1000,
        "to_amount": 850,
        "rate": 0.85,
        "status": "completed"
      }
    ],
    "total_count": 1
  }
}
```

---

### 5. **AwConnectedAccountsController** - Bağlı Hesap İşlemleri
**Base Path:** `/airwallex/connected-accounts`

#### Endpoints:
- **GET** `/` - Bağlı hesapları listele
- **POST** `/create` - Yeni bağlı hesap oluştur

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Connected accounts retrieved successfully",
  "data": {
    "items": [
      {
        "id": "conn_acc_123",
        "status": "active",
        "account_name": "Business Account"
      }
    ]
  }
}
```

---

### 6. **AwGlobalAccountController** - Global Hesap İşlemleri
**Base Path:** `/airwallex/global-accounts`

#### Endpoints:
- **GET** `/` - Global hesapları listele
- **POST** `/create` - Yeni global hesap oluştur
- **GET** `/:globalAccountId` - Global hesap detaylarını getir

---

### 7. **AwContactsController** - Contact (Beneficiary) İşlemleri
**Base Path:** `/airwallex/contacts`

#### Endpoints:
- **GET** `/` - Contacts'ları listele
- **GET** `/:contactId` - Contact detaylarını getir

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Path Parameters (for detail endpoint):**
- `globalAccountId`: Global Account ID'si

**Create Global Account Request Body:**
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
      }
    ],
    "page_after": "cursor_123",
    "page_before": "cursor_456"
  }
}
```

---

### 7. **AwContactsController** - Contact (Beneficiary) İşlemleri

---

### 8. **AwTransactionsController** - Kart İşlemleri

---

### 9. **AwTransfersController** - Transfer/Payout İşlemleri
**Base Path:** `/airwallex/transfers`

#### Endpoints:
- **GET** `/` - Transfer/payout'ları listele
- **POST** `/create` - Yeni transfer/payout oluştur

**Query Parameters (for GET):**
- `from_created_at` (optional): Başlangıç tarihi (ISO 8601)
- `to_created_at` (optional): Bitiş tarihi (ISO 8601)
- `status` (optional): Transfer durumu filtresi
- `transfer_currency` (optional): Transfer para birimi filtresi
- `short_reference_id` (optional): Kısa referans ID filtresi
- `page` (optional): Sayfa cursor'ı
- `page_size` (optional): Sayfa boyutu (varsayılan: 100)
- `request_id` (optional): Request ID filtresi

**Request Body (for POST):**
```json
{
  "beneficiary_id": "ben_123456",
  "payer": {
    "address": {
      "country_code": "US"
    },
    "entity_type": "individual"
  },
  "reason": "Payment for services",
  "reference": "REF-123456",
  "request_id": "req_789012",
  "source_currency": "USD",
  "source_amount": "1000.00",
  "transfer_amount": "1000.00",
  "transfer_currency": "USD",
  "transfer_date": "2024-01-15",
  "transfer_method": "swift",
  "scaToken": "sca_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transfers retrieved successfully",
  "data": {
    "items": [
      {
        "id": "trf_123456",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:35:00Z",
        "status": "completed",
        "transfer_date": "2024-01-15",
        "source_amount": 1000.00,
        "source_currency": "USD",
        "transfer_amount": 1000.00,
        "transfer_currency": "USD",
        "beneficiary": {
          "company_name": "ABC Corp",
          "first_name": "John",
          "last_name": "Doe",
          "entity_type": "company"
        },
        "payer": {
          "company_name": "XYZ Inc",
          "first_name": "Jane",
          "last_name": "Smith",
          "entity_type": "individual"
        },
        "reference": "REF-123456",
        "remarks": "Payment for services",
        "amount_beneficiary_receives": 995.00,
        "amount_payer_pays": 1000.00,
        "short_reference_id": "SR123456",
        "fee_amount": 5.00,
        "fee_currency": "USD"
      }
    ],
    "page_before": "cursor_123",
    "page_after": "cursor_456"
  }
}
```
**Base Path:** `/airwallex/transactions`

#### Endpoints:
- **GET** `/` - Kart işlemlerini listele

**Query Parameters:**
- `billing_currency` (optional): Fatura para birimi filtresi
- `card_id` (optional): Kart ID filtresi
- `digital_wallet_token_id` (optional): Dijital cüzdan token ID filtresi
- `from_created_at` (optional): Başlangıç tarihi (ISO 8601)
- `to_created_at` (optional): Bitiş tarihi (ISO 8601)
- `lifecycle_id` (optional): Yaşam döngüsü ID filtresi
- `retrieval_ref` (optional): Alma referansı filtresi
- `transaction_type` (optional): İşlem tipi filtresi
- `transaction_status` (optional): İşlem durumu filtresi
- `page_num` (optional): Sayfa numarası (varsayılan: 0)
- `page_size` (optional): Sayfa boyutu (varsayılan: 100)

**Response:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "has_more": true,
    "items": [
      {
        "billing_amount": 100.50,
        "billing_currency": "USD",
        "card_id": "card_123456",
        "created_at": "2024-01-15T10:30:00Z",
        "digital_wallet_token_id": "token_789",
        "lifecycle_id": "lifecycle_123",
        "merchant_city": "New York",
        "merchant_country": "US",
        "merchant_name": "Amazon.com",
        "settlement_amount": 100.50,
        "settlement_currency": "USD",
        "transaction_id": "txn_123456",
        "transaction_status": "completed",
        "transaction_type": "purchase",
        "updated_at": "2024-01-15T10:35:00Z"
      }
    ],
    "page_num": 0,
    "page_size": 100
  }
}
```
**Base Path:** `/airwallex/contacts`

#### Endpoints:
- **GET** `/` - Contacts'ları listele
- **GET** `/:contactId` - Contact detaylarını getir
- **POST** `/create` - Yeni beneficiary/contact oluştur

**Query Parameters:**
- `status` (optional): Beneficiary durumu
- `account_name` (optional): Hesap adı filtresi
- `account_number` (optional): Hesap numarası filtresi
- `email` (optional): Email filtresi
- `page_num` (optional): Sayfa numarası
- `page_size` (optional): Sayfa boyutu
- `account_id` (optional): Hesap ID'si

**Path Parameters (for detail endpoint):**
- `contactId`: Contact ID'si

**Get Contacts Response:**
```json
{
  "success": true,
  "message": "Contacts retrieved successfully",
  "data": {
    "has_more": false,
    "items": [
      {
        "beneficiary_id": "ben_123456",
        "account_name": "John Doe",
        "account_number": "1234567890",
        "email": "john@example.com",
        "payment_method": "bank_transfer",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "page_num": 0,
    "page_size": 100
  }
}
```

**Get Contact Details Response:**
```json
{
  "success": true,
  "message": "Contact details retrieved successfully",
  "data": {
    "id": "ben_123456",
    "nickname": "John",
    "payer_entity_type": "individual",
    "transfer_methods": ["bank_transfer", "swift"],
    "beneficiary": {
      "first_name": "John",
      "last_name": "Doe",
      "entity_type": "individual",
      "address": {
        "street_address": "123 Main St",
        "city": "New York",
        "country_code": "US"
      },
      "bank_details": {
        "account_name": "John Doe",
        "account_number": "1234567890",
        "bank_name": "Chase Bank",
        "swift_code": "CHASUS33"
      }
    }
  }
}
```

**Create Beneficiary Request Body:**
```json
{
  "beneficiary": {
    "additional_info": {
      "external_identifier": "EXT123",
      "personal_email": "john@example.com"
    },
    "address": {
      "city": "New York",
      "country_code": "US",
      "postcode": "10001",
      "state": "NY",
      "street_address": "123 Main Street"
    },
    "bank_details": {
      "account_currency": "USD",
      "account_name": "John Doe",
      "account_number": "1234567890",
      "account_routing_type1": "aba",
      "account_routing_value1": "021000021",
      "bank_country_code": "US",
      "local_clearing_system": "ACH"
    },
    "entity_type": "individual",
    "type": "individual"
  },
  "nickname": "John Doe",
  "transfer_methods": ["bank_transfer", "swift"]
}
```

**Create Beneficiary Response:**
```json
{
  "success": true,
  "message": "Beneficiary created successfully",
  "data": {
    "id": "ben_123456",
    "beneficiary": {
      "first_name": "John",
      "last_name": "Doe",
      "entity_type": "individual",
      "address": {
        "street_address": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "postcode": "10001",
        "country_code": "US"
      },
      "bank_details": {
        "account_name": "John Doe",
        "account_number": "1234567890",
        "bank_name": "Chase Bank",
        "account_currency": "USD"
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "nickname": "John Doe",
    "status": "pending"
  }
}
```
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
      }
    ],
    "page_after": "cursor_123",
    "page_before": "cursor_456"
  }
}
```

---

## 🔐 Güvenlik

Tüm endpoint'ler JWT authentication gerektirir:
- `@UseGuards(JwtAuthGuard)` decorator'ı kullanılır
- Authorization header'da Bearer token gerekli

## 📊 Hata Yönetimi

Tüm endpoint'ler tutarlı hata response formatı kullanır:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## 🚀 Kullanım Örnekleri

### Bakiye Sorgulama
```bash
curl -X GET "http://localhost:3000/airwallex/balances/current?account_id=acc_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Hesap Oluşturma
```bash
curl -X POST "http://localhost:3000/airwallex/accounts/create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "type": "individual",
      "first_name": "John",
      "last_name": "Doe"
    }
  }'
```

### Conversion Listesi
```bash
curl -X GET "http://localhost:3000/airwallex/conversions?buy_currency=EUR&status=completed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Swagger Dokümantasyonu

Tüm endpoint'ler Swagger UI'da dokümante edilmiştir:
- **URL:** `http://localhost:3000/api`
- **Tags:** Her controller için ayrı tag
- **Request/Response:** Detaylı şema tanımları

## 🔄 Response Normalizasyonu

Tüm servisler tutarlı response formatı kullanır:
- `success`: İşlem başarı durumu
- `message`: Açıklayıcı mesaj
- `data`: Response verisi
- `error`: Hata durumunda null 