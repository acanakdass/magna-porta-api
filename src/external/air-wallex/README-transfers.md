# Airwallex Transfers Service

Bu servis, Airwallex transfer/payout işlemlerini yönetmek için kullanılır.

## Özellikler

- ✅ Transfer/payout listeleme
- ✅ Yeni transfer/payout oluşturma
- ✅ Filtreleme (tarih, durum, para birimi, vb.)
- ✅ Sayfalama desteği
- ✅ SCA (Strong Customer Authentication) desteği
- ✅ Retry mekanizması
- ✅ Error handling
- ✅ Logging

## Endpoints

### GET /airwallex/transfers

Transfer/payout'ları listeler.

#### Query Parameters

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `from_created_at` | string | Hayır | Başlangıç tarihi (ISO 8601) |
| `to_created_at` | string | Hayır | Bitiş tarihi (ISO 8601) |
| `status` | string | Hayır | Transfer durumu filtresi |
| `transfer_currency` | string | Hayır | Transfer para birimi filtresi |
| `short_reference_id` | string | Hayır | Kısa referans ID filtresi |
| `page` | string | Hayır | Sayfa cursor'ı |
| `page_size` | number | Hayır | Sayfa boyutu (varsayılan: 100) |
| `request_id` | string | Hayır | Request ID filtresi |

### POST /airwallex/transfers/create

Yeni transfer/payout oluşturur.

#### Request Body

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

#### Örnek Kullanım

```bash
# Tüm transfer'ları getir
GET /airwallex/transfers

# Belirli tarih aralığındaki transfer'ları getir
GET /airwallex/transfers?from_created_at=2024-01-01T00:00:00Z&to_created_at=2024-01-31T23:59:59Z

# Belirli durumdaki transfer'ları getir
GET /airwallex/transfers?status=completed

# Belirli para birimindeki transfer'ları getir
GET /airwallex/transfers?transfer_currency=USD

# Yeni transfer oluştur
POST /airwallex/transfers/create
Content-Type: application/json

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
  "transfer_method": "swift"
}
```

#### Response Format

**GET Response:**
```json
{
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
```

**POST Response:**
```json
{
  "id": "trf_123456",
  "request_id": "req_789012",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## SCA (Strong Customer Authentication)

Transfer işlemleri için SCA token gerekebilir. SCA token olmadan transfer oluşturulduğunda:

```json
{
  "id": "",
  "request_id": "req_789012",
  "status": "403",
  "created_at": "2024-01-15T10:30:00Z",
  "success": false,
  "message": "SCA authentication required",
  "scaSessionCode": "sca_session_code_here"
}
```

## Servis Kullanımı

```typescript
import { AwTransfersService } from './services/aw-transfers.service';

@Injectable()
export class MyService {
  constructor(private readonly transfersService: AwTransfersService) {}

  async getTransfers() {
    const transfers = await this.transfersService.getTransfers({
      status: 'completed',
      transfer_currency: 'USD'
    });
    
    return transfers;
  }

  async createTransfer() {
    const transfer = await this.transfersService.createTransfer({
      beneficiary_id: 'ben_123456',
      payer: {
        address: { country_code: 'US' },
        entity_type: 'individual'
      },
      reason: 'Payment for services',
      reference: 'REF-123456',
      request_id: 'req_789012',
      source_currency: 'USD',
      source_amount: '1000.00',
      transfer_amount: '1000.00',
      transfer_currency: 'USD',
      transfer_date: '2024-01-15',
      transfer_method: 'swift'
    });
    
    return transfer;
  }
}
```

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz parametreler |
| 401 | Yetkilendirme hatası |
| 403 | Erişim reddedildi (SCA gerekli) |
| 500 | Sunucu hatası |

## Güvenlik

- JWT authentication gerekli
- SCA token desteği
- Sensitive data masking
- Rate limiting
- Input validation 