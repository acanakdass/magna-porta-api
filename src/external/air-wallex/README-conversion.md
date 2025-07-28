# Airwallex Conversion Service

Bu servis, Airwallex API'si üzerinden döviz kurları ve conversion işlemleri ile ilgili verileri çekmek için kullanılır.

## Özellikler

- **Conversions Listesi**: Tüm conversion işlemlerini listeler
- **Conversion Detayları**: Belirli bir conversion işleminin detaylarını getirir
- **Filtreleme**: Tarih, para birimi, durum gibi kriterlere göre filtreleme
- **Sayfalama**: Büyük veri setleri için sayfalama desteği

## API Endpoints

### 1. Get All Conversions
```
GET /airwallex/conversions
```

**Query Parameters:**
- `buy_currency` (optional): Alınan para birimi
- `sell_currency` (optional): Satılan para birimi
- `from_created_at` (optional): Başlangıç tarihi
- `to_created_at` (optional): Bitiş tarihi
- `status` (optional): İşlem durumu
- `page_num` (optional): Sayfa numarası
- `page_size` (optional): Sayfa boyutu
- `account_id` (optional): Hesap ID'si

### 2. Create Conversion
```
POST /airwallex/conversions/create
```

**Request Body:**
```json
{
  "buy_currency": "EUR",
  "sell_currency": "USD",
  "buy_amount": "1000",
  "sell_amount": "1100",
  "conversion_date": "2024-01-15"
}
```

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Conversion created successfully",
  "data": {
    "conversion_id": "conv_123456",
    "request_id": "req_123456",
    "status": "pending",
    "buy_currency": "EUR",
    "sell_currency": "USD",
    "buy_amount": "1000",
    "sell_amount": "1100",
    "conversion_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
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
        "request_id": "req_123456",
        "from_currency": "USD",
        "to_currency": "EUR",
        "from_amount": 1000,
        "to_amount": 850,
        "status": "completed",
        "rate": 0.85,
        "created_at": "2024-01-01T00:00:00Z",
        "settlement_time": "2024-01-01T00:00:00Z",
        "source_type": "bank_transfer"
      }
    ],
    "page_num": 1,
    "page_size": 100,
    "total_count": 1
  }
}
```

### 3. Get Conversion Details
```
GET /airwallex/conversions/:conversionId
```

**Path Parameters:**
- `conversionId`: Conversion ID'si

**Query Parameters:**
- `account_id` (required): Hesap ID'si

**Response:**
```json
{
  "success": true,
  "message": "Conversion details retrieved successfully",
  "data": {
    "conversion_id": "conv_123456",
    "request_id": "req_123456",
    "buy_currency": "EUR",
    "sell_currency": "USD",
    "buy_amount": 850,
    "sell_amount": 1000,
    "status": "completed",
    "awx_rate": 0.85,
    "client_rate": 0.85,
    "mid_rate": 0.84,
    "currency_pair": "USD/EUR",
    "conversion_date": "2024-01-01",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "settlement_cutoff_at": "2024-01-01T00:00:00Z",
    "short_reference_id": "REF123",
    "dealt_currency": "USD",
    "quote_id": "quote_123456"
  }
}
```

## Kullanım Örnekleri

### Tüm Conversions'ları Getir
```typescript
const result = await conversionService.getConversions();
```

### Filtreli Conversions Getir
```typescript
const result = await conversionService.getConversions({
  buy_currency: 'EUR',
  sell_currency: 'USD',
  from_created_at: '2024-01-01',
  to_created_at: '2024-01-31',
  status: 'completed',
  page_num: 1,
  page_size: 50
}, 'account_123');
```

### Conversion Detayları Getir
```typescript
const result = await conversionService.getConversionById('account_123', 'conv_123456');
```

### Yeni Conversion Oluştur
```typescript
const result = await conversionService.createConversion({
  buy_currency: 'EUR',
  sell_currency: 'USD',
  buy_amount: '1000',
  sell_amount: '1100',
  conversion_date: '2024-01-15'
}, 'account_123');
```

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
- Account ID parametresi zorunludur

## Logging

Servis, tüm API çağrılarını ve hataları detaylı şekilde loglar:

- API çağrı başlangıcı
- Token alma işlemi
- API response durumu
- Hata detayları
- Response normalizasyonu 