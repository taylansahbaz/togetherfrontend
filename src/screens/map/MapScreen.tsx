import { getApiErrorMessage } from "@/src/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { getMapPlaces } from "../../api/maps";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";

const { width, height } = Dimensions.get("window");

const INITIAL_REGION = {
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 10.0,
  longitudeDelta: 10.0,
};

export default function MapScreen({ navigation }: any) {
  const { selectedGroupId } = useSelectedGroup();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(false);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const loadMapData = async () => {
    if (!selectedGroupId) {
      setAllPlaces([]);
      return;
    }

    try {
      setLoading(true);
      const placesArray = await getMapPlaces(selectedGroupId);

      if (Array.isArray(placesArray)) {
        const validPlaces = placesArray.filter(
          (p: any) =>
            typeof p.latitude === "number" &&
            typeof p.longitude === "number"
        );

        setAllPlaces(validPlaces);
        setFilteredPlaces(validPlaces);
        setSelectedPlace(null);
        fitToPlaces(validPlaces);
      }
    } catch ( err: any) {
     if (err.response?.status === 403 || err.response?.status === 401) {
            setAllPlaces([]);
        } else {
            Alert.alert("Hata", getApiErrorMessage(err));
        }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMapData();
    }, [selectedGroupId])
  );

  useEffect(() => {
    let result = allPlaces;

    if (activeFilter === "Visited") {
      result = result.filter(
        (p) => p.status === 0 || p.status === "Visited"
      );
    } else if (activeFilter === "Wishlist") {
      result = result.filter(
        (p) => p.status === 1 || p.status === "Wishlist"
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.city && p.city.toLowerCase().includes(query))
      );
    }

    setFilteredPlaces(result);

    if (result.length > 0) {
      fitToPlaces(result);
    }
  }, [searchQuery, activeFilter, allPlaces]);

 const fitToPlaces = (placesToFit: any[]) => {
    if (!placesToFit.length || !mapRef.current || Platform.OS === "web") return;

    const coordinates = placesToFit.map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        500
      );
      return;
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 120,
        right: 50,
        bottom: 220,
        left: 50,
      },
      animated: true,
    });
  };

  const focusPlace = (place: any) => {
    setSelectedPlace(place);

    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      500
    );
  };

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.webContainer}>
        <Text style={styles.webTitle}>Map (Web Preview)</Text>
        <Text style={{ marginBottom: 20 }}>
          Haritayı tam özellikleriyle görmek için telefonda açın.
        </Text>
        <ScrollView>
          {filteredPlaces.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.webCard}
              onPress={() =>
                navigation.navigate("HomeTab", {
                  screen: "PlaceDetail",
                  params: { placeId: p.id },
                })
              }
            >
              <Text style={styles.webCardTitle}>{p.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          Keyboard.dismiss();
          setSelectedPlace(null);
        }}
      >
        {filteredPlaces.map((place, index) => {
          const isWishlist =
            place.status === 1 || place.status === "Wishlist";
          const isVisited =
            place.status === 2 || place.status === "Visited";

          let themeColor = "#8aa0b2";
          let statusText = "Other";
          if (isVisited) {
            themeColor = "#2F7E8D";
            statusText = "Visited";
          } else if (isWishlist) {
            themeColor = "#fcbebe";
            statusText = "Wishlist";
          }

          return (
            <Marker
              key={`${place.id}-${index}`}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => focusPlace(place)}
            >
              <View style={styles.pinContainer}>
                <View
                  style={[
                    styles.pinCircle,
                    {
                      backgroundColor:
                        place.status === 2 || place.status === "Visited"
                          ? "#2F7E8D"
                          : "#fcbebe",
                    },
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topOverlayContainer} pointerEvents="box-none">
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#64748b"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Mekan veya şehir ara..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#cbd5e1"
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {["All", "Visited", "Wishlist"].map((filterItem) => {
            const isActive = activeFilter === filterItem;
            let activeBg = "#102a43";
            if (filterItem === "Visited") activeBg = "#2F7E8D";
            if (filterItem === "Wishlist") activeBg = "#F59E0B";

            return (
              <TouchableOpacity
                key={filterItem}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveFilter(filterItem);
                  setSelectedPlace(null);
                }}
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: activeBg, borderColor: activeBg }
                    : {},
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? { color: "white" } : {},
                  ]}
                >
                  {filterItem === "All" ? "Tümü" : filterItem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {selectedPlace && (
        <View style={styles.bottomCardWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.bottomCard}
            onPress={() =>
              navigation.navigate("HomeTab", {
                screen: "PlaceDetail",
                params: { placeId: selectedPlace.id },
              })
            }
          >
            <View style={styles.bottomCardTopRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      selectedPlace.status === 2 ||
                      selectedPlace.status === "Visited"
                        ? "#2F7E8D"
                        : "#fcbebe",
                  },
                ]}
              />
              <Text style={styles.bottomCardStatus}>
                {selectedPlace.status === 2 ||
                selectedPlace.status === "Visited"
                  ? "Visited"
                  : "Wishlist"}
              </Text>
            </View>

            <Text style={styles.bottomCardTitle} numberOfLines={1}>
              {selectedPlace.title}
            </Text>

            <Text style={styles.bottomCardSubtitle} numberOfLines={1}>
              {selectedPlace.category || selectedPlace.city || "Location"}
            </Text>

            <View style={styles.bottomCardFooter}>
              <Text style={styles.bottomCardAction}>Detayları Gör</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#102a43"
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.fitButton,
          { bottom: selectedPlace ? 150 : 30 },
        ]}
        activeOpacity={0.8}
        onPress={() => fitToPlaces(filteredPlaces)}
      >
        <Ionicons name="scan" size={24} color="#102a43" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  map: { width, height },
  loadingOverlay: {
    position: "absolute",
    zIndex: 20,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  topOverlayContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#102a43",
  },
  filterScroll: { marginTop: 12, maxHeight: 40 },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },

  fitButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "white",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
pinContainer: {
  alignItems: "center",
  justifyContent: "center",
},

pinCircle: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 3,
  borderColor: "#ffffff",
},
  pinWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  classicPin: {
    width: 32,
    height: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  pinHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },

  bottomCardWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 15,
  },
  bottomCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  bottomCardStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bottomCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102a43",
    marginBottom: 4,
  },
  bottomCardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  bottomCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomCardAction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#102a43",
  },

  webContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102a43",
  },
  webCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  webCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
});