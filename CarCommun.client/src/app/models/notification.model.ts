export interface Notification {
  id: number;
  type: string;
  payload: string;
  isRead: boolean;
  userId: string;
  user?: {
    userName: string;
    displayName?: string;
  };
  createdDate: Date;
  updatedDate: Date;
}