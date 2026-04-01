export interface Notification {
    id: string;
    userId: string;
    actorName: string; 
    actionType: "PlaceAdded" | "PhotoAdded" | "ReviewAdded" | "GroupJoined"; 
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedEntityId?: string; 
}