import { supabase } from '../../lib/supabase';
import type { Message, CreateMessageRequest, MessageFilters, ConversationSummary } from '../interfaces/IMessageService';

async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

class MessageApiService {
  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    return retry(async () => {
      // ... (copy logic from MessageService)
      // return formattedMessage;
    });
  }
  async getMessages(userId: string, filters?: MessageFilters): Promise<Message[]> {
    return retry(async () => {
      // ...
    });
  }
  async markAsRead(messageId: string): Promise<void> {
    return retry(async () => {
      // ...
    });
  }
  async markAllAsRead(userId: string): Promise<void> {
    return retry(async () => {
      // ...
    });
  }
  async getUnreadCount(userId: string): Promise<number> {
    return retry(async () => {
      // ...
    });
  }
  async getConversationSummary(userId: string): Promise<ConversationSummary> {
    return retry(async () => {
      // ...
    });
  }
  async deleteMessage(messageId: string): Promise<boolean> {
    return retry(async () => {
      // ...
    });
  }
  async getMessagesByDate(userId: string, date: string): Promise<Message[]> {
    return retry(async () => {
      // ...
    });
  }
}

export const messageApiService = new MessageApiService();
export { retry }; 