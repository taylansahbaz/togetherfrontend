import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { PlacePhoto } from "../../types/photo";

export default function PhotoGrid({ photos }: { photos: PlacePhoto[] }) {
    if (!photos.length) {
        return <Text style={{ color: "#64748b" }}>No photos yet.</Text>;
    }

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo) => (
                <View key={photo.id} style={{ marginRight: 10 }}>
                    <Image
                        source={{ uri: photo.imageUrl }}
                        style={{ width: 120, height: 120, borderRadius: 12 }}
                    />
                    {!!photo.caption && (
                        <Text style={{ width: 120, marginTop: 6 }} numberOfLines={2}>
                            {photo.caption}
                        </Text>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}