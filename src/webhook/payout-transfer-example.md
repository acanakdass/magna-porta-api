# Payout Transfer Funding Funded Webhook - Örnek Kullanım

## 📧 **Webhook Verisi**

```json
{
  "request_id": "req_123456789",
  "id": "payout_987654321",
  "status": "COMPLETED",
  "reference": "INV-2024-001",
  "reason": "Invoice Payment",
  "transfer_date": "2024-01-15",
  "source_amount": 1000.00,
  "source_currency": "USD",
  "amount_beneficiary_receives": 980.00,
  "transfer_currency": "USD",
  "fee_amount": 20.00,
  "fee_currency": "USD",
  "fee_paid_by": "PAYER",
  "created_at": "2024-01-15T10:30:00Z",
  "payer": {
    "company_name": "ABC Corporation",
    "entity_type": "CORPORATION",
    "address": {
      "city": "New York",
      "country_code": "US",
      "state": "NY",
      "postcode": "10001",
      "street_address": "123 Business Ave"
    },
    "additional_info": {
      "business_incorporation_date": "2020-01-01",
      "business_registration_number": "REG123456",
      "business_registration_type": "LLC"
    }
  },
  "beneficiary": {
    "bank_details": {
      "account_name": "John Doe",
      "bank_name": "Chase Bank",
      "iban": "US12345678901234567890",
      "swift_code": "CHASUS33",
      "account_currency": "USD",
      "bank_country_code": "US"
    },
    "entity_type": "INDIVIDUAL",
    "type": "BANK_ACCOUNT"
  }
}
```

## 🔄 **Data Parsing Süreci**

1. **Webhook alınır**: `payout.transfer.funding.funded` webhook'u gelir
2. **Data parse edilir**: `WebhookDataParserService.parseWebhookData()` çağrılır
3. **Model oluşturulur**: `PayoutTransferFundingFundedHookData` tipinde veri oluşturulur
4. **HTML template oluşturulur**: `generatePayoutTransferFundingFundedTemplate()` çağrılır
5. **Mail gönderilir**: 

## 📊 **Parse Edilen Veri**

```typescript
{
  request_id: "req_123456789",
  id: "payout_987654321",
  status: "COMPLETED",
  reference: "INV-2024-001",
  reason: "Invoice Payment",
  transfer_date: "2024-01-15",
  source_amount: 1000.00,
  source_currency: "USD",
  amount_beneficiary_receives: 980.00,
  transfer_currency: "USD",
  fee_amount: 20.00,
  fee_currency: "USD",
  fee_paid_by: "PAYER",
  created_at: "2024-01-15T10:30:00Z",
  payer: { /* payer details */ },
  beneficiary: { /* beneficiary details */ }
}
```

## 🎨 **Oluşturulan HTML Mail**

- **Header**: Yeşil gradient ile "Your transfer to [Recipient] is on its way"
- **İçerik**: 2 ana bölümde transfer özeti:
  1. **Transfer Summary**: Airwallex account, Transfer amount, To, Transfer date, Transfer method, Transfer ID
  2. **Additional Details**: Reference, IBAN (masked), Bank, Account Currency

## 🚀 **Kullanım Senaryosu**

Bu webhook, bir payout transfer işlemi tamamlandığında tetiklenir ve müşteriye:

1. **Bilgilendirme**: Transfer'in yolda olduğunu bildirir
2. **Detaylar**: Transfer özeti ve ek detayları gösterir
3. **Profesyonellik**: Magna Porta markası ile güzel tasarım
4. **İngilizce**: Tamamen İngilizce içerik

## 🔧 **Teknik Detaylar**

- **Model**: `PayoutTransferFundingFundedHookData`
- **Parser**: `WebhookDataParserService.parseWebhookData()`
- **Template**: `generatePayoutTransferFundingFundedTemplate()`
- **Mail**: HTML formatında responsive tasarım
- **Dil**: İngilizce (lang="en")

## 📱 **Responsive Tasarım**

- Mobil uyumlu (max-width: 600px)
- Modern CSS (Grid, Flexbox, Gradients)
- Hover efektleri
- Magna Porta brand colors
- Kırmızı tema (payout için uygun)

## 💰 **Özellikler**

- **Transfer Özeti**: Airwallex hesap, transfer tutarı, alıcı, tarih, yöntem, ID
- **Ek Detaylar**: Referans, IBAN (masked), banka, hesap para birimi
- **Güvenlik**: IBAN sadece son 4 hanesi gösterilir
- **Tasarım**: Yeşil tema ile transfer için uygun
