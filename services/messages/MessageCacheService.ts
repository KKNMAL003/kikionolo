import type { Message } from '../interfaces/IMessageService';

class MessageCacheService {
  private cache: Record<string, Message> = {};

  get(id: string): Message | undefined {
    return this.cache[id];
  }
  set(id: string, message: Message): void {
    this.cache[id] = message;
  }
  remove(id: string): void {
    delete this.cache[id];
  }
  clear(): void {
    this.cache = {};
  }
  getAll(): Message[] {
    return Object.values(this.cache);
  }
  setAll(messages: Message[]): void {
    this.cache = {};
    (Array.isArray(messages) ? messages : []).forEach(msg => { this.cache[msg.id] = msg; });
  }
}

export const messageCacheService = new MessageCacheService(); 