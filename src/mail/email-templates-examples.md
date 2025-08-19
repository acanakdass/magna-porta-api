# Email Templates Service - Kullanım Örnekleri

Bu dosya, yeni oluşturulan email template servisinin nasıl kullanılacağını göstermektedir.

## 1. Transfer Bildirim Maili

Transfer bildirim maili göndermek için:

```typescript
import { EmailTemplatesService, TransferNotificationData } from './email-templates.service';

// Template servisini inject et
constructor(private emailTemplatesService: EmailTemplatesService) {}

// Transfer verilerini hazırla
const transferData: TransferNotificationData = {
  recipientName: 'Hotelizy OU',
  transferAmount: '2.00',
  currency: 'EUR',
  transferDate: '2025-08-15',
  transferMethod: 'SEPA',
  transferId: 'P250815-9J6RRY2',
  reference: 'test',
  iban: 'LV95HABA0001409590',
  businessDays: '0-2',
  airwallexAccount: 'Hotelizy OU'
};

// HTML template oluştur
const html = this.emailTemplatesService.createTransferNotificationTemplate(transferData);

// Mail gönder
await this.mailService.sendTransferNotification(
  ['customer@example.com'],
  transferData
);
```

## 2. Hoş Geldin Maili

Yeni kullanıcılar için hoş geldin maili:

```typescript
import { EmailTemplatesService, WelcomeEmailData } from './email-templates.service';

const welcomeData: WelcomeEmailData = {
  userName: 'John Doe',
  companyName: 'Hotelizy OU'
};

// HTML template oluştur
const html = this.emailTemplatesService.createWelcomeEmailTemplate(welcomeData);

// Mail gönder
await this.mailService.sendWelcomeEmail(
  ['newuser@example.com'],
  welcomeData
);
```

## 3. Şifre Sıfırlama Maili

Şifre sıfırlama için:

```typescript
import { EmailTemplatesService, PasswordResetData } from './email-templates.service';

const resetData: PasswordResetData = {
  userName: 'John Doe',
  resetLink: 'https://app.magnaporta.com/reset-password?token=abc123',
  expiryTime: '24 hours'
};

// HTML template oluştur
const html = this.emailTemplatesService.createPasswordResetTemplate(resetData);

// Mail gönder
await this.mailService.sendPasswordResetEmail(
  ['user@example.com'],
  resetData
);
```

## 4. API Endpoint'leri

### Transfer Bildirimi
```bash
POST /mail/send-transfer-notification
Content-Type: application/json

{
  "to": ["customer@example.com"],
  "transferData": {
    "recipientName": "Hotelizy OU",
    "transferAmount": "2.00",
    "currency": "EUR",
    "transferDate": "2025-08-15",
    "transferMethod": "SEPA",
    "transferId": "P250815-9J6RRY2",
    "reference": "test",
    "iban": "LV95HABA0001409590",
    "businessDays": "0-2"
  }
}
```

### Hoş Geldin Maili
```bash
POST /mail/send-welcome-email
Content-Type: application/json

{
  "to": ["newuser@example.com"],
  "welcomeData": {
    "userName": "John Doe",
    "companyName": "Hotelizy OU"
  }
}
```

### Şifre Sıfırlama
```bash
POST /mail/send-password-reset
Content-Type: application/json

{
  "to": ["user@example.com"],
  "resetData": {
    "userName": "John Doe",
    "resetLink": "https://app.magnaporta.com/reset-password?token=abc123",
    "expiryTime": "24 hours"
  }
}
```

## 5. Template Özellikleri

### Transfer Bildirim Template'i
- **Header**: Magna Porta logosu ve başlık
- **İçerik**: Transfer özeti (tutar, tarih, ID, IBAN, vb.)
- **CTA Button**: "View transfer" butonu
- **Responsive**: Mobil uyumlu tasarım
- **Renkler**: Mor-mavi gradient header, turuncu logo

### Hoş Geldin Template'i
- **Header**: Karşılama mesajı
- **Özellikler**: 3 ana özellik kartı
- **CTA Button**: "Get Started" butonu
- **Responsive**: Grid layout mobilde tek kolon

### Şifre Sıfırlama Template'i
- **Header**: Kırmızı gradient (güvenlik uyarısı)
- **Uyarı Kutusu**: Önemli güvenlik bilgileri
- **CTA Button**: "Reset Password" butonu
- **Süre Bilgisi**: Link geçerlilik süresi

## 6. CSS Özellikleri

Tüm template'ler şu CSS özelliklerini kullanır:
- Modern font stack (system fonts)
- CSS Grid ve Flexbox
- Gradient arka planlar
- Box shadows ve border radius
- Hover efektleri
- Media queries (responsive)
- CSS custom properties

## 7. Özelleştirme

Template'leri özelleştirmek için:
1. `EmailTemplatesService` sınıfındaki ilgili method'u düzenle
2. CSS stillerini değiştir
3. HTML yapısını güncelle
4. Yeni template'ler ekle

## 8. Test Etme

Template'leri test etmek için:
1. Development ortamında mail gönder
2. Farklı email client'larda test et
3. Mobil ve desktop görünümü kontrol et
4. Farklı tarayıcılarda test et
