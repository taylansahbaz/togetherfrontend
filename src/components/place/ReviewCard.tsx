import React from "react";
import { Text, View } from "react-native";
import { Review } from "../../types/review";
import { formatDate } from "../../utils/date";

export default function ReviewCard({ review }: { review: Review }) {
    return (
        <View
            style={{
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
            }}
        >
            <Text style={{ fontWeight: "700" }}>{review.userName}</Text>
            <Text style={{ marginTop: 4 }}>Rating: {review.rating}/10</Text>
            <Text style={{ marginTop: 4 }}>
                Would Go Again: {review.wouldGoAgain ? "Yes" : "No"}
            </Text>
            {!!review.comment && <Text style={{ marginTop: 8 }}>{review.comment}</Text>}
            <Text style={{ marginTop: 8, color: "#64748b" }}>
                {formatDate(review.updatedAt ?? review.createdAt)}
            </Text>
        </View>
    );
}