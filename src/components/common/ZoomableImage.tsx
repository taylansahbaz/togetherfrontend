import React, { useImperativeHandle, forwardRef } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export type ZoomableImageHandle = {
    reset: () => void;
};

type Props = {
    uri: string;
    width: number;
    height: number;
    containerStyle?: ViewStyle;
    onZoomStateChange?: (zoomed: boolean) => void;
    maxScale?: number;
    minScale?: number;
    doubleTapScale?: number;
};

const ZoomableImage = forwardRef<ZoomableImageHandle, Props>(function ZoomableImage(
    {
        uri,
        width,
        height,
        containerStyle,
        onZoomStateChange,
        maxScale = 4,
        minScale = 1,
        doubleTapScale = 2.2,
    },
    ref
) {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const isZoomed = useSharedValue(false);

    const notifyZoom = (zoomed: boolean) => {
        if (onZoomStateChange) onZoomStateChange(zoomed);
    };

    const resetZoom = () => {
        "worklet";
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        if (isZoomed.value) {
            isZoomed.value = false;
            runOnJS(notifyZoom)(false);
        }
    };

    useImperativeHandle(ref, () => ({
        reset: () => {
            scale.value = withTiming(1);
            savedScale.value = 1;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
            if (isZoomed.value) {
                isZoomed.value = false;
                notifyZoom(false);
            }
        },
    }));

    const clampTranslation = (nextX: number, nextY: number, nextScale: number) => {
        "worklet";
        const maxX = Math.max(0, (width * nextScale - width) / 2);
        const maxY = Math.max(0, (height * nextScale - height) / 2);
        return {
            x: Math.min(maxX, Math.max(-maxX, nextX)),
            y: Math.min(maxY, Math.max(-maxY, nextY)),
        };
    };

    const pinch = Gesture.Pinch()
        .onStart(() => {
            if (!isZoomed.value) {
                isZoomed.value = true;
                runOnJS(notifyZoom)(true);
            }
        })
        .onUpdate((e) => {
            const next = Math.min(
                maxScale,
                Math.max(minScale * 0.9, savedScale.value * e.scale)
            );
            scale.value = next;
        })
        .onEnd(() => {
            if (scale.value < 1.05) {
                resetZoom();
            } else {
                savedScale.value = scale.value;
                const clamped = clampTranslation(
                    translateX.value,
                    translateY.value,
                    scale.value
                );
                translateX.value = withTiming(clamped.x);
                translateY.value = withTiming(clamped.y);
                savedTranslateX.value = clamped.x;
                savedTranslateY.value = clamped.y;
            }
        });

    const pan = Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        .onUpdate((e) => {
            if (scale.value > 1.01) {
                const clamped = clampTranslation(
                    savedTranslateX.value + e.translationX,
                    savedTranslateY.value + e.translationY,
                    scale.value
                );
                translateX.value = clamped.x;
                translateY.value = clamped.y;
            }
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd(() => {
            if (scale.value > 1.05) {
                resetZoom();
            } else {
                scale.value = withTiming(doubleTapScale);
                savedScale.value = doubleTapScale;
                isZoomed.value = true;
                runOnJS(notifyZoom)(true);
            }
        });

    const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={composed}>
            <Animated.View
                style={[
                    styles.container,
                    { width, height },
                    containerStyle,
                ]}
            >
                <Animated.Image
                    source={{ uri }}
                    style={[
                        { width, height, resizeMode: "contain" },
                        animatedStyle,
                    ]}
                />
            </Animated.View>
        </GestureDetector>
    );
});

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
});

export default ZoomableImage;
