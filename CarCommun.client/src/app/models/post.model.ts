export interface Post {
  id: number;
  content: string;
  category?: string;
  metadata?: string;
  userId: string;
  user?: {
    userName: string;
    displayName?: string;
  };
  createdDate: Date;
  updatedDate: Date;
}