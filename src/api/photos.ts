import { api } from "./client";
import { PlacePhoto } from "../types/photo";

export async function getPlacePhotos(placeId: string): Promise<PlacePhoto[]> {
    const response = await api.get(`/placephotos/place/${placeId}`);
    return response.data.data ?? response.data;
}

export async function uploadPlacePhoto(
    placeId: string,
    uri: string,
    caption?: string
): Promise<PlacePhoto> {
    const formData = new FormData();

    formData.append("placeId", placeId);

    if (caption?.trim()) {
        formData.append("caption", caption.trim());
    }

    formData.append("file", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
    } as any);

    const response = await api.post("/placephotos/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.data ?? response.data;
}

export async function deletePlacePhoto(photoId: string): Promise<void> {
    await api.delete(`/placephotos/${photoId}/delete`);
}