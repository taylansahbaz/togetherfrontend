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
    coverPhotoUrl?: string | null;
    photoCount?: number;
    rating?: number | null;
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
    groupId?: string;
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

export type WishDayRsvpResponse =
    | "NotResponded"
    | "Accepted"
    | "Maybe"
    | "Rejected";

export interface WishDayRsvpMember {
    userId: string;
    userName: string;
    response: WishDayRsvpResponse;
    respondedAt?: string | null;
}

export interface WishDayRsvpSummary {
    placeId: string;
    acceptedCount: number;
    maybeCount: number;
    rejectedCount: number;
    notRespondedCount: number;
    totalMembers: number;
    currentUserResponse: WishDayRsvpResponse;
    members: WishDayRsvpMember[];
}