# Airwallex Transactions Service

Bu servis, Airwallex kart işlemlerini (transactions) yönetmek için kullanılır.

## Özellikler

- ✅ Kart işlemlerini listeleme
- ✅ Filtreleme (tarih, para birimi, kart ID, vb.)
- ✅ Sayfalama desteği
- ✅ Retry mekanizması
- ✅ Error handling
- ✅ Logging

## Endpoints

### GET /airwallex/transactions

Kart işlemlerini listeler.

#### Query Parameters

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `billing_currency` | string | Hayır | Fatura para birimi filtresi |
| `card_id` | string | Hayır | Kart ID filtresi |
| `digital_wallet_token_id` | string | Hayır | Dijital cüzdan token ID filtresi |
| `from_created_at` | string | Hayır | Başlangıç tarihi (ISO 8601) |
| `to_created_at` | string | Hayır | Bitiş tarihi (ISO 8601) |
| `lifecycle_id` | string | Hayır | Yaşam döngüsü ID filtresi |
| `retrieval_ref` | string | Hayır | Alma referansı filtresi |
| `transaction_type` | string | Hayır | İşlem tipi filtresi |
| `transaction_status` | string | Hayır | İşlem durumu filtresi |
| `page_num` | number | Hayır | Sayfa numarası (varsayılan: 0) |
| `page_size` | number | Hayır | Sayfa boyutu (varsayılan: 100) |

#### Örnek Kullanım

```bash
# Tüm işlemleri getir
GET /airwallex/transactions

# USD para birimindeki işlemleri getir
GET /airwallex/transactions?billing_currency=USD

# Belirli tarih aralığındaki işlemleri getir
GET /airwallex/transactions?from_created_at=2024-01-01T00:00:00Z&to_created_at=2024-01-31T23:59:59Z

# Belirli kartın işlemlerini getir
GET /airwallex/transactions?card_id=card_123456

# Sayfalama ile getir
GET /airwallex/transactions?page_num=0&page_size=50
```

#### Response Format

```json
{
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
```

## Servis Kullanımı

```typescript
import { AwTransactionsService } from './services/aw-transactions.service';

@Injectable()
export class MyService {
  constructor(private readonly transactionsService: AwTransactionsService) {}

  async getTransactions() {
    const transactions = await this.transactionsService.getTransactions({
      billing_currency: 'USD',
      page_size: 50
    });
    
    return transactions;
  }
}
```

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz parametreler |
| 401 | Yetkilendirme hatası |
| 403 | Erişim reddedildi |
| 500 | Sunucu hatası |

## Güvenlik

- JWT authentication gerekli
- Sensitive data masking
- Rate limiting
- Input validation 