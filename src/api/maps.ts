import { MapPlace } from "../types/place";
import { api } from "./client";

export interface ResolveGoogleLinkResponse {
    originalUrl?: string;
    title?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    queryText?: string;
    missingFields?: string[];
}

export async function resolveGoogleLink(url: string): Promise<ResolveGoogleLinkResponse> {
    const response = await api.post("/maps/resolve-google-link", { url });
    return response.data.data ?? response.data;
}

export async function getMapPlaces(groupId: string): Promise<MapPlace[]> {
    const response = await api.get(`/maps/map/group/${groupId}`);
    return response.data.data ?? response.data;
}