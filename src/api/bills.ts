import { Bill, MyBillsResponse, UpsertBillRequest } from "../types/bill";
import { api } from "./client";

function unwrap<T>(response: any): T {
    return (response.data?.data ?? response.data) as T;
}

export async function getPlaceBill(placeId: string): Promise<Bill | null> {
    try {
        const response = await api.get(`/bills/place/${placeId}`);
        return unwrap<Bill>(response);
    } catch (err: any) {
        if (err?.response?.status === 404) {
            return null;
        }
        throw err;
    }
}

export async function upsertPlaceBill(
    placeId: string,
    body: UpsertBillRequest
): Promise<Bill> {
    const response = await api.put(`/bills/place/${placeId}`, body);
    return unwrap<Bill>(response);
}

export async function deletePlaceBill(placeId: string): Promise<void> {
    await api.delete(`/bills/place/${placeId}`);
}

export async function getMyBills(): Promise<MyBillsResponse> {
    const response = await api.get(`/bills/my`);
    return unwrap<MyBillsResponse>(response);
}
