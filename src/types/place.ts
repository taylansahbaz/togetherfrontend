import { PlacePhoto } from "./photo";
import { Review } from "./review";

export type PlaceStatus = "Wishlist" | "Visited";

export interface Place {
    id: string;
    groupId: string;
    title: string;
    city?: string | null;
    address?: string | null;
    latitude: number;
    longitude: number;
    visitDate?: string | null;
    category?: string | null;
    description?: string | null;
    createdByUserId: string;
    createdByName?: string;
    createdAt: string;
    status: PlaceStatus;
}

export interface CreatePlaceRequest {
    groupId: string;
    title: string;
    city: string;
    address?: string;
    latitude: number;
    longitude: number;
    visitDate?: string | null;
    category?: string;
    description?: string;
    status: PlaceStatus;
}

export interface UpdatePlaceRequest {
    title: string;
    city: string;
    address?: string;
    latitude: number;
    longitude: number;
    visitDate?: string | null;
    category?: string;
    description?: string;
}

export interface PlaceDetailAggregate {
    id: string;
    groupId: string;
    title: string;
    city?: string | null;
    address?: string | null;
    latitude: number;
    longitude: number;
    visitDate?: string | null;
    category?: string | null;
    description?: string | null;
    createdByUserId: string;
    createdByName: string;
    createdAt: string;
    averageRating: number;
    reviewCount: number;
    currentUserReview?: Review | null;
    reviews: Review[];
    photos: PlacePhoto[];
    status?: PlaceStatus;
}

export interface MapPlace {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    status: PlaceStatus;
    category?: string;
    city?: string;
    groupName?: string;
}