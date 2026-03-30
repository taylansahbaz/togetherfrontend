import React from "react";
import { Text, View } from "react-native";
import { PlaceStatus } from "../../types/place";

export default function StatusBadge({ status }: { status: PlaceStatus }) {
    const isVisited = status === "Visited";

    return (
        <View
            style={{
                alignSelf: "flex-start",
                backgroundColor: isVisited ? "#dbeafe" : "#fce7f3",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
            }}
        >
            <Text style={{ color: isVisited ? "#1d4ed8" : "#be185d", fontWeight: "600" }}>
                {status}
            </Text>
        </View>
    );
}