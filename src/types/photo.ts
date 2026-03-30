export interface PlacePhoto {
    id: string;
    placeId: string;
    uploadedByUserId: string;
    uploadedByName: string;
    imageUrl: string;
    caption?: string | null;
    createdAt: string;
}