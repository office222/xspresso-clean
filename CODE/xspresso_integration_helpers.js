// xspresso_integration_helpers.js
// Helper functions for integrating with email, webhooks, and 3rd party APIs

export class IntegrationHelpers {
  // Example: Send to outbound webhook
  static async sendWebhook(url, payload) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Example: Send email via generic API (mailgun/sendgrid/etc)
  static async sendEmail(apiEndpoint, apiKey, emailPayload) {
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(emailPayload)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Example: Log integration event on UI/help debug
  static logEvent(type, message) {
    if (window && window.console) window.console.log(`[Integration:${type}] ${message}`);
  }
}

// Usage:
// await IntegrationHelpers.sendWebhook('https://myapi.com/webhook', {foo:'bar'})
// await IntegrationHelpers.sendEmail('https://api.mailgun.net/v3/my','APIKEY',{to:'me@me.com',subject:'Yo'})
