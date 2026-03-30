import {
    CreateReviewRequest,
    PlaceReviewsResponse,
    Review,
    UpdateReviewRequest,
} from "../types/review";
import { api } from "./client";

export async function createReview(payload: CreateReviewRequest): Promise<Review> {
    const response = await api.post("/reviews/CreateReview", payload);
    return response.data.data ?? response.data;
}

export async function updateReview(reviewId: string, payload: UpdateReviewRequest): Promise<Review> {
    const response = await api.put(`/reviews/${reviewId}/UpdateReview`, payload);
    return response.data.data ?? response.data;
}

export async function getReviewsByPlace(placeId: string): Promise<PlaceReviewsResponse> {
    const response = await api.get(`/reviews/GetPlaceReviews/${placeId}`);
    return response.data.data ?? response.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}/DeleteReview`);
}