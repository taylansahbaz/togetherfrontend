import { api } from "./client";
import {
    CreatePlaceRequest,
    Place,
    PlaceDetailAggregate,
    UpdatePlaceRequest,
} from "../types/place";

export async function getPlacesByGroup(groupId: string): Promise<Place[]> {
    const response = await api.get(`/places/Getgroup/${groupId}`);
    return response.data.data ?? response.data;
}

export async function getPlaceById(placeId: string): Promise<Place> {
    const response = await api.get(`/places/${placeId}/GetDetailPlace`);
    return response.data.data ?? response.data;
}

export async function createPlace(payload: CreatePlaceRequest): Promise<Place> {
    const response = await api.post("/places/CreatePlace", payload);
    return response.data.data ?? response.data;
}

export async function updatePlace(placeId: string, payload: UpdatePlaceRequest): Promise<Place> {
    const response = await api.put(`/places/${placeId}/UpdatePlace`, payload);
    return response.data.data ?? response.data;
}

export async function deletePlace(placeId: string): Promise<void> {
    await api.delete(`/places/${placeId}/DeletePlace`);
}

export async function getPlaceDetail(placeId: string): Promise<PlaceDetailAggregate> {
    const response = await api.get(`/places/${placeId}/PlaceDetail`);
    return response.data.data ?? response.data;
}