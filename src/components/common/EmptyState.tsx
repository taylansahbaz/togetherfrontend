import React from "react";
import { Text, View } from "react-native";

export default function EmptyState({ title }: { title: string }) {
    return (
        <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#64748b" }}>{title}</Text>
        </View>
    );
}