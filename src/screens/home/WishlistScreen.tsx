import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ImageBackground,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PLACE_CATEGORIES } from "@/src/utils/constants";
import { api } from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Place } from "../../types/place";
import { getApiErrorMessage } from "../../utils/helpers";
import { getPlaceCategoryImage, getPlaceCategoryLabel } from "../../utils/placeCategories";
const colors = {
  overlay: "rgba(255,255,255,0.78)",
  text: "#102A43",
  muted: "#6B7C93",
  softMuted: "#8AA0B2",
  white: "#FFFFFF",
  primary: "#2F7E8D",
  primarySoft: "#E8F4F6",
  pinkCard: "rgba(252,190,190,0.92)",
  pinkShadow: "#E6A5B2",
  glassCard: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.70)",
  peach: "#FFF1E8",
  peachText: "#D17B5F",
  pinkChip: "#FCE7F3",
  pinkChipText: "#C45C8A",
};

const formatVisitDate = (date?: string | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("tr-TR");
};

const getUniqueCityCount = (places: Place[]) => {
  return new Set(
    places.map((x) => x.city?.trim()).filter((x): x is string => !!x)
  ).size;
};

const HeroChip = ({
  text,
  bg,
  color,
}: {
  text: string;
  bg: string;
  color: string;
}) => (
  <View
    style={{
      backgroundColor: bg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color,
      }}
    >
      {text}
    </Text>
  </View>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      marginTop: 80,
      paddingHorizontal: 24,
    }}
  >
    <View
      style={{
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: "rgba(47,126,141,0.10)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="heart-outline" size={42} color={colors.primary} />
    </View>

    <Text
      style={{
        marginTop: 18,
        fontSize: 22,
        fontWeight: "900",
        color: colors.text,
      }}
    >
      No plans yet
    </Text>

    <Text
      style={{
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
        color: colors.muted,
      }}
    >
      Henüz wishlist listende yer yok. İlk planını ekleyip burayı daha canlı hale getir.
    </Text>

    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onAdd}
      style={{
        marginTop: 18,
        backgroundColor: colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 5,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name="add" size={18} color="#fff" />
      <Text
        style={{
          color: "#fff",
          fontSize: 14,
          fontWeight: "800",
          marginLeft: 8,
        }}
      >
        Add your first place
      </Text>
    </TouchableOpacity>
  </View>
);

const WishlistCard = ({
  place,
  onPress,
  onMarkAsVisited,
}: {
  place: Place;
  onPress: () => void;
  onMarkAsVisited: () => void;
}) => {
    
const categoryItem = PLACE_CATEGORIES.find(
  (item) => item.value === place.category
);  
const categoryImage = getPlaceCategoryImage(place.category);
const categoryLabel = getPlaceCategoryLabel(place.category);
  const visitDate = formatVisitDate((place as any).visitDate);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.pinkCard,
        borderRadius: 22,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.62)",
        shadowColor: colors.pinkShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", flex: 1, marginRight: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.58)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          {categoryImage ? (
            <Image
              source={categoryImage}
              resizeMode="contain"
              style={{ width: 22, height: 22 }}
            />
          ) : (
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.primary}
            />
          )}
        </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              {!!place.city && (
                <View
                  style={{
                    backgroundColor: colors.softMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    marginRight: 8,
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    {place.city.toUpperCase()}
                  </Text>
                </View>
              )}

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.46)",
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 999,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    color: "#7A4F60",
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                {place.createdByName ? place.createdByName.charAt(0).toUpperCase() + place.createdByName.slice(1) : "you"} Ekledi</Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 17,
                fontWeight: "900",
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {place.title}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={13}
                  color={colors.muted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginLeft: 5,
                  }}
                >
                  {categoryLabel}
                </Text>
              </View>

              {!!visitDate && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={colors.muted}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      marginLeft: 5,
                    }}
                  >
                    {visitDate}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onMarkAsVisited}
          activeOpacity={0.8}
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.2,
            borderColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="checkmark-done" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};
export default function WishlistScreen({ navigation }: any) {
  const { selectedGroupId , selectedGroup} = useSelectedGroup();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate] = useState<string>(todayStr);

  const loadWishlist = async () => {
    if (!selectedGroupId) {
      setPlaces([]);
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(`/Places/Getgroup/${selectedGroupId}`);
      const wishlistData = response.data.data.filter(
        (p: any) => p.status === "Wishlist" || p.status === 1
      );

      setPlaces(wishlistData);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setPlaces([]);
      } else {
        Alert.alert("Hata", getApiErrorMessage(err));
        console.log("Wishlist Load Error:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [selectedGroupId])
  );

  const handleMarkAsVisited = (placeId: string) => {
    Alert.alert(
      "Buraya gittiniz mi?",
      "Bu mekanı ziyaret edilen yerler listenize taşımak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, gittik!",
          onPress: async () => {
            try {
              await api.put(`/Wishlist/${placeId}/mark-as-visited`);
              loadWishlist();
            } catch (err) {
              Alert.alert("Hata", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const groupedData = useMemo(() => {
    return places.reduce((acc: any, place) => {
      const cat = place.category || "General Plans";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(place);
      return acc;
    }, {});
  }, [places]);

  const cityCount = useMemo(() => getUniqueCityCount(places), [places]);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../assets/images/home-bg.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 10,
                paddingBottom: 130,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadWishlist();
                  }}
                />
              }
            >
              <View
                style={{
                  marginBottom: 18,
                  padding: 20,
                  borderRadius: 30,
                  backgroundColor: "rgba(255,255,255,0.56)",
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: -24,
                    right: -8,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "rgba(47,126,141,0.10)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -24,
                    left: -10,
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "rgba(252,190,190,0.18)",
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                   <Text
                    style={{
                        fontSize: 26,
                        fontWeight: "900",
                        color: colors.softMuted,
                        letterSpacing: 0.4,
                    }}
                    >
                    {selectedGroup?.name
                        ? `${selectedGroup.name} ile planların`
                        : "Upcoming Adventures"}
                    </Text>

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        lineHeight: 19,
                        color: colors.muted,
                      }}
                    >
                      {selectedGroup?.name
                        ? "Gitmek istediginiz yerleri görebilirsiniz."
                        : "Sonraki güzel anılar için kaydedilmiş yerleriniz."}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(47,126,141,0.12)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="sparkles"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 14,
                  }}
                >
                  <HeroChip
                    text={`${places.length} Plans`}
                    bg={colors.primarySoft}
                    color={colors.primary}
                  />
                  <HeroChip
                    text={`${cityCount} Cities`}
                    bg={colors.pinkChip}
                    color={colors.pinkChipText}
                  />
                </View>
              </View>

              {loading && !refreshing ? (
                <LoadingSpinner />
              ) : places.length === 0 ? (
                <EmptyState
                  onAdd={() =>
                    navigation.navigate("CreateWishlist", {
                      defaultDate: selectedDate,
                    })
                  }
                />
              ) : (
                Object.keys(groupedData).map((cat) => (
                  <View
                    key={cat}
                    style={{
                      marginBottom: 22,
                      padding: 18,
                      borderRadius: 28,
                      backgroundColor: colors.glassCard,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                      shadowColor: "#E5B9C5",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.08,
                      shadowRadius: 14,
                      elevation: 3,
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
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                          marginRight: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 24,
                            backgroundColor: colors.primary,
                            borderRadius: 99,
                            marginRight: 10,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 19,
                            fontWeight: "900",
                            color: colors.text,
                          }}
                        >
                          {cat}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: "#EEF6F7",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 999,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: colors.primary,
                          }}
                        >
                          {groupedData[cat].length} places
                        </Text>
                      </View>
                    </View>

                    {groupedData[cat].map((item: Place) => (
                      <WishlistCard
                        key={item.id}
                        place={item}
                        onPress={() =>
                          navigation.navigate("PlaceDetail", {
                            placeId: item.id,
                          })
                        }
                        onMarkAsVisited={() =>
                          handleMarkAsVisited(String(item.id))
                        }
                      />
                    ))}
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate("CreateWishlist", {
                  defaultDate: selectedDate,
                })
              }
              style={{
                position: "absolute",
                bottom: 30,
                right: 24,
                width: 66,
                height: 66,
                borderRadius: 33,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 999,
                elevation: 8,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.28,
                shadowRadius: 14,
              }}
            >
              <Ionicons name="add" size={34} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}