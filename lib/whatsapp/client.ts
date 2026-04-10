/**
 * WhatsApp Cloud API (Meta) Client
 * Handles outgoing messages to the WhatsApp Business API.
 */

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppError {
  message: string;
  type: string;
  code: number;
  error_data?: any;
  fbtrace_id: string;
}

class WhatsAppClient {
  private token: string;
  private phoneNumberId: string;
  private baseUrl: string = "https://graph.facebook.com/v21.0";

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  private async post(endpoint: string, data: any) {
    if (!this.token || !this.phoneNumberId) {
      console.error("WhatsApp API credentials missing in .env");
      throw new Error("WhatsApp API credentials missing");
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          messaging_product: "whatsapp",
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("WhatsApp API Error:", result.error);
        throw result.error as WhatsAppError;
      }

      return result as WhatsAppMessageResponse;
    } catch (error) {
      console.error("WhatsApp Request Failed:", error);
      throw error;
    }
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(to: string, text: string) {
    return this.post("messages", {
      to: this.formatPhone(to),
      type: "text",
      text: { body: text },
    });
  }

  /**
   * Send a template message (required for business-initiated conversations)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    components: any[] = []
  ) {
    return this.post("messages", {
      to: this.formatPhone(to),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components,
      },
    });
  }

  /**
   * Basic phone number formatting for WhatsApp (removes non-digits)
   */
  private formatPhone(phone: string): string {
    let clean = phone.replace(/\D/g, "");
    // Default to Indian country code if 10 digits
    if (clean.length === 10) {
      clean = "91" + clean;
    }
    return clean;
  }
}

export const whatsappClient = new WhatsAppClient();
