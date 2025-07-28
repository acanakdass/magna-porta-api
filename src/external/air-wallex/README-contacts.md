# Airwallex Contacts Service

Bu servis, Airwallex API'si üzerinden **beneficiary (alıcı) bilgilerini** yönetmek için kullanılır.

## 🎯 **Ne İşe Yarar?**

### **Temel Amaç:**
- **Beneficiary Listesi**: Transfer yapılacak kişilerin listesini getirir
- **Detaylı Bilgiler**: Belirli bir beneficiary'nin tüm detaylarını getirir
- **Filtreleme**: Status, email, account name gibi kriterlere göre filtreleme
- **Pagination**: Büyük listeleri sayfalama ile yönetme

### **Kullanım Alanları:**
- Transfer yapılacak kişileri listeleme
- Beneficiary bilgilerini görüntüleme
- Banka hesap bilgilerini alma
- Kişisel/business bilgilerini kontrol etme

## 🚀 **API Endpoints**

### **1. Get Contacts (Beneficiaries)**
```
GET /airwallex/contacts
```

**Query Parameters:**
- `status` (optional): Beneficiary durumu (active, inactive, vb.)
- `account_name` (optional): Hesap adı filtresi
- `account_number` (optional): Hesap numarası filtresi
- `email` (optional): Email adresi filtresi
- `page_num` (optional): Sayfa numarası (default: 0)
- `page_size` (optional): Sayfa boyutu (default: 100)
- `account_id` (optional): Hesap ID'si

**Response:**
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

### **2. Get Contact Details**
```
GET /airwallex/contacts/:contactId
```

### **3. Create Beneficiary/Contact**
```
POST /airwallex/contacts/create
```

**Path Parameters:**
- `contactId`: Contact ID'si

**Query Parameters:**
- `account_id` (optional): Hesap ID'si

**Response:**
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
      "company_name": null,
      "date_of_birth": "1990-01-01",
      "address": {
        "street_address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postcode": "10001",
        "country_code": "US"
      },
      "bank_details": {
        "account_name": "John Doe",
        "account_number": "1234567890",
        "bank_name": "Chase Bank",
        "swift_code": "CHASUS33",
        "iban": "US12345678901234567890",
        "account_currency": "USD"
      },
      "additional_info": {
        "personal_email": "john@example.com",
        "personal_mobile_number": "+1234567890"
      }
    }
  }
}
```

## 📊 **Contact Özellikleri**

### **Temel Bilgiler:**
- **beneficiary_id**: Benzersiz beneficiary ID'si
- **account_name**: Hesap sahibinin adı
- **account_number**: Banka hesap numarası
- **email**: Email adresi
- **payment_method**: Ödeme yöntemi
- **status**: Beneficiary durumu

### **Detaylı Bilgiler:**
- **Personal Info**: Ad, soyad, doğum tarihi
- **Address**: Adres bilgileri
- **Bank Details**: Banka hesap detayları
- **Additional Info**: Ek bilgiler (telefon, email)
- **Business Info**: Şirket bilgileri (business entity'ler için)

## 🔍 **Filtreleme Özellikleri**

### **Status Filtresi:**
```typescript
// Get only active beneficiaries
const result = await contactsService.getContacts({
  status: 'active'
});
```

### **Email Filtresi:**
```typescript
// Get beneficiaries with specific email
const result = await contactsService.getContacts({
  email: 'john@example.com'
});
```

### **Account Name Filtresi:**
```typescript
// Filter by account name
const result = await contactsService.getContacts({
  account_name: 'John'
});
```

### **Pagination:**
```typescript
// Manage large lists with pagination
const result = await contactsService.getContacts({
  page_num: 0,
  page_size: 50
});
```

## 🛡️ **Güvenlik**

- Tüm endpoint'ler JWT authentication gerektirir
- `@UseGuards(JwtAuthGuard)` decorator'ı kullanılır
- Account ID parametresi opsiyonel

## 📝 **Logging**

Servis, tüm API çağrılarını ve hataları detaylı şekilde loglar:

- API çağrı başlangıcı
- Token alma işlemi
- API response durumu
- Hata detayları
- Response normalizasyonu

## 🚀 **Kullanım Örnekleri**

### Tüm Contacts'ları Getir
```typescript
const result = await contactsService.getContacts();
```

### Belirli Hesap için Contacts Getir
```typescript
const result = await contactsService.getContacts({}, 'account_123');
```

### Filtreli Contacts Getir
```typescript
const result = await contactsService.getContacts({
  status: 'active',
  email: 'john@example.com',
  page_num: 0,
  page_size: 50
}, 'account_123');
```

### Contact Detayları Getir
```typescript
const result = await contactsService.getContactById('ben_123456', 'account_123');
```

### Yeni Beneficiary Oluştur
```typescript
const result = await contactsService.createBeneficiary({
  beneficiary: {
    additional_info: {
      external_identifier: "EXT123",
      personal_email: "john@example.com"
    },
    address: {
      city: "New York",
      country_code: "US",
      postcode: "10001",
      state: "NY",
      street_address: "123 Main Street"
    },
    bank_details: {
      account_currency: "USD",
      account_name: "John Doe",
      account_number: "1234567890",
      account_routing_type1: "aba",
      account_routing_value1: "021000021",
      bank_country_code: "US",
      local_clearing_system: "ACH"
    },
    entity_type: "individual",
    type: "individual"
  },
  nickname: "John Doe",
  transfer_methods: ["bank_transfer", "swift"]
}, 'account_123');
```

## 🔄 **Hata Yönetimi**

Servis, aşağıdaki hata durumlarını yönetir:

- **401 Unauthorized**: Kimlik doğrulama hatası
- **404 Not Found**: Contact bulunamadı
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

## 📋 **Contact Types**

### **Individual Contact:**
- Kişisel bilgiler (ad, soyad, doğum tarihi)
- Kişisel adres
- Kişisel banka hesabı

### **Business Contact:**
- Şirket bilgileri
- Business adres
- Business banka hesabı
- Legal representative bilgileri

### **Digital Wallet Contact:**
- Digital wallet provider bilgileri
- Wallet ID bilgileri 