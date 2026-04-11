export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: string;
  inviteStatus?: string | null;
  canRespond: boolean;
}