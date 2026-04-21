import { getMyGroups } from "@/src/api/groups";
import { getApiErrorMessage } from "@/src/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { getMapPlaces } from "../../api/maps";
import { getPlaceDetail } from "../../api/places";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { mapGroupIcon } from "../../components/group/GroupAvatar";
import { useAuth } from "../../hooks/useAuth";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Group } from "../../types/group";
import { getPlaceCategoryLabel } from "../../utils/placeCategories";

const { width, height } = Dimensions.get("window");

const INITIAL_REGION = {
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 10.0,
  longitudeDelta: 10.0,
};

const COLORS = {
  visited: "#2F7E8D",
  wishlist: "#F6B6C5",
  wishlistDark: "#E98CA5",
  textDark: "#102a43",
  textMuted: "#64748b",
  white: "#FFFFFF",
  softCard: "rgba(255,255,255,0.96)",
  softBorder: "#E6ECF2",
  softBg: "#F8FAFC",
  softBg2: "#EEF4F7",
};

type PlaceItem = {
  id: string | number;
  title?: string;
  city?: string;
  category?: string;
  City?: string;
  Category?: string;
  latitude: number;
  longitude: number;
  status?: number | string;
};

type PlaceExtra = {
  imageUrl?: string;
  reviewCount?: number;
};
type MarkerItemProps = {
  place: PlaceItem;
  isSelected: boolean;
  onPress: (place: PlaceItem, event?: any) => void;
};

const MarkerItem = memo(function MarkerItem({
  place,
  isSelected,
  onPress,
}: MarkerItemProps) {
  const isVisited = place.status === 2 || place.status === "Visited";
  const [tracksViewChanges, setTracksViewChanges] = useState(
    Platform.OS === "android"
  );

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
      }}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={(e) => {
        // Tıklamanın haritaya sekmesini engeller
        if (e && e.stopPropagation) e.stopPropagation(); 
        onPress(place);
      }}
    >
      <View style={styles.markerWrap}>
        <View
          style={[
            styles.markerBase,
            isVisited ? styles.visitedMarker : styles.wishlistMarker,
            isSelected ? styles.selectedMarker : null,
          ]}
        >
          <View
            style={[
              styles.markerInnerDot,
              isVisited ? styles.visitedInnerDot : styles.wishlistInnerDot,
            ]}
          />
        </View>
      </View>
    </Marker>
  );
});

export default function MapScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const {
    selectedGroup,
    selectedGroupId,
    setSelectedGroup,
    initializeSelectedGroup,
  } = useSelectedGroup();
  const mapRef = useRef<MapView>(null);
  const targetPlaceId = route.params?.targetPlaceId;
  const ignoreNextMapPressRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [allPlaces, setAllPlaces] = useState<PlaceItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Visited" | "Wishlist"
  >("All");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  const [selectedPlaceExtra, setSelectedPlaceExtra] = useState<{
    imageUrl?: string;
    reviewCount?: number;
    loading?: boolean;
  } | null>(null);

  // EKRAN YENİLEMEYİ (RE-RENDER) ÖNLEMEK İÇİN STATE YERİNE USEREF KULLANIYORUZ
  const placeExtraCacheRef = useRef<Record<string, PlaceExtra>>({});

  const fitToPlaces = useCallback((placesToFit: PlaceItem[]) => {
    if (!placesToFit.length || !mapRef.current || Platform.OS === "web") return;

    const coordinates = placesToFit
      .filter(
        (p) =>
          p.latitude != null &&
          p.longitude != null &&
          !Number.isNaN(Number(p.latitude)) &&
          !Number.isNaN(Number(p.longitude))
      )
      .map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));

    if (!coordinates.length) return;

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
        top: 140,
        right: 50,
        bottom: 240,
        left: 50,
      },
      animated: true,
    });
  }, []);

  const loadSelectedPlaceExtra = useCallback(
    async (placeId: string | number) => {
      const key = String(placeId);

      // Cache'den useRef ile okuma yapıyoruz (Ekran yenilenmiyor)
      if (placeExtraCacheRef.current[key]) {
        setSelectedPlaceExtra({
          ...placeExtraCacheRef.current[key],
          loading: false,
        });
        return;
      }

      try {
        setSelectedPlaceExtra({ loading: true });

        const detail = await getPlaceDetail(placeId.toString());

        const firstPhoto = detail?.photos?.[0]?.imageUrl ?? undefined;

        const reviewCount =
          detail?.reviews?.length ??
          detail?.reviewCount ??
          0;

        const extra: PlaceExtra = {
          imageUrl: firstPhoto,
          reviewCount,
        };

        // Yeni gelen fotoğrafı Ref içine kaydediyoruz
        placeExtraCacheRef.current[key] = extra;

        setSelectedPlaceExtra({
          ...extra,
          loading: false,
        });
      } catch {
        setSelectedPlaceExtra({
          imageUrl: undefined,
          reviewCount: 0,
          loading: false,
        });
      }
    },
    [] // Bağımlılıklar temizlendi, fonksiyon kendini boş yere yeniden oluşturmayacak
  );

  const focusPlace = useCallback(
    (place: PlaceItem) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      setSelectedPlace(place);
      setSelectedPlaceExtra({ loading: true });
      loadSelectedPlaceExtra(place.id);

      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          500
        );
      });
    },
    [loadSelectedPlaceExtra]
  );

  const handleMarkerPress = useCallback((place: PlaceItem) => {
    // Harita tıklamasını engellemek için kalkanı açıyoruz
    ignoreNextMapPressRef.current = true;
    focusPlace(place);

    // Yarım saniye boyunca haritaya gelen boş tıklamaları yok sayacağız
    setTimeout(() => {
      ignoreNextMapPressRef.current = false;
    }, 500);
  }, [focusPlace]);

  const loadMapData = useCallback(async () => {
    if (!selectedGroupId) {
      setAllPlaces([]);
      setSelectedPlace(null);
      setSelectedPlaceExtra(null);
      return;
    }

    try {
      setLoading(true);

      const placesArray = await getMapPlaces(selectedGroupId);
      if (Array.isArray(placesArray)) {
        const validPlaces = placesArray.filter(
          (p: any) =>
            p.latitude != null &&
            p.longitude != null &&
            !Number.isNaN(Number(p.latitude)) &&
            !Number.isNaN(Number(p.longitude))
        );

        setAllPlaces(validPlaces);

        if (targetPlaceId) {
          const placeToFocus = validPlaces.find(
            (p: any) => String(p.id) === String(targetPlaceId)
          );

          if (placeToFocus) {
            setTimeout(() => {
              focusPlace(placeToFocus);
            }, 250);

            navigation.setParams({ targetPlaceId: undefined });
            return;
          }
        }

        setSelectedPlace(null);
        setSelectedPlaceExtra(null);
      } else {
        setAllPlaces([]);
        setSelectedPlace(null);
        setSelectedPlaceExtra(null);
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setAllPlaces([]);
        setSelectedPlace(null);
        setSelectedPlaceExtra(null);
      } else {
        Alert.alert("Hata", getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, targetPlaceId, navigation, focusPlace]);

  useFocusEffect(
    useCallback(() => {
      loadMapData();
    }, [loadMapData])
  );

  // Initialize groups when user changes (after login)
  useEffect(() => {
    const initializeGroups = async () => {
      if (!user?.id) return;

      try {
        const response = await getMyGroups();
        const { groups, lastSelectedGroupId: backendLastSelectedGroupId } = response.data;

        setAvailableGroups(groups ?? []);

        // Use user's lastSelectedGroupId from auth, fallback to backend value
        const groupIdToSelect = user.lastSelectedGroupId ?? backendLastSelectedGroupId;
        await initializeSelectedGroup(groups, groupIdToSelect);
      } catch (error) {
        console.log("Failed to initialize groups:", error);
      }
    };

    initializeGroups();
  }, [user?.id]);

  const filteredPlaces = useMemo(() => {
    let result = [...allPlaces];

    if (activeFilter === "Visited") {
      result = result.filter((p) => p.status === 2 || p.status === "Visited");
    } else if (activeFilter === "Wishlist") {
      result = result.filter((p) => p.status === 1 || p.status === "Wishlist");
    }

    if (categoryFilter) {
      const wanted = categoryFilter.toLowerCase().trim();
      result = result.filter(
        (p) => (p.category ?? "").toLowerCase().trim() === wanted
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();

      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.city && p.city.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    return result;
  }, [allPlaces, activeFilter, categoryFilter, searchQuery]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allPlaces.forEach((p) => {
      const c = (p.category ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) =>
      getPlaceCategoryLabel(a).localeCompare(getPlaceCategoryLabel(b), "tr")
    );
  }, [allPlaces]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (activeFilter !== "All") n += 1;
    if (categoryFilter) n += 1;
    return n;
  }, [activeFilter, categoryFilter]);

  const handlePickGroup = useCallback(
    async (group: Group) => {
      try {
        await setSelectedGroup(group);
      } catch (err) {
        console.log("Failed to set selected group:", err);
      }
      setSelectedPlace(null);
      setSelectedPlaceExtra(null);
    },
    [setSelectedGroup]
  );

  const clearAllFilters = useCallback(() => {
    setActiveFilter("All");
    setCategoryFilter(null);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (selectedPlace) return;
    if (targetPlaceId) return;
    if (!filteredPlaces.length) return;

    const timer = setTimeout(() => {
      fitToPlaces(filteredPlaces);
    }, 150);

    return () => clearTimeout(timer);
  }, [filteredPlaces, selectedPlace, targetPlaceId, loading, fitToPlaces]);

  const openDirections = async (place: PlaceItem) => {
    const lat = Number(place?.latitude);
    const lng = Number(place?.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert("Hata", "Bu mekan için geçerli konum bulunamadı.");
      return;
    }

    try {
      if (Platform.OS === "ios") {
        const options: { label: string; url: string }[] = [];

        const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
        const googleMapsUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
        const wazeUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
        const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        if (await Linking.canOpenURL(appleMapsUrl)) {
          options.push({ label: "Apple Maps", url: appleMapsUrl });
        }

        if (await Linking.canOpenURL(googleMapsUrl)) {
          options.push({ label: "Google Maps", url: googleMapsUrl });
        }

        if (await Linking.canOpenURL(wazeUrl)) {
          options.push({ label: "Waze", url: wazeUrl });
        }

        if (await Linking.canOpenURL(googleMapsWebUrl)) {
          options.push({ label: "Google Maps (Web)", url: googleMapsWebUrl });
        }

        if (!options.length) {
          Alert.alert("Hata", "Kullanılabilir harita uygulaması bulunamadı.");
          return;
        }

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [...options.map((x) => x.label), "İptal"],
            cancelButtonIndex: options.length,
            title: "Yol tarifi için uygulama seç",
          },
          async (selectedIndex) => {
            if (selectedIndex === options.length) return;

            const selected = options[selectedIndex];
            if (!selected) return;

            try {
              await Linking.openURL(selected.url);
            } catch (error) {
              console.log("selected map open error:", error);
              Alert.alert("Hata", "Seçilen harita uygulaması açılamadı.");
            }
          }
        );

        return;
      }

      const googleNavigationUrl = `google.navigation:q=${lat},${lng}`;
      const googleWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      if (await Linking.canOpenURL(googleNavigationUrl)) {
        await Linking.openURL(googleNavigationUrl);
        return;
      }

      if (await Linking.canOpenURL(googleWebUrl)) {
        await Linking.openURL(googleWebUrl);
        return;
      }

      Alert.alert("Hata", "Harita uygulaması açılamadı.");
    } catch (error) {
      console.log("openDirections error:", error);
      Alert.alert("Hata", "Harita uygulaması açılamadı.");
    }
  };

  const openPlaceDetail = useCallback(() => {
    if (!selectedPlace) return;

    navigation.navigate("HomeTab", {
      screen: "PlaceDetail",
      params: { placeId: selectedPlace.id },
    });
  }, [navigation, selectedPlace]);

  const getStatusLabel = (place: PlaceItem) => {
    return place.status === 2 || place.status === "Visited"
      ? "Ziyaret Edildi"
      : "İstek Listesi";
  };

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.webContainer}>
        <Text style={styles.webTitle}>Harita</Text>
        <Text style={styles.webSubtitle}>
          Haritayı tam özellikleriyle görmek için mobil cihazda aç.
        </Text>

        <ScrollView>
          {filteredPlaces.map((p) => (
            <TouchableOpacity
              key={String(p.id)}
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
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={(e) => {
          // 1. Koruma: Native event marker-press ise iptal et
          if (e.nativeEvent.action === 'marker-press') return;
          
          // 2. Koruma: Bizim zamanlayıcılı kalkanımız devredeyse iptal et
          if (ignoreNextMapPressRef.current) return;
          
          Keyboard.dismiss();
          setSelectedPlace(null);
          setSelectedPlaceExtra(null);
        }}
      >
        {filteredPlaces.map((place) => (
          <MarkerItem
            key={String(place.id)}
            place={place}
            isSelected={selectedPlace?.id === place.id}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlayContainer} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { flex: 1, marginHorizontal: 0 }]}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.textMuted}
              style={{ marginRight: 8 }}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Mekan, kategori veya şehir ara..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={COLORS.textDark}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {selectedPlace && (
        <View style={styles.bottomCardWrapper}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHeaderRow}>
              <View style={styles.bottomCardMainInfo}>
                <View style={styles.bottomCardTopRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          selectedPlace.status === 2 ||
                          selectedPlace.status === "Visited"
                            ? COLORS.visited
                            : COLORS.wishlistDark,
                      },
                    ]}
                  />
                  <Text style={styles.bottomCardStatus}>
                    {getStatusLabel(selectedPlace)}
                  </Text>
                </View>
                
                <Text style={styles.bottomCardTitle} numberOfLines={1}>
                  {selectedPlace.title || "Mekan"}
                </Text>

                <Text style={styles.bottomCardSubtitle} numberOfLines={1}>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.photosReviewsButton}
                activeOpacity={0.85}
                onPress={openPlaceDetail}
              >
                {selectedPlaceExtra?.imageUrl ? (
                  <Image
                    source={{ uri: selectedPlaceExtra.imageUrl }}
                    style={styles.photosReviewsImage}
                  />
                ) : (
                  <View style={styles.photosReviewsPlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={17}
                      color={COLORS.textDark}
                    />
                  </View>
                )}

                <View style={styles.photosReviewsTextWrap}>
                  <Text style={styles.photosReviewsTitle}>Fotolar</Text>
                  <Text style={styles.photosReviewsSubtitle}>
                    {selectedPlaceExtra?.loading
                      ? "Yükleniyor..."
                      : `${selectedPlaceExtra?.reviewCount ?? 0} yorum`}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomCardFooter}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => openDirections(selectedPlace)}
                activeOpacity={0.88}
              >
                <Ionicons name="navigate" size={16} color="#ffffff" />
                <Text style={styles.directionsButtonText}>Yol Tarifi Al</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailButton}
                onPress={openPlaceDetail}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomCardAction}>Detayları Gör</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={COLORS.textDark}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fitButton, { bottom: selectedPlace ? 156 : 30 }]}
        activeOpacity={0.85}
        onPress={() => fitToPlaces(filteredPlaces)}
      >
        <Ionicons name="scan" size={23} color={COLORS.textDark} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="slide"
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable onPress={() => {}} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrele</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={clearAllFilters}
                    style={styles.clearFiltersButton}
                  >
                    <Text style={styles.clearFiltersText}>Temizle</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setFilterModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={18} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ maxHeight: height * 0.65 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.filterSectionTitle}>Durum</Text>
              <View style={styles.filterChipRow}>
                {(["All", "Visited", "Wishlist"] as const).map((filterItem) => {
                  const isActive = activeFilter === filterItem;
                  let activeBg = COLORS.textDark;
                  if (filterItem === "Visited") activeBg = COLORS.visited;
                  if (filterItem === "Wishlist") activeBg = COLORS.wishlistDark;

                  return (
                    <TouchableOpacity
                      key={filterItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        setActiveFilter(filterItem);
                        setSelectedPlace(null);
                        setSelectedPlaceExtra(null);
                      }}
                      style={[
                        styles.filterChip,
                        isActive
                          ? { backgroundColor: activeBg, borderColor: activeBg }
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive ? { color: "white" } : null,
                        ]}
                      >
                        {filterItem === "All"
                          ? "Tümü"
                          : filterItem === "Visited"
                          ? "Ziyaret Edilenler"
                          : "İstek Listesi"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterSectionTitle}>Kategori</Text>
              {availableCategories.length === 0 ? (
                <Text style={styles.filterEmptyText}>
                  Bu grupta henüz kategori yok.
                </Text>
              ) : (
                <View style={styles.filterChipRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setCategoryFilter(null)}
                    style={[
                      styles.filterChip,
                      categoryFilter === null
                        ? {
                            backgroundColor: COLORS.textDark,
                            borderColor: COLORS.textDark,
                          }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        categoryFilter === null ? { color: "white" } : null,
                      ]}
                    >
                      Tümü
                    </Text>
                  </TouchableOpacity>

                  {availableCategories.map((cat) => {
                    const isActive = categoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        activeOpacity={0.85}
                        onPress={() => {
                          setCategoryFilter(cat);
                          setSelectedPlace(null);
                          setSelectedPlaceExtra(null);
                        }}
                        style={[
                          styles.filterChip,
                          isActive
                            ? {
                                backgroundColor: COLORS.textDark,
                                borderColor: COLORS.textDark,
                              }
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive ? { color: "white" } : null,
                          ]}
                        >
                          {getPlaceCategoryLabel(cat)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.filterSectionTitle}>Grup</Text>
              {availableGroups.length === 0 ? (
                <Text style={styles.filterEmptyText}>
                  Henüz hiç grubun yok.
                </Text>
              ) : (
                <FlatList
                  data={availableGroups}
                  keyExtractor={(g) => g.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const isActive = item.id === selectedGroupId;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handlePickGroup(item)}
                        style={[
                          styles.groupRow,
                          isActive ? styles.groupRowActive : null,
                        ]}
                      >
                        <View
                          style={[
                            styles.groupAvatar,
                            {
                              backgroundColor:
                                (item as any).colorCode || COLORS.textDark,
                            },
                          ]}
                        >
                          <Ionicons
                            name={mapGroupIcon(item.selectedIconsJson)}
                            size={17}
                            color="#fff"
                          />
                        </View>
                        <Text style={styles.groupName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {isActive && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={COLORS.visited}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.9}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>
                {filteredPlaces.length} sonucu göster
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.softBg,
  },

  map: {
    width,
    height,
  },

  loadingOverlay: {
    position: "absolute",
    zIndex: 20,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.58)",
    justifyContent: "center",
    alignItems: "center",
  },

  markerWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  markerBase: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },

  markerInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },

  visitedMarker: {
    backgroundColor: COLORS.visited,
    borderColor: "#ffffff",
  },

  wishlistMarker: {
    backgroundColor: COLORS.wishlist,
    borderColor: "#ffffff",
  },

  selectedMarker: {
    transform: [{ scale: 1.34 }],
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 6,
  },

  visitedInnerDot: {
    opacity: 1,
  },

  wishlistInnerDot: {
    opacity: 0.95,
  },

  topOverlayContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 28,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    gap: 10,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    marginHorizontal: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 7,
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.96)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 7,
  },

  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.wishlistDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 10,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  clearFiltersButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },

  clearFiltersText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 10,
  },

  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginBottom: 6,
  },

  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },

  groupRowActive: {
    backgroundColor: "#EEF4F7",
    borderColor: COLORS.visited,
  },

  groupAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  groupName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  applyButton: {
    marginTop: 14,
    backgroundColor: COLORS.textDark,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textDark,
  },

  clearSearchButton: {
    padding: 4,
  },

  filterScroll: {
    marginTop: 12,
    maxHeight: 44,
  },

  filterScrollContent: {
    paddingHorizontal: 18,
  },

  filterChip: {
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    marginRight: 2,
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
    color: COLORS.textMuted,
  },

  fitButton: {
    position: "absolute",
    right: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },

  bottomCardWrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
    zIndex: 15,
  },

  bottomCard: {
    backgroundColor: COLORS.softCard,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 9,
  },

  bottomCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },

  bottomCardMainInfo: {
    flex: 1,
    paddingRight: 4,
  },

  bottomCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  bottomCardStatus: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  bottomCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
    maxWidth: width * 0.46,
  },

  bottomCardSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  photosReviewsButton: {
    minWidth: 138,
    maxWidth: 154,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softBg,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  photosReviewsImage: {
    width: 40,
    height: 40,
    borderRadius: 11,
    marginRight: 8,
  },

  photosReviewsPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: COLORS.softBg2,
    justifyContent: "center",
    alignItems: "center",
  },

  photosReviewsTextWrap: {
    flex: 1,
  },

  photosReviewsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  photosReviewsSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  bottomCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.visited,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
    shadowColor: COLORS.visited,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  directionsButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  bottomCardAction: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  webContainer: {
    flex: 1,
    backgroundColor: COLORS.softBg,
    padding: 20,
  },

  webTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 6,
  },

  webSubtitle: {
    marginBottom: 20,
    color: COLORS.textMuted,
    fontSize: 14,
  },

  webCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  webCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
});