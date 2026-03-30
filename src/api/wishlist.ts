import { api } from "./client";
import { Place } from "../types/place";

export async function markPlaceAsVisited(
    placeId: string,
    visitDate?: string
): Promise<Place> {
    const query = visitDate
        ? `?visitDate=${encodeURIComponent(visitDate)}`
        : "";

    const response = await api.put(`/wishlist/${placeId}/mark-as-visited${query}`);
    return response.data.data ?? response.data;
}