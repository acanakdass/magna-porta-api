# Conversion Settled Webhook - Örnek Kullanım

## 📧 **Webhook Verisi**

```json
{
  "request_id": "7a21bf75-36ef-4158-9ba7-80b9d7d8b707",
  "conversion_id": "f8fe5c52-674c-4099-b4f3-cdb13201af5b",
  "short_reference_id": "C250819-O9WIX8H",
  "status": "SETTLED",
  "currency_pair": "USDSGD",
  "client_rate": 1.289293,
  "awx_rate": 1.289293,
  "mid_rate": 1.28507,
  "buy_currency": "USD",
  "buy_amount": 3.88,
  "sell_currency": "SGD",
  "sell_amount": 5,
  "dealt_currency": "SGD",
  "conversion_date": "2025-08-20",
  "settlement_cutoff_time": "2025-08-19T19:07:52+0000",
  "created_at": "2025-08-19T19:07:53+0000",
  "metadata": null,
  "client_data": null,
  "batch_id": null,
  "quote_id": "09fc71ae-a5e2-3b60-bae4-c732436b2e2f",
  "rate_details": [
    {
      "level": "CLIENT",
      "rate": 1.289293,
      "buy_amount": 3.88,
      "sell_amount": 5
    }
  ],
  "funding_source": null,
  "funding": null,
  "application_fee_options": null,
  "application_fees": null,
  "collateral": null,
  "updated_at": "2025-08-19T19:07:53+0000"
}
```

## 🔄 **Data Parsing Süreci**

1. **Webhook alınır**: `conversion.settled` webhook'u gelir
2. **Data parse edilir**: `WebhookDataParserService.parseWebhookData()` çağrılır
3. **Model oluşturulur**: `ConversionSettledEmailData` tipinde veri oluşturulur
4. **HTML template oluşturulur**: `generateConversionSettledTemplate()` çağrılır
5. **Mail gönderilir**: Güzel HTML template ile mail gönderilir

## 📊 **Parse Edilen Veri**

```typescript
{
  shortReferenceId: "C250819-O9WIX8H",
  buyCurrency: "USD",
  buyAmount: 3.88,
  sellCurrency: "SGD",
  sellAmount: 5,
  clientRate: 1.289293,
  conversionDate: "2025-08-20",
  status: "SETTLED",
  currencyPair: "USDSGD"
}
```

## 🎨 **Oluşturulan HTML Mail**

- **Header**: Yeşil gradient ile "Döviz Çevirisi Tamamlandı!"
- **İçerik**: Detaylı çeviri özeti
- **Özellikler**: 
  - Referans ID
  - Döviz çifti (USDSGD)
  - Satın alınan tutar (3.88 USD)
  - Satılan tutar (5 SGD)
  - Müşteri kuru (1 USD = 1.289293 SGD)
  - Çeviri tarihi
  - Durum (SETTLED)

## 🚀 **Kullanım Senaryosu**

Bu webhook, bir döviz çeviri işlemi tamamlandığında tetiklenir ve müşteriye:

1. **Bilgilendirme**: İşlemin tamamlandığını bildirir
2. **Detaylar**: Tüm işlem detaylarını gösterir
3. **Profesyonellik**: Magna Porta markası ile güzel tasarım
4. **Türkçe**: Tamamen Türkçe içerik

## 🔧 **Teknik Detaylar**

- **Model**: `ConversionSettledModel` ve `ConversionSettledEmailData`
- **Parser**: `WebhookDataParserService.parseWebhookData()`
- **Template**: `generateConversionSettledTemplate()`
- **Mail**: HTML formatında responsive tasarım
- **Dil**: Türkçe (lang="tr")

## 📱 **Responsive Tasarım**

- Mobil uyumlu (max-width: 600px)
- Modern CSS (Grid, Flexbox, Gradients)
- Hover efektleri
- Magna Porta brand colors
