import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
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
import { getMyGroups } from "../../api/groups";
import {
  SkeletonList,
  SkeletonPlaceCard,
} from "../../components/common/Skeleton";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Group } from "../../types/group";
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
      paddingHorizontal: 12,
      height: 32,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color,
        lineHeight: 14,
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
      Henüz bir planınız yok 😔
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
         İlk Planınızı Ekleyin
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
const categoryImage = getPlaceCategoryImage(place.category ?? "");
const categoryLabel = getPlaceCategoryLabel(place.category ?? "");
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
            width: 40,
            height: 40,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.58)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            bottom: 8,
          }}
        >
          {categoryImage ? (
            <Image
              source={categoryImage}
              resizeMode="contain"
              style={{ width: 27, height: 27 }}
            />
          ) : (
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.primary}
            />
          )}
        </View>

          <View style={{ flex: 1, marginTop: -12, justifyContent: "center", minHeight: 40 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {place.title}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onMarkAsVisited}
          activeOpacity={0.8}
          style={{
            width: 37,
            height: 37,
            borderRadius: 14,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.2,
            borderColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginTop: -8,
          }}
        >
          <Ionicons name="checkmark-done" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {(!!place.city || !!visitDate || !!place.createdByName) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "nowrap",
            marginTop: 4,
            paddingHorizontal: 4,
          }}
        >
          {!!place.city && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Ionicons
                name="location-sharp"
                size={12}
                color={colors.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  marginLeft: 3,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {place.city}
              </Text>
            </View>
          )}

          {!!place.city && (!!visitDate || !!place.createdByName) && (
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.softMuted,
                marginHorizontal: 8,
              }}
            />
          )}

          {!!visitDate && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons
                name="calendar-sharp"
                size={12}
                color={colors.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  marginLeft: 3,
                }}
                numberOfLines={1}
              >
                {visitDate}
              </Text>
            </View>
          )}

          {!!visitDate && !!place.createdByName && (
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.softMuted,
                marginHorizontal: 8,
              }}
            />
          )}

          {!!place.createdByName && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Ionicons
                name="person-sharp"
                size={12}
                color={colors.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  marginLeft: 3,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {place.createdByName.charAt(0).toUpperCase() +
                  place.createdByName.slice(1)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};
export default function WishlistScreen({ navigation }: any) {
  const { user } = useAuth();
  const { showAlert, confirm } = useAlert();
  const { selectedGroupId, selectedGroup, setSelectedGroup, initializeSelectedGroup } = useSelectedGroup();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);

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
        showAlert({
          title: "Hata",
          message: getApiErrorMessage(err),
          type: "danger",
        });
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

  // Load groups when component mounts
  useEffect(() => {
    const loadGroups = async () => {
      if (!user?.id) return;
      try {
        const response = await getMyGroups();
        const { groups: fetchedGroups, lastSelectedGroupId: backendLastSelectedGroupId } = response.data;
        setGroups(fetchedGroups);
        // Initialize selected group if not already initialized
        if (!selectedGroup && fetchedGroups.length > 0) {
          const groupIdToSelect = user.lastSelectedGroupId ?? backendLastSelectedGroupId;
          await initializeSelectedGroup(fetchedGroups, groupIdToSelect);
        }
      } catch (error) {
        console.log("Failed to load groups:", error);
      }
    };
    loadGroups();
  }, [user?.id]);

  const handleMarkAsVisited = async (placeId: string) => {
    const ok = await confirm({
      title: "Buraya gittiniz mi?",
      message:
        "Bu mekanı ziyaret edilen yerler listenize taşımak istiyor musunuz?",
      type: "info",
      confirmText: "Evet, gittik!",
      cancelText: "Vazgeç",
    });
    if (!ok) return;

    try {
      await api.put(`/Wishlist/${placeId}/mark-as-visited`);
      loadWishlist();
    } catch (err) {
      showAlert({
        title: "Hata",
        message: getApiErrorMessage(err),
        type: "danger",
      });
    }
  };

  const groupedData = useMemo(() => {
    return places.reduce((acc: any, place) => {
      const cat = getPlaceCategoryLabel(place.category ?? "") || "Genel Planlar";
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
                    width: 100,
                    height: 100,
                    borderRadius: 60,
                    backgroundColor: "rgba(47,126,141,0.10)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -26,
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
                        fontSize: 24,
                        fontWeight: "900",
                        color: colors.softMuted,
                        letterSpacing: 0.4,
                    }}
                    >
                    {selectedGroup?.name
                        ? `Planların`
                        : "Yakındaki Planların"}
                    </Text>

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 15,
                        lineHeight: 19,
                        color: colors.muted,
                      }}
                    >
                         Güzel anılar için kaydettikleriniz.
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      bottom: 16,
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
                    marginBottom: -20,
                  }}
                >
                  <HeroChip
                    text={`${places.length} Plan`}
                    bg={colors.pinkChip}
                    color={colors.pinkChipText}
                  />
                  <HeroChip
                    text={`${cityCount} Şehir`}
                    bg={colors.primarySoft}
                    color={colors.primary}

                  />
                  <Pressable
                    onPress={() => setIsGroupModalVisible(true)}
                    style={{
                      backgroundColor: "rgba(248, 248, 248, 0.44)",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginRight: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "rgba(204, 220, 223, 0.3)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 19,
                        height: 19,
                        borderRadius: 11,
                        backgroundColor:
                          selectedGroup?.colorCode || colors.primary,
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
                        color: selectedGroup?.colorCode || colors.primary,
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
                        backgroundColor: `${selectedGroup?.colorCode || colors.primary}22`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: -2,
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={12}
                        color={selectedGroup?.colorCode || colors.primary}
                      />
                    </View>
                  </Pressable>
                </View>
              </View>

              {loading && !refreshing ? (
                <SkeletonList
                  count={3}
                  spacing={18}
                  style={{ paddingHorizontal: 16, paddingTop: 8 }}
                  renderItem={() => <SkeletonPlaceCard />}
                />
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
                      marginBottom: 12,
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
                          {groupedData[cat].length} Mekan
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
                    backgroundColor: colors.white,
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
                      borderBottomColor: colors.glassBorder,
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
                        color: colors.text,
                      }}
                    >
                      Gruplarım
                    </Text>
                    <Pressable onPress={() => setIsGroupModalVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.muted} />
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
                          backgroundColor: group.colorCode ? `${group.colorCode}20` : colors.primarySoft,
                          borderWidth: 2,
                          borderColor: group.colorCode || colors.primary,
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
                              backgroundColor: group.colorCode || colors.primary,
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            <Ionicons
                              name={group.selectedIconsJson as any|| "people"}
                              size={20}
                              color="white"
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: colors.text,
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
                              backgroundColor: group.colorCode || colors.primary,
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
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}