import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getMapPlaces } from "../../api/maps";
import { MapPlace } from "../../types/place";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { getApiErrorMessage } from "../../utils/helpers";

export default function MapScreenWeb() {
  const navigation = useNavigation<any>();
  const { selectedGroupId } = useSelectedGroup();
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!selectedGroupId) return;

    try {
      setLoading(true);
      const data = await getMapPlaces(selectedGroupId);
      setPlaces(data);
    } catch (err) {
      Alert.alert("Map Error", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [selectedGroupId])
  );

  if (!selectedGroupId) {
    return <EmptyState title="Select a group first from Groups tab." />;
  }

  if (loading) return <LoadingSpinner />;
  if (!places.length) return <EmptyState title="No map places found." />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
        Map
      </Text>

      <Text style={{ color: "#64748b", marginBottom: 16 }}>
        Web preview içinde native harita gösterilmiyor. Aþaðýda koordinat listesi gösteriliyor.
      </Text>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("HomeTab", {
                screen: "PlaceDetail",
                params: { placeId: item.id },
              })
            }
            style={{
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.title}</Text>
            <Text style={{ marginTop: 6, color: "#475569" }}>
              Status: {item.status}
            </Text>
            <Text style={{ marginTop: 4, color: "#475569" }}>
              Lat: {item.latitude}
            </Text>
            <Text style={{ marginTop: 2, color: "#475569" }}>
              Lng: {item.longitude}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}