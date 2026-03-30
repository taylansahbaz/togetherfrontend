import React from "react";
import { Pressable, Text, View } from "react-native";
import { Group } from "../../types/group";
import { formatDate } from "../../utils/date";

interface Props {
    group: Group;
    isSelected?: boolean;
    onPress: () => void;
}

export default function GroupCard({
    group,
    isSelected = false,
    onPress,
}: Props) {
    return (
        <Pressable onPress={onPress}>
            <View
                style={{
                    borderWidth: 1,
                    borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                    backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                }}
            >
                <Text
                    style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#0f172a",
                    }}
                >
                    {group.name}
                </Text>

                <Text
                    style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "#64748b",
                    }}
                >
                    Created: {formatDate(group.createdAt)}
                </Text>

                {isSelected && (
                    <Text
                        style={{
                            marginTop: 10,
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#2563eb",
                        }}
                    >
                        Selected Group
                    </Text>
                )}
            </View>
        </Pressable>
    );
}