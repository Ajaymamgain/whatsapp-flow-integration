# WhatsApp Flow Integration

An advanced WhatsApp conversation flow system for e-commerce platforms, enabling interactive customer journeys, product exploration, and guided conversational experiences.

## Features

### Conversation State Management
- **State Machine**: Robust state tracking for managing conversational context and flow
- **Context Persistence**: Store and retrieve conversation context across messages
- **Flow Engine**: Define and execute complex conversation flows with conditional branching

### Interactive Messaging
- **Button Messages**: Interactive button-based navigation for simplicity
- **List Messages**: Scrollable lists for product categories and items
- **Quick Replies**: Simple response options for common queries
- **Rich Media**: Support for images, documents, and location messages

### Visual Flow Builder
- **Drag-and-Drop Interface**: Visual editor for creating conversation flows
- **Node-Based Design**: Interconnected nodes representing conversation states
- **Conditional Branching**: Create dynamic paths based on customer responses
- **Testing Tools**: Preview and simulate flows before deployment

### Product Browsing Features
- **Category Navigation**: Browse through product categories
- **Product Discovery**: View products within categories
- **Product Details**: See prices, descriptions, and availability
- **Add to Cart**: Direct product purchase through conversation

## Implementation Details

### Modules

1. **Database Schema**
   - `Conversation` model for tracking active chats
   - `Message` model for message history
   - `ConversationFlow` model for flow definitions

2. **Core Services**
   - `ConversationStateManager`: Manages conversation state and context
   - `WhatsAppMessageService`: Handles WhatsApp API communication
   - `FlowExecutionEngine`: Processes and executes conversation flows

3. **API Endpoints**
   - Webhook handler for incoming messages
   - Flow management API for CRUD operations
   - Flow activation/deactivation endpoints

4. **UI Components**
   - Flow Builder with drag-and-drop functionality
   - Flow management dashboard
   - Visual flow preview

## Getting Started

### Prerequisites
- Node.js (18.x or later)
- PostgreSQL database
- WhatsApp Business API credentials

### Installation
1. Clone this repository
2. Install dependencies with `npm install`
3. Update database schema with Prisma:
   ```
   npx prisma db push
   ```
4. Configure WhatsApp Business API credentials in your environment

### Usage

1. **Setup WhatsApp Business API**
   - Configure webhook URL to point to your deployment
   - Set webhook verification token
   - Generate access token with appropriate permissions

2. **Create Conversation Flows**
   - Use the flow builder interface at `/dashboard/whatsapp/flows`
   - Define states, messages, and transitions
   - Test flows with the preview tool

3. **Monitor and Manage Conversations**
   - View active conversations
   - Review message history
   - Analyze flow performance metrics

## Technical Documentation

### Conversation State Model
```typescript
export type ConversationContext = {
  [key: string]: any;
};

export type MessagePayload = {
  type: string;
  content: string | any;
  metadata?: any;
};

export type FlowAction = {
  type: string;
  payload?: any;
};

export type StateTransition = {
  targetState: string;
  condition?: (message: any, context: ConversationContext) => boolean;
};
```

### Flow Definition Example
```json
{
  "states": {
    "INIT": {
      "onEntry": [
        {
          "type": "SEND_MESSAGE",
          "payload": {
            "type": "TEXT",
            "content": "Welcome to our store! How can I help you today?"
          }
        }
      ],
      "transitions": [
        {
          "targetState": "MENU",
          "condition": "isTextMessage"
        }
      ]
    },
    "MENU": {
      "onEntry": [
        {
          "type": "SEND_MESSAGE",
          "payload": {
            "type": "INTERACTIVE",
            "content": "Main Menu",
            "metadata": {
              "interactive": {
                "type": "button",
                "body": {
                  "text": "What would you like to do?"
                },
                "action": {
                  "buttons": [
                    {
                      "type": "reply",
                      "reply": {
                        "id": "browse_products",
                        "title": "Browse Products"
                      }
                    },
                    {
                      "type": "reply",
                      "reply": {
                        "id": "track_order",
                        "title": "Track Order"
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      "transitions": [
        {
          "targetState": "BROWSING",
          "condition": {
            "type": "buttonId",
            "value": "browse_products"
          }
        },
        {
          "targetState": "TRACKING",
          "condition": {
            "type": "buttonId",
            "value": "track_order"
          }
        }
      ]
    }
  }
}
```

## Future Enhancements

1. **AI Integration**
   - Intent detection for free-text messages
   - Natural language understanding
   - Personalized product recommendations

2. **Advanced Analytics**
   - Conversation flow metrics
   - Drop-off point analysis
   - Conversion optimization

3. **Template Management**
   - Template creation interface
   - Approval workflow integration
   - Performance analytics

## License

This project is licensed under the MIT License
