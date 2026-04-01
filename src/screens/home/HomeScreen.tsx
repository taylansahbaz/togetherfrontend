import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    ImageBackground, Modal,
    Pressable, SafeAreaView, ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { getPlacesByGroup } from "../../api/places";
import AppButton from "../../components/common/AppButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Place } from "../../types/place";
import { formatDate } from "../../utils/date";
import { getApiErrorMessage } from "../../utils/helpers";

const PlaceCard = ({ 
    place, 
    onPress, 
    onMapPress, 
    onReviewPress, 
    onPhotoPress 
}: { 
    place: Place; 
    onPress: () => void;
    onMapPress: () => void;
    onReviewPress: () => void;
    onPhotoPress: () => void;
}) => {
    const isVisited = place.status === "Visited" || place.status === 2;
    const rating = (place as any).rating ? (place as any).rating.toFixed(1) : "-";
    
    const bgColor = isVisited ? "#E8F4F6" : "#fcbebe";
    const borderColor = isVisited ? "#2F7E8D" : "#e2e8f0";
    return (
        <Pressable onPress={onPress} style={{ width: "100%", alignSelf: "center", position: "relative", marginTop: 14 }}>
            
            {(place.visitDate || place.city) && (
                <View style={{ 
                    position: "absolute", 
                    top: -12, 
                    alignSelf: "center", 
                    backgroundColor: "#64748b",
                    paddingVertical: 4,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    zIndex: 1, 
                    flexDirection: "row",
                    alignItems: "center"
                }}>
                    {place.visitDate && (
                        <>
                            <Ionicons name="calendar-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700", marginRight: place.city ? 10 : 0 }}>
                                {formatDate(place.visitDate)}
                            </Text>
                        </>
                    )}
                    {place.city && (
                        <>
                            <Ionicons name="location-outline" size={12} color="#ffffff" style={{ marginRight: 2 }} />
                            <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>
                                {place.city}
                            </Text>
                        </>
                    )}
                </View>
            )}

            <View
                style={{
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 4, 
                    flexDirection: "row", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#102a43" }} numberOfLines={1}>
                        {place.title}
                    </Text>
                </View>
                
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", height: 28, paddingHorizontal: 6, borderRadius: 14 }}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={{ fontSize: 12, fontWeight: "700", marginLeft: 4, color: "#D97706" }}>
                            {rating}
                        </Text>
                    </View>

                    <Pressable onPress={onMapPress} style={{ backgroundColor: "#f1f5f9", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="map" size={14} color="#3b82f6" />
                    </Pressable>

                    <Pressable onPress={onReviewPress} style={{ backgroundColor: "#f1f5f9", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="chatbubble-ellipses" size={14} color="#10b981" />
                    </Pressable>

                    <Pressable onPress={onPhotoPress} style={{ backgroundColor: "#f1f5f9", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="image" size={14} color="#8b5cf6" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const { selectedGroupId, selectedGroup } = useSelectedGroup();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);

    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const load = async () => {
        if (!selectedGroupId) {
            setPlaces([]);
            return;
        }
        try {
            setLoading(true);
            const data = await getPlacesByGroup(selectedGroupId);
            setPlaces(data);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setPlaces([]); }
            else Alert.alert("Error", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { load(); }, [selectedGroupId]));

    const groupedPlaces = useMemo(() => {
        const groups: { [key: string]: Place[] } = {};
        places.forEach(place => {
            const cat = place.category || "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(place);
        });
        return groups;
    }, [places]);

    const allCategories = useMemo(() => Object.keys(groupedPlaces), [groupedPlaces]);

    const stats = useMemo(() => {
        const visited = places.filter(p => p.status === "Visited" || p.status === 2).length;
        const wishlist = places.length - visited;
        return { total: places.length, visited, wishlist };
    }, [places]);

    const spotlightPlace = useMemo(() => {
        const wishlistPlaces = places.filter(p => p.status !== "Visited" && p.status === 1);
        if (wishlistPlaces.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * wishlistPlaces.length);
        return wishlistPlaces[randomIndex];
    }, [places]);

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(prev => prev.filter(c => c !== category));
        } else {
            setSelectedCategories(prev => [...prev, category]);
        }
    };

    const displayedCategories = allCategories.filter(cat => 
        selectedCategories.length === 0 || selectedCategories.includes(cat)
    );

    if (!selectedGroupId) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F9FA" }}>
                <View style={{ flex: 1, padding: 30, justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="albums-outline" size={64} color="#2F7E8D" style={{ marginBottom: 20 }} />
                    <Text style={{ fontSize: 32, fontWeight: "800", color: "#102a43", marginBottom: 16, textAlign: "center" }}>
                        Welcome,{"\n"}{user?.name?.split(' ')[0]} 👋
                    </Text>
                    <Text style={{ fontSize: 16, color: "#52667A", textAlign: "center", marginBottom: 40, lineHeight: 24 }}>
                        You don't have a group selected yet. {"\n\n"}Select an existing group or create a new one to start logging your shared memories.
                    </Text>
                    <View style={{ width: "100%", maxWidth: 300 }}>
                        <AppButton title="Go to Groups" onPress={() => navigation.navigate("ProfileTab", { screen: "Groups" })} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../assets/images/home-bg.png")}
                resizeMode="cover"
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.85)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
                            
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                                <View>
                                    <Text style={{ fontSize: 32, fontWeight: "800", color: "#102a43", marginTop: 4 }}>
                                        {selectedGroup?.name || "Shared Memories"}
                                    </Text>
                                </View>
                            </View>

                            {loading ? (
                                <LoadingSpinner />
                            ) : (
                                <>

                                   {spotlightPlace && selectedCategories.length === 0 && (
                                        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                                            <Pressable 
                                                onPress={() => navigation.navigate("PlaceDetail", { placeId: spotlightPlace.id })}
                                                style={{
                                                    backgroundColor: "#1F5F78",
                                                    borderRadius: 16, 
                                                    paddingVertical: 14, 
                                                    paddingHorizontal: 20, 
                                                    shadowColor: "#1F5F78",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 8,
                                                    elevation: 5,
                                                    flexDirection: "row", 
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 0, gap: 6 }}>
                                                        <Ionicons name="sparkles" size={14} color="#A5D8E4" />
                                                        <Text style={{ color: "#A5D8E4", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                            Next Date Idea
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#ffffff" }} numberOfLines={1}>
                                                        {spotlightPlace.title}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                                            </Pressable>
                                        </View>
                                    )}

                                    {displayedCategories.length === 0 && !loading ? (
                                        <View style={{ padding: 24, alignItems: "center", marginTop: 20 }}>
                                            <Text style={{ color: "#8aa0b2", fontSize: 16, textAlign: "center" }}>
                                                {allCategories.length === 0 ? "Your group is empty. Add your first place!" : "No places found for selected categories."}
                                            </Text>
                                        </View>
                                    ) : (
                                        displayedCategories.map((category) => (
                                            <View 
                                                key={category} 
                                                style={{ 
                                                    marginBottom: 12, 
                                                    marginHorizontal: 24, 
                                                    backgroundColor: "rgba(255, 255, 255, 0.45)", 
                                                    borderRadius: 24, 
                                                    padding: 20, 
                                                    borderWidth: 1.5,
                                                    borderColor: "rgba(255, 255, 255, 0.8)",
                                                }}
                                            >
                                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: -4, gap: 8 }}>
                                                    <Ionicons name="bookmark" size={20} color={"#2F7E8D"} />
                                                    <Text style={{ fontSize: 22, fontWeight: "800", color: "#102a43" }}>{category}</Text>
                                                    {/* <View style={{ marginLeft: "auto", backgroundColor: "#2F7E8D", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                        {   <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>
                                                            {groupedPlaces[category].length}
                                                        </Text>     }
                                                    </View> */}
                                                </View>
                                                
                                                <View style={{ alignSelf: "center", width: "100%", maxWidth: 470, }}> 
                                                    {groupedPlaces[category].map((item) => (
                                                        <PlaceCard 
                                                            key={String(item.id)}
                                                            place={item} 
                                                            onPress={() => navigation.navigate("PlaceDetail", { placeId: item.id })}
                                                            onMapPress={() => navigation.navigate("MapTab", { targetPlaceId: item.id })}
                                                            onReviewPress={() => navigation.navigate("EditReview", { placeId: item.id })}
                                                            onPhotoPress={() => navigation.navigate("UploadPhoto", { placeId: item.id })}
                                                        />
                                                    ))}
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </>
                            )}
                        </ScrollView>

                        {/* FİLTRE EKRANI (MODAL) */}
                        <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
                            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
                                <View style={{ backgroundColor: "#ffffff", padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" }}>
                                    
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                        <Text style={{ fontSize: 20, fontWeight: "800", color: "#102a43" }}>Filter Categories</Text>
                                        <Pressable onPress={() => setIsFilterVisible(false)}>
                                            <Ionicons name="close-circle" size={28} color="#94a3b8" />
                                        </Pressable>
                                    </View>

                                    <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 }}>
                                        {allCategories.map(category => {
                                            const isSelected = selectedCategories.includes(category);
                                            return (
                                                <TouchableOpacity
                                                    key={category}
                                                    onPress={() => toggleCategory(category)}
                                                    style={{
                                                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                                                        backgroundColor: isSelected ? "#2F7E8D" : "#f1f5f9",
                                                        borderWidth: 1, borderColor: isSelected ? "#2F7E8D" : "#e2e8f0"
                                                    }}
                                                >
                                                    <Text style={{ color: isSelected ? "#ffffff" : "#475569", fontWeight: "600" }}>{category}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                                        <Pressable onPress={() => setSelectedCategories([])} style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center" }}>
                                            <Text style={{ color: "#475569", fontWeight: "700" }}>Clear All</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setIsFilterVisible(false)} style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: "#2F7E8D", alignItems: "center" }}>
                                            <Text style={{ color: "#ffffff", fontWeight: "700" }}>Apply</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* DÜZELTİLDİ: SAĞ ALT KÖŞEDEKİ BUTON GRUBU - GÖLGELER VE YUVARLAKLIK AYARLANDI */}
                        <View style={{ position: "absolute", bottom: 24, right: 24, alignItems: "center", zIndex: 100 }}>
                            
                            {/* FİLTRE BUTONU (Üstte) */}
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onPress={() => setIsFilterVisible(true)}
                                style={{
                                    backgroundColor: "#2F7E8D",
                                    width: 60, height: 60, borderRadius: 30, 
                                    justifyContent: "center", alignItems: "center",
                                    marginBottom: 10, // İki buton arası boşluk
                                    shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
                                }}
                            >
                                <Ionicons name="options" size={30} color="#ffffff" />
                                {/* Seçili Filtre Sayısı Rozeti */}
                                {selectedCategories.length > 0 && (
                                    <View style={{ position: "absolute", top: 0, right: 0, backgroundColor: "#e11d48", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#2F7E8D" }}>
                                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>{selectedCategories.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* CREATE (EKLE) BUTONU (Altta) */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate("CreatePlace", { initialStatus: 2 })}
                                style={{
                                    backgroundColor: "#2F7E8D",
                                    width: 60, height: 60, borderRadius: 30, 
                                    justifyContent: "center", alignItems: "center",
                                    shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
                                }}
                            >
                                <Ionicons name="add" size={36} color="#ffffff" />
                            </TouchableOpacity>
                            
                        </View>

                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}