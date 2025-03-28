// lib/services/whatsapp-message-service.ts

import prisma from "@/lib/prisma";

export class WhatsAppMessageService {
  private storeId: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor(storeId: string) {
    this.storeId = storeId;
  }

  /**
   * Initialize the WhatsApp message service
   */
  async initialize(): Promise<boolean> {
    try {
      // Get store WhatsApp credentials
      const store = await prisma.store.findUnique({
        where: { id: this.storeId },
        select: {
          whatsappAccessToken: true,
          whatsappPhoneNumberId: true,
        },
      });

      if (!store?.whatsappAccessToken || !store?.whatsappPhoneNumberId) {
        console.error("WhatsApp Business API not configured for store:", this.storeId);
        return false;
      }

      this.accessToken = store.whatsappAccessToken;
      this.phoneNumberId = store.whatsappPhoneNumberId;
      return true;
    } catch (error) {
      console.error("Error initializing WhatsApp message service:", error);
      return false;
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp text message:", errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp text message:", error);
      return false;
    }
  }

  /**
   * Send an interactive message (buttons or lists)
   */
  async sendInteractiveMessage(
    to: string,
    content: string | any,
    metadata: any
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

      // Format message payload
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: metadata.interactive,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp interactive message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp interactive message:", error);
      return false;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams?: any
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

      // Format components based on params
      const components = [];
      
      // If we have parameters, format them as body components
      if (templateParams && Object.keys(templateParams).length > 0) {
        const parameters = Object.entries(templateParams).map(([_, value]) => ({
          type: "text",
          text: value,
        }));
        
        components.push({
          type: "body",
          parameters,
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en_US",
            },
            components,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp template message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp template message:", error);
      return false;
    }
  }

  /**
   * Send a media message (image, document, etc.)
   */
  async sendMediaMessage(
    to: string,
    mediaType: "image" | "audio" | "document" | "video",
    mediaUrl: string,
    caption?: string
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      // Format message payload
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
        },
      };
      
      // Add caption if provided (only for image, document, and video)
      if (caption && (mediaType === "image" || mediaType === "document" || mediaType === "video")) {
        payload[mediaType].caption = caption;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to send WhatsApp ${mediaType} message:`, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error sending WhatsApp ${mediaType} message:`, error);
      return false;
    }
  }

  /**
   * Send a location message
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "location",
        location: {
          latitude,
          longitude,
        },
      };
      
      // Add optional name and address if provided
      if (name) payload.location.name = name;
      if (address) payload.location.address = address;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp location message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp location message:", error);
      return false;
    }
  }

  /**
   * Send a list message (for product catalogs, menus, etc.)
   */
  async sendListMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: headerText,
            },
            body: {
              text: bodyText,
            },
            action: {
              button: buttonText,
              sections,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp list message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp list message:", error);
      return false;
    }
  }

  /**
   * Send a product message from catalog
   */
  async sendProductMessage(
    to: string, 
    catalogId: string,
    productRetailerId: string
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "product",
            body: {
              text: "Check out this product"
            },
            action: {
              catalog_id: catalogId,
              product_retailer_id: productRetailerId
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp product message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp product message:", error);
      return false;
    }
  }

  /**
   * Send a product list message (multi-product display)
   */
  async sendProductListMessage(
    to: string,
    catalogId: string,
    productRetailerIds: string[],
    headerText: string,
    bodyText: string
  ): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      // WhatsApp limits product sections to 30 products
      const productSections = [];
      const productsPerSection = 30;
      
      for (let i = 0; i < productRetailerIds.length; i += productsPerSection) {
        const sectionProducts = productRetailerIds.slice(i, i + productsPerSection);
        
        productSections.push({
          title: `Products ${i + 1} - ${i + sectionProducts.length}`,
          product_items: sectionProducts.map(id => ({ 
            product_retailer_id: id 
          }))
        });
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "product_list",
            header: {
              type: "text",
              text: headerText
            },
            body: {
              text: bodyText
            },
            action: {
              catalog_id: catalogId,
              sections: productSections
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send WhatsApp product list message:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp product list message:", error);
      return false;
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to mark message as read:", errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }
}