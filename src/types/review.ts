export interface Review {
    id: string;
    placeId: string;
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    comment?: string | null;
    wouldGoAgain: boolean;
    createdAt: string;
    updatedAt?: string | null;
}

export interface PlaceReviewsResponse {
    placeId: string;
    averageRating: number;
    reviewCount: number;
    reviews: Review[];
}

export interface CreateReviewRequest {
    placeId: string;
    rating: number;
    comment?: string;
    wouldGoAgain: boolean;
}

export interface UpdateReviewRequest {
    rating: number;
    comment?: string;
    wouldGoAgain: boolean;
}