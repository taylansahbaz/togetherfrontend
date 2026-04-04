import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { PLACE_CATEGORIES } from "../../utils/constants";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryPicker({ value, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      {PLACE_CATEGORIES.map((item) => {
        const isSelected = value === item.value;

        return (
          <TouchableOpacity
            key={item.value}
            onPress={() => onChange(item.value)}
            activeOpacity={0.99}
            style={{
              width: "19%",
              height: 88,
              borderRadius: 18,
              backgroundColor:item.bgColor ,
              borderWidth: 1.4,
              borderColor: isSelected ? item.borderColor : "rgba(0,0,0,0.06)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
              paddingVertical: 8,
              marginBottom: 8,
              position: "relative",
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: item.iconBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Image
                source={item.image}
                resizeMode="contain"
                style={{
                  width: 30,
                  height: 30,
                }}
              />
            </View>

            <Text
              numberOfLines={2}
              style={{
                fontSize: 10,
                lineHeight: 12,
                textAlign: "center",
                fontWeight: isSelected ? "800" : "700",
                color: item.textColor,
              }}
            >
              {item.label}
            </Text>

            {isSelected && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: item.textColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>
                  ✓
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}