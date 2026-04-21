import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export function Skeleton({
    width = "100%",
    height = 14,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.base,
                { width: width as any, height: height as any, borderRadius, opacity },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: "#e2e8f0",
    },
});

interface SkeletonListProps {
    count?: number;
    children?: React.ReactNode;
    renderItem?: (index: number) => React.ReactNode;
    spacing?: number;
    style?: StyleProp<ViewStyle>;
}

export function SkeletonList({
    count = 3,
    renderItem,
    children,
    spacing = 16,
    style,
}: SkeletonListProps) {
    const items = Array.from({ length: count });
    return (
        <View style={style}>
            {items.map((_, index) => (
                <View
                    key={index}
                    style={{ marginBottom: index === count - 1 ? 0 : spacing }}
                >
                    {renderItem ? renderItem(index) : children}
                </View>
            ))}
        </View>
    );
}

export function SkeletonPlaceCard() {
    return (
        <View style={cardStyles.card}>
            <Skeleton
                width="100%"
                height={160}
                borderRadius={16}
                style={{ marginBottom: 14 }}
            />
            <Skeleton
                width="65%"
                height={18}
                borderRadius={6}
                style={{ marginBottom: 8 }}
            />
            <Skeleton
                width="40%"
                height={14}
                borderRadius={6}
                style={{ marginBottom: 14 }}
            />
            <View style={cardStyles.row}>
                <Skeleton width={64} height={28} borderRadius={14} />
                <Skeleton width={64} height={28} borderRadius={14} />
                <Skeleton width={64} height={28} borderRadius={14} />
            </View>
        </View>
    );
}

export function SkeletonGroupCard() {
    return (
        <View style={cardStyles.groupCard}>
            <Skeleton width={56} height={56} borderRadius={28} />
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Skeleton
                    width="55%"
                    height={16}
                    borderRadius={6}
                    style={{ marginBottom: 8 }}
                />
                <Skeleton width="35%" height={12} borderRadius={6} />
            </View>
        </View>
    );
}

export function SkeletonListItem() {
    return (
        <View style={cardStyles.listItem}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton
                    width="70%"
                    height={14}
                    borderRadius={6}
                    style={{ marginBottom: 8 }}
                />
                <Skeleton width="45%" height={12} borderRadius={6} />
            </View>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    groupCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
    },
});
