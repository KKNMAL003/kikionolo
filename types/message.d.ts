export interface Message {
  id: string;
  user_id: string;
  log_type: 'user_message' | 'staff_message' | 'system';
  subject: string;
  message: string;
  created_at: string;
}
