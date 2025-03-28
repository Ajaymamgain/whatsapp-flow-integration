// app/api/webhooks/whatsapp/message/[storeId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ConversationStateManager } from "@/lib/services/conversation-state-manager";

// Verify webhook (GET request from WhatsApp API verification)
export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = params;
    const { searchParams } = new URL(request.url);
    
    // Get the verify token from the store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { whatsappWebhookSecret: true },
    });
    
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    
    // Get the challenge and verify token from the request
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    
    // Check if the mode and token are correct
    if (mode === "subscribe" && token === store.whatsappWebhookSecret) {
      console.log("Webhook verified");
      return new NextResponse(challenge);
    } else {
      console.error("Webhook verification failed");
      return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle incoming messages (POST request from WhatsApp API)
export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = params;
    const body = await request.json();
    
    // Get the store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { 
        id: true,
        whatsappAccessToken: true,
        whatsappPhoneNumberId: true,
      },
    });
    
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    
    // Log the incoming webhook
    console.log("Received webhook:", JSON.stringify(body, null, 2));
    
    // Check if this is a WhatsApp message
    if (
      body.object === "whatsapp_business_account" &&
      body.entry &&
      body.entry.length > 0 &&
      body.entry[0].changes &&
      body.entry[0].changes.length > 0 &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages.length > 0
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // The phone number that sent the message
      const messageId = message.id;
      
      console.log(`Received message from ${from}`);
      
      // Initialize the conversation state manager
      const conversationManager = new ConversationStateManager(storeId);
      const initialized = await conversationManager.initialize();
      
      if (!initialized) {
        console.error("Failed to initialize conversation manager");
        return NextResponse.json({ error: "Failed to initialize conversation manager" }, { status: 500 });
      }
      
      // Process the message with the conversation state manager
      await conversationManager.processMessage(from, message);
      
      // Mark the message as read
      const messageService = conversationManager.getWhatsAppService();
      if (messageService) {
        await messageService.markMessageAsRead(messageId);
      }
      
      return NextResponse.json({ success: true });
    }
    
    // If it's not a message, it might be a status update
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}