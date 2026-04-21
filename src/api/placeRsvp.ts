import {
  WishDayRsvpMember,
  WishDayRsvpResponse,
  WishDayRsvpSummary,
} from "../types/place";
import { api } from "./client";

const RESPONSE_NUMERIC_MAP: Record<number, WishDayRsvpResponse> = {
  0: "NotResponded",
  1: "Accepted",
  2: "Maybe",
  3: "Rejected",
};

const normalizeResponse = (value: unknown): WishDayRsvpResponse => {
  if (typeof value === "number") {
    return RESPONSE_NUMERIC_MAP[value] ?? "NotResponded";
  }
  if (typeof value === "string") {
    if (
      value === "Accepted" ||
      value === "Maybe" ||
      value === "Rejected" ||
      value === "NotResponded"
    ) {
      return value;
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && RESPONSE_NUMERIC_MAP[numeric]) {
      return RESPONSE_NUMERIC_MAP[numeric];
    }
  }
  return "NotResponded";
};

const normalizeSummary = (raw: any): WishDayRsvpSummary => ({
  placeId: raw.placeId,
  acceptedCount: raw.acceptedCount ?? 0,
  maybeCount: raw.maybeCount ?? 0,
  rejectedCount: raw.rejectedCount ?? 0,
  notRespondedCount: raw.notRespondedCount ?? 0,
  totalMembers: raw.totalMembers ?? 0,
  currentUserResponse: normalizeResponse(raw.currentUserResponse),
  members: Array.isArray(raw.members)
    ? raw.members.map(
        (m: any): WishDayRsvpMember => ({
          userId: m.userId,
          userName: m.userName ?? "",
          response: normalizeResponse(m.response),
          respondedAt: m.respondedAt ?? null,
        })
      )
    : [],
});

const RESPONSE_TO_NUMERIC: Record<
  Exclude<WishDayRsvpResponse, "NotResponded">,
  number
> = {
  Accepted: 1,
  Maybe: 2,
  Rejected: 3,
};

export async function getWishDayRsvps(
  placeId: string
): Promise<WishDayRsvpSummary> {
  const response = await api.get(`/places/${placeId}/rsvps`);
  const raw = response.data?.data ?? response.data;
  return normalizeSummary(raw);
}

export async function respondToWishDay(
  placeId: string,
  responseValue: Exclude<WishDayRsvpResponse, "NotResponded">
): Promise<WishDayRsvpSummary> {
  const response = await api.post(`/places/${placeId}/rsvp`, {
    response: RESPONSE_TO_NUMERIC[responseValue],
  });
  const raw = response.data?.data ?? response.data;
  return normalizeSummary(raw);
}
