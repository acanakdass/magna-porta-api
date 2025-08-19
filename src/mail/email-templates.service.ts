import { Injectable } from '@nestjs/common';

export interface TransferNotificationData {
  recipientName: string;
  transferAmount: string;
  currency: string;
  transferDate: string;
  transferMethod: string;
  transferId: string;
  reference: string;
  iban: string;
  businessDays: string;
  airwallexAccount?: string;
}

export interface WelcomeEmailData {
  userName: string;
  companyName?: string;
}

export interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiryTime: string;
}

@Injectable()
export class EmailTemplatesService {
  
  /**
   * Creates a beautiful transfer notification email template
   */
  createTransferNotificationTemplate(data: TransferNotificationData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Notification</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
          }
          
          .summary-box {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .summary-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            text-align: right;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 24px;
            }
            
            .summary-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
            </div>
            <h1 class="main-heading">Your transfer to ${data.recipientName} is on its way</h1>
            <p class="sub-heading">Secure and reliable money transfers</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi there,</p>
            <p class="description">
              Your transfer to ${data.recipientName} should arrive in ${data.businessDays} business days from ${data.transferDate}.<br>
              Here's a summary of this transfer:
            </p>
            
            <div class="summary-box">
              <h3 class="summary-title">Transfer Summary</h3>
              
              <div class="summary-item">
                <span class="summary-label">Airwallex account:</span>
                <span class="summary-value">${data.airwallexAccount || data.recipientName}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transfer amount:</span>
                <span class="summary-value">${data.transferAmount} ${data.currency}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">To:</span>
                <span class="summary-value">${data.recipientName}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transfer date:</span>
                <span class="summary-value">${data.transferDate}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transfer method:</span>
                <span class="summary-value">${data.transferMethod}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Transfer ID:</span>
                <span class="summary-value">${data.transferId}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">Reference:</span>
                <span class="summary-value">${data.reference}</span>
              </div>
              
              <div class="summary-item">
                <span class="summary-label">IBAN:</span>
                <span class="summary-value">....${data.iban.slice(-4)} - ${data.iban.slice(-8)}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View transfer</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This email was sent by Magna Porta. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Creates a welcome email template
   */
  createWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Magna Porta</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 50px;
            height: 50px;
            background-color: #ff6b35;
            border-radius: 10px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
          }
          
          .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: white;
          }
          
          .welcome-heading {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .welcome-subtitle {
            font-size: 18px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          
          .welcome-message {
            font-size: 20px;
            margin-bottom: 25px;
            color: #555;
            font-weight: 500;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
          }
          
          .feature {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
          }
          
          .feature-icon {
            font-size: 32px;
            margin-bottom: 15px;
            display: block;
          }
          
          .feature-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
          }
          
          .feature-description {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 18px 36px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            margin-top: 20px;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .welcome-heading {
              font-size: 26px;
            }
            
            .features {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
            </div>
            <h1 class="welcome-heading">Welcome to Magna Porta!</h1>
            <p class="welcome-subtitle">Your gateway to seamless financial solutions</p>
          </div>
          
          <div class="content">
            <p class="welcome-message">Hello ${data.userName}!</p>
            <p class="description">
              Welcome to Magna Porta! We're excited to have you on board. 
              ${data.companyName ? `You're now part of the ${data.companyName} team.` : ''}
              Get ready to experience seamless and secure financial operations.
            </p>
            
            <div class="features">
              <div class="feature">
                <span class="feature-icon">🔒</span>
                <h3 class="feature-title">Secure & Reliable</h3>
                <p class="feature-description">Bank-grade security for all your transactions</p>
              </div>
              
              <div class="feature">
                <span class="feature-icon">⚡</span>
                <h3 class="feature-title">Fast & Efficient</h3>
                <p class="feature-description">Quick processing and real-time updates</p>
              </div>
              
              <div class="feature">
                <span class="feature-icon">🌍</span>
                <h3 class="feature-title">Global Reach</h3>
                <p class="feature-description">Send money worldwide with ease</p>
              </div>
            </div>
            
            <a href="#" class="cta-button">Get Started</a>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              Thank you for choosing Magna Porta. If you have any questions, our support team is here to help.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Creates a password reset email template
   */
  createPasswordResetTemplate(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #ff6b35;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          
          .main-heading {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
          }
          
          .sub-heading {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.8;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
          }
          
          .warning-title {
            font-size: 16px;
            font-weight: 600;
            color: #856404;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          
          .warning-icon {
            margin-right: 8px;
            font-size: 18px;
          }
          
          .warning-text {
            font-size: 14px;
            color: #856404;
            line-height: 1.6;
          }
          
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            margin: 20px 0;
          }
          
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
          }
          
          .expiry-info {
            font-size: 14px;
            color: #6c757d;
            margin-top: 20px;
            font-style: italic;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer-text {
            font-size: 12px;
            color: #6c757d;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            
            .header, .content {
              padding: 20px;
            }
            
            .main-heading {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <div class="logo-text">Magna Porta</div>
            </div>
            <h1 class="main-heading">Password Reset Request</h1>
            <p class="sub-heading">Secure account recovery</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${data.userName},</p>
            <p class="description">
              We received a request to reset your password for your Magna Porta account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div class="warning-box">
              <div class="warning-title">
                <span class="warning-icon">⚠️</span>
                Important Security Notice
              </div>
              <p class="warning-text">
                This link will expire in ${data.expiryTime}. For security reasons, 
                please reset your password immediately and do not share this link with anyone.
              </p>
            </div>
            
            <a href="${data.resetLink}" class="reset-button">Reset Password</a>
            
            <p class="expiry-info">
              Link expires: ${data.expiryTime}
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              If you didn't request this password reset, please contact our support team immediately.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
