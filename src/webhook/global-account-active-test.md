# Global Account Active Webhook Test

## Webhook Data Örneği

```json
{
  "id": "2a396f97-92f4-3075-98fa-43acf6e87412",
  "name": "global_account.active",
  "account_id": "acct_t6nlGSCgPpWIBE-3ncOTxA",
  "data": {
    "account_name": "John Smith",
    "account_number": "03345102",
    "account_type": "Checking",
    "alternate_account_identifiers": {
      "email": "tester@airwallex.com"
    },
    "country_code": "GB",
    "iban": "GB06MODR00000003345102",
    "id": "7f687fe6-dcf4-4462-92fa-80335301d9d2",
    "institution": {
      "address": "58 Wood Ln",
      "city": "London",
      "name": "Modulr FS Limited",
      "zip_code": "W12 7RZ"
    },
    "nick_name": "GBP GA",
    "request_id": "8d411ad4-aed6-1261-92fa-51225212e2e1",
    "required_features": [
      {
        "currency": "GBP",
        "transfer_method": "LOCAL"
      }
    ],
    "status": "ACTIVE",
    "supported_features": [
      {
        "currency": "GBP",
        "local_clearing_system": "BACS",
        "routing_codes": [
          {
            "type": "sort_code",
            "value": "000000"
          }
        ],
        "transfer_method": "LOCAL",
        "type": "DEPOSIT"
      }
    ],
    "swift_code": "MODRGB21"
  },
  "created_at": "2025-08-20T14:42:56+0000",
  "version": "2025-06-16"
}
```

## Email Template Örneği

Bu webhook tetiklendiğinde, aşağıdaki gibi bir email gönderilecek:

**Subject:** Your GBP Global Account in GB has been activated

**Content:**
```
Hi John Smith,

Thank you for your patience. Your GBP Global Account in GB has now been activated and is ready to use. Here's a summary of your account details:

John Smith
✅ ACTIVE

Airwallex Account: acct_t6nlGSCgPpWIBE-3ncOTxA
IBAN: GB06MODR00000003345102
Account Location: GB
Bank Name: Modulr FS Limited
Account Number: 03345102
SWIFT Code: MODRGB21
Nick Name: GBP GA
Activation Date: 8/20/2025

✅ Your account is now fully operational. You can start using it for international transactions and payments.
```

## Test Etmek İçin

1. Webhook'u test etmek için yukarıdaki JSON verisini kullanın
2. Webhook name: `global_account.active`
3. Email template otomatik olarak tetiklenecek
4. Company bulunursa, company users'a email gönderilecek
5. Company bulunamazsa, admin'e fallback email gönderilecek

## Özellikler

- ✅ Webhook data parsing
- ✅ Email template generation
- ✅ Company lookup
- ✅ User notification
- ✅ Fallback admin notification
- ✅ Beautiful HTML email design
- ✅ Responsive design
- ✅ Status badge
- ✅ Account details table
- ✅ Activation confirmation
