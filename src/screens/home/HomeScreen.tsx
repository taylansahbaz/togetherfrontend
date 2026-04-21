import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getMyGroups } from "../../api/groups";
import { getPlacesByGroup } from "../../api/places";
import AppButton from "../../components/common/AppButton";
import {
  SkeletonList,
  SkeletonPlaceCard,
} from "../../components/common/Skeleton";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Group } from "../../types/group";
import { Place } from "../../types/place";
import { formatDate } from "../../utils/date";
import { getApiErrorMessage } from "../../utils/helpers";
import {
  getPlaceCategoryImage,
  getPlaceCategoryItem,
} from "../../utils/placeCategories";

const COLORS = {
  background: "#F0F4F8",
  overlay: "rgba(240, 244, 248, 0.95)",
  surface: "#FCFBFA",
  surfaceSoft: "#F3F6F8",
  border: "#E1E7ED",

  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",

  primary: "#6D97A4",
  primaryDark: "#557C88",
  primarySoft: "#EAF2F5",

  secondarySoft: "#EDF2F7",

  hero: "#5F8B99",
  heroDark: "#4A707C",

  ratingIcon: "#F59E0B",

  iconMapBg: "#e3f1ff",
  iconMap: "#1E90FF",

  iconChatBg: "#ECFDF5",
  iconChat: "#10B981",

  iconPhotoBg: "#EEF2FF",
  iconPhoto: "#6366F1",

  statVisitedBg: "#F0FDF4",
  statVisitedText: "#059669",

  statWishlistBg: "#FFDDDD",
  statWishlistText: "#FB9494",

  statAllBg: "#F1F5F9",
  statAllText: "#475569",

  danger: "#EF4444",
  white: "#FFFFFF",
};

const FALLBACK_CATEGORY = {
  label: "Diğer",
  value: "other",
  bgColor: "rgba(241, 244, 248, 0.4)",
  borderColor: "#D7DFE8",
  textColor: "#667A91",
  iconBg: "#E5EBF2",
  image: undefined,
};

const PlaceCard = ({
  place,
  category,
  onPress,
  onMapPress,
  onReviewPress,
  onPhotoPress,
  nested = false,
}: {
  place: Place;
  category: string;
  onPress: () => void;
  onMapPress: () => void;
  onReviewPress: () => void;
  onPhotoPress: () => void;
  nested?: boolean;
}) => {
  const rating =
    typeof place.rating === "number" && place.rating > 0
      ? place.rating.toFixed(1)
      : null;
  const categoryItem = getPlaceCategoryItem(category) || {
    ...FALLBACK_CATEGORY,
    label: category || "Diğer",
  };

  const coverUrl = place.coverPhotoUrl;
  const hasCover = !!coverUrl;
  const photoCount = place.photoCount ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: categoryItem.bgColor,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: nested ? "#EEF2F7" : categoryItem.borderColor,
        marginBottom: nested ? 10 : 12,
        padding: 10,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: nested ? 0.04 : 0.07,
        shadowRadius: nested ? 6 : 9,
        elevation: nested ? 2 : 3,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* SOL: Kapak fotoğrafı - sabit kare */}
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 14,
            backgroundColor: categoryItem.iconBg,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            overflow: "hidden",
          }}
        >
          {hasCover ? (
            <Image
              source={{ uri: coverUrl! }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          ) : getPlaceCategoryImage(category) ? (
            <Image
              source={getPlaceCategoryImage(category)}
              style={{ width: 36, height: 36, resizeMode: "contain", opacity: 0.85 }}
            />
          ) : (
            <Ionicons
              name="location-outline"
              size={32}
              color={categoryItem.textColor}
            />
          )}

          {hasCover && photoCount > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images" size={9} color="#ffffff" />
              <Text style={styles.photoCountText}>{photoCount}</Text>
            </View>
          )}
        </View>

        {/* SAG: İsim + chipler + aksiyonlar */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "800",
                color: COLORS.text,
                marginRight: 8,
                textAlign: "center",
              }}
            >
              {place.title}
            </Text>

           
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 7,
              marginBottom: 8,
            }}
          >
            {place.visitDate && (
              <View style={styles.metaChip}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={COLORS.textMuted}
                />
                <Text style={styles.metaChipText}>
                  {formatDate(place.visitDate)}
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Pressable onPress={onMapPress} style={styles.actionBtnCompact}>
              <Ionicons name="map" size={16} color={COLORS.iconMap} />
            </Pressable>

            <Pressable
              onPress={onReviewPress}
              style={[
                styles.actionBtnCompact,
                { backgroundColor: COLORS.iconChatBg },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={16}
                color={COLORS.iconChat}
              />
            </Pressable>

            <Pressable
              onPress={onPhotoPress}
              style={[
                styles.actionBtnCompact,
                { backgroundColor: COLORS.iconPhotoBg },
              ]}
            >
              <Ionicons name="image" size={16} color={COLORS.iconPhoto} />
            </Pressable>
            {rating && (
              <View style={styles.inlineRatingBadge}>
                <Ionicons name="star" size={15} color={COLORS.ratingIcon} />
                <Text style={styles.inlineRatingText}>{rating}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { selectedGroupId, selectedGroup, setSelectedGroup, initializeSelectedGroup } = useSelectedGroup();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const load = async () => {
    if (!selectedGroupId) {
      setPlaces([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getPlacesByGroup(selectedGroupId);
      const visitedOnly = (data || []).filter(
        (p: Place) => p.status === "Visited" || p.status === 2
      );
      setPlaces(visitedOnly);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setPlaces([]);
      } else {
        showAlert({
          title: "Hata",
          message: getApiErrorMessage(err),
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [selectedGroupId])
  );

  // Initialize groups when user changes (after login)
  useEffect(() => {
    const initializeGroups = async () => {
      if (!user?.id) return;

      try {
        const response = await getMyGroups();
        const { groups: fetchedGroups, lastSelectedGroupId: backendLastSelectedGroupId } = response.data;
        setGroups(fetchedGroups);
        
        // Use user's lastSelectedGroupId from auth, fallback to backend value
        const groupIdToSelect = user.lastSelectedGroupId ?? backendLastSelectedGroupId;
        await initializeSelectedGroup(fetchedGroups, groupIdToSelect);      } catch (error) {
        console.log("Failed to initialize groups:", error);
      }
    };

    initializeGroups();
  }, [user?.id]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    places.forEach((p) => {
      if (p.city) cities.add(p.city);
    });
    return Array.from(cities).sort();
  }, [places]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch = place.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const cat = place.category || "Other";
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(cat);

      const matchesCity =
        selectedCities.length === 0 ||
        (place.city && selectedCities.includes(place.city));

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [places, searchQuery, selectedCategories, selectedCities]);

  const groupedPlaces = useMemo(() => {
    const groups: { [key: string]: Place[] } = {};

    filteredPlaces.forEach((place) => {
      const cat = place.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(place);
    });

    return groups;
  }, [filteredPlaces]);

  const allCategoriesInPlaces = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => cats.add(p.category || "Other"));
    return Array.from(cats);
  }, [places]);

  const displayedCategories = useMemo(
    () => Object.keys(groupedPlaces).sort(),
    [groupedPlaces]
  );

  const toggleFilterCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleExpand = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedCities([]);
    setIsFilterModalVisible(false);
  };

  const getActiveFilterCount = () => {
    return selectedCategories.length + selectedCities.length;
  };

  if (!selectedGroupId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 28,
          }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: COLORS.primarySoft,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <Ionicons name="albums-outline" size={42} color={COLORS.primaryDark} />
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: COLORS.text,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            Hoş Geldin{"\n"}
            {user?.name?.split(" ")[0]}
          </Text>

          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: COLORS.textMuted,
              textAlign: "center",
              marginBottom: 34,
            }}
          >
            Henüz seçili bir grubun yok. Ortak anıları kaydetmek için bir grup seç.
          </Text>

          <View style={{ width: "100%", maxWidth: 320 }}>
            <AppButton
              title="Gruplara Git"
              onPress={() =>
                navigation.navigate("ProfileTab", { screen: "Groups" })
              }
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ImageBackground
        source={require("../../../assets/images/home-bg.png")}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.overlay }}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 150 }}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 10, marginTop: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "900",
                      color: COLORS.text,
                      flexShrink: 1,
                    }}
                  >
                    Anıların
                  </Text>

                  <Pressable
                    onPress={() => setIsGroupModalVisible(true)}
                    style={({ pressed }) => {
                      const accent = selectedGroup?.colorCode || COLORS.primary;
                      return {
                        backgroundColor: pressed ? `${accent}25` : `${accent}12`,
                        paddingLeft: 5,
                        paddingRight: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: accent,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        shadowColor: accent,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.22,
                        shadowRadius: 6,
                        elevation: 3,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      };
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor:
                          selectedGroup?.colorCode || COLORS.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={selectedGroup?.selectedIconsJson as any || "people"} size={12} color="#FFFFFF" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: "800",
                        color: selectedGroup?.colorCode || COLORS.primary,
                        maxWidth: 140,
                      }}
                      numberOfLines={1}
                    >
                      {selectedGroup?.name || "Grup Seç"}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: `${selectedGroup?.colorCode || COLORS.primary}22`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: -2,
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={12}
                        color={selectedGroup?.colorCode || COLORS.primary}
                      />
                    </View>
                  </Pressable>
                </View>
              </View>

              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: COLORS.surface,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      height: 50,
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color={COLORS.heroDark}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        fontSize: 15,
                        color: COLORS.text,
                      }}
                      placeholder="Mekan ara..."
                      placeholderTextColor={COLORS.textLight}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery("")}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={COLORS.textLight}
                        />
                      </Pressable>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsFilterModalVisible(true)}
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor:
                        getActiveFilterCount() > 0 ? COLORS.primary : COLORS.surface,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor:
                        getActiveFilterCount() > 0 ? COLORS.primary : COLORS.border,
                    }}
                  >
                    <Ionicons
                      name="options-outline"
                      size={24}
                      color={
                        getActiveFilterCount() > 0 ? COLORS.heroDark : COLORS.heroDark
                      }
                    />
                    {getActiveFilterCount() > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          backgroundColor: COLORS.danger,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor: COLORS.white,
                        }}
                      >
                        <Text
                          style={{
                            color: COLORS.white,
                            fontSize: 10,
                            fontWeight: "900",
                          }}
                        >
                          {getActiveFilterCount()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <SkeletonList
                  count={3}
                  spacing={18}
                  style={{ paddingHorizontal: 16, paddingTop: 8 }}
                  renderItem={() => <SkeletonPlaceCard />}
                />
              ) : displayedCategories.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingTop: 40,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: COLORS.secondarySoft,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="search" size={28} color={COLORS.heroDark} />
                  </View>

                  <Text
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 15,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {places.length === 0
                      ? "Listeniz boş. İlk mekanınızı ekleyin."
                      : "Aradığınız kriterlere uygun mekan bulunamadı."}
                  </Text>

                  {(searchQuery || getActiveFilterCount() > 0) && (
                    <TouchableOpacity onPress={resetFilters} style={{ marginTop: 16 }}>
                      <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
                        Filtreleri Temizle
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20 }}>
                  {filteredPlaces.map((item) => (
                    <PlaceCard
                      key={String(item.id)}
                      place={item}
                      category={item.category || "Other"}
                      onPress={() =>
                        navigation.navigate("PlaceDetail", {
                          placeId: item.id,
                        })
                      }
                      onMapPress={() =>
                        navigation.navigate("MapTab", {
                          targetPlaceId: item.id,
                        })
                      }
                      onReviewPress={() =>
                        navigation.navigate("EditReview", {
                          placeId: item.id,
                        })
                      }
                      onPhotoPress={() =>
                        navigation.navigate("UploadPhoto", {
                          placeId: item.id,
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            <Modal visible={isFilterModalVisible} animationType="slide" transparent>
              <View
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                }}
              >
                <View
                  style={{
                    backgroundColor: COLORS.surface,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    padding: 24,
                    maxHeight: "90%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{ fontSize: 22, fontWeight: "900", color: COLORS.text }}
                    >
                      Detaylı Filtre
                    </Text>
                    <Pressable onPress={() => setIsFilterModalVisible(false)}>
                      <Ionicons
                        name="close-circle"
                        size={28}
                        color={COLORS.textLight}
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: COLORS.textMuted,
                        marginBottom: 12,
                        textTransform: "uppercase",
                      }}
                    >
                      Kategoriler
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 24,
                      }}
                    >
                      {allCategoriesInPlaces.map((category) => {
                        const isSelected = selectedCategories.includes(category);
                        const categoryItem = getPlaceCategoryItem(category) || {
                          ...FALLBACK_CATEGORY,
                          label: category || "Diğer",
                        };

                        return (
                          <TouchableOpacity
                            key={category}
                            onPress={() => toggleFilterCategory(category)}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                              borderRadius: 20,
                              backgroundColor: isSelected
                                ? categoryItem.bgColor
                                : COLORS.surfaceSoft,
                              borderWidth: 1,
                              borderColor: isSelected
                                ? categoryItem.borderColor
                                : COLORS.border,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected
                                  ? categoryItem.textColor
                                  : COLORS.text,
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              {categoryItem.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {availableCities.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: COLORS.textMuted,
                            marginBottom: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          Şehirler
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 10,
                            marginBottom: 12,
                          }}
                        >
                          {availableCities.map((city) => {
                            const isSelected = selectedCities.includes(city);

                            return (
                              <TouchableOpacity
                                key={city}
                                onPress={() => toggleCity(city)}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 10,
                                  borderRadius: 20,
                                  backgroundColor: isSelected
                                    ? COLORS.hero
                                    : COLORS.surfaceSoft,
                                  borderWidth: 1,
                                  borderColor: isSelected
                                    ? COLORS.heroDark
                                    : COLORS.border,
                                }}
                              >
                                <Text
                                  style={{
                                    color: isSelected ? COLORS.white : COLORS.text,
                                    fontWeight: "700",
                                    fontSize: 14,
                                  }}
                                >
                                  {city}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </ScrollView>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                    }}
                  >
                    <Pressable
                      onPress={resetFilters}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 16,
                        backgroundColor: COLORS.surfaceSoft,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.textMuted,
                          fontWeight: "800",
                          fontSize: 15,
                        }}
                      >
                        Temizle
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setIsFilterModalVisible(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 16,
                        backgroundColor: COLORS.primary,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.white,
                          fontWeight: "800",
                          fontSize: 15,
                        }}
                      >
                        Sonuçları Göster ({filteredPlaces.length})
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Grup Seçim Modal */}
            <Modal
              visible={isGroupModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setIsGroupModalVisible(false)}
            >
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  justifyContent: "flex-end",
                }}
                onPress={() => setIsGroupModalVisible(false)}
              >
                <Pressable
                  style={{
                    backgroundColor: COLORS.surface,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingBottom: 32,
                    maxHeight: "75%",
                  }}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.border,
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "900",
                        color: COLORS.text,
                      }}
                    >
                      Gruplarım
                    </Text>
                    <Pressable onPress={() => setIsGroupModalVisible(false)}>
                      <Ionicons name="close" size={24} color={COLORS.textMuted} />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={{ paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {groups.map((group) => (
                      <Pressable
                        key={group.id}
                        onPress={async () => {
                          await setSelectedGroup(group);
                          setIsGroupModalVisible(false);
                        }}
                        style={{
                          marginVertical: 8,
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          borderRadius: 20,
                          backgroundColor: group.colorCode ? `${group.colorCode}20` : COLORS.surfaceSoft,
                          borderWidth: 2,
                          borderColor: group.colorCode || COLORS.border,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: group.colorCode || COLORS.primary,
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            <Ionicons
                              name={group.selectedIconsJson as any || "planet"}
                              size={20}
                              color="white"
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: COLORS.text,
                            }}
                          >
                            {group.name}
                          </Text>
                        </View>

                        {selectedGroupId === group.id && (
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: group.colorCode || COLORS.primary,
                              justifyContent: "center",
                              alignItems: "center",
                              marginLeft: 12,
                            }}
                          >
                            <Ionicons name="checkmark" size={18} color="white" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>

            <View
              style={{
                position: "absolute",
                right: 24,
                bottom: 30,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("CreatePlace", { initialStatus: 2 })}
                style={styles.fabPrimary}
              >
                <Ionicons name="add" size={32} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.iconMapBg,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnCompact: {
    width: 30,
    height: 30,
    borderRadius: 14,
    backgroundColor: COLORS.iconMapBg,
    justifyContent: "center",
    alignItems: "center",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  metaChipText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  inlineRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7E6",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  inlineRatingText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#B45309",
  },
  photoCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  photoCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },
  fabPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});