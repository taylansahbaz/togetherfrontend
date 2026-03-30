import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    ImageBackground,
    Pressable,
    RefreshControl,
    SafeAreaView, ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { api } from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Place } from "../../types/place";
import { getApiErrorMessage } from "../../utils/helpers";

// --- WISHLIST KART BİLEŞENİ (Home ile Uyumlu) ---
const WishlistCard = ({ 
    place, 
    onPress, 
    onMarkAsVisited 
}: { 
    place: Place; 
    onPress: () => void;
    onMarkAsVisited: () => void;
}) => (
    <View style={{ position: "relative", marginTop: 14, marginBottom: 4 }}>
        {/* Üst Çizgiye Ortalı Şehir Rozeti */}
        {place.city && (
            <View style={{ 
                position: "absolute", top: -10, alignSelf: "center", 
                backgroundColor: "#8aa0b2", paddingVertical: 2, paddingHorizontal: 10, 
                borderRadius: 10, zIndex: 2, shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
            }}>
                <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>
                    {place.city.toUpperCase()}
                </Text>
            </View>
        )}
        
        <Pressable 
            onPress={onPress}
            style={{
                backgroundColor: "#fcbebe", borderRadius: 18, padding: 16,
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                borderWidth: 1, borderColor: "#e2e8f0",
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03, shadowRadius: 4, elevation: 2
            }}
        >
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#102a43" }} numberOfLines={1}>
                    {place.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Ionicons name="bookmark-outline" size={12} color="#64748b" />
                    <Text style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>
                        {place.category || "Planned Visit"}
                    </Text>
                </View>
            </View>

            {/* Ziyaret Edildi İşareti Butonu */}
            <TouchableOpacity 
                onPress={onMarkAsVisited}
                activeOpacity={0.7}
                style={{ 
                    backgroundColor: "#E8F4F6", padding: 10, borderRadius: 14, 
                    borderWidth: 1, borderColor: "#2F7E8D" 
                }}
            >
                <Ionicons name="checkmark-done" size={20} color="#2F7E8D" />
            </TouchableOpacity>
        </Pressable>
    </View>
);

export default function WishlistScreen({ navigation }: any) {
    const { selectedGroupId } = useSelectedGroup();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Verileri Yükle
    const loadWishlist = async () => {
        if (!selectedGroupId) return;
        try {
            setLoading(true);
            // PlacesController içindeki Getgroup/{groupId}
            const response = await api.get(`/Places/Getgroup/${selectedGroupId}`);
            // Backend'den dönen listeden sadece 'Wishlist' statusundekileri ayıkla
            const wishlistData = response.data.data.filter((p: any) => p.status === "Wishlist" || p.status === 1);
            setPlaces(wishlistData);
        } catch (err) {
            console.log("Wishlist Load Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadWishlist(); }, [selectedGroupId]));

    // Gidildi Olarak İşaretle (Wishlist -> Visited Taşıma)
    const handleMarkAsVisited = (placeId: string) => {
        Alert.alert(
            "Buraya Gittiniz mi?", 
            "Bu mekanı ziyaret edilen yerler listenize taşımak istiyor musunuz?", 
            [
                { text: "Vazgeç", style: "cancel" },
                { 
                    text: "Evet, Gittik!", 
                    onPress: async () => {
                        try {
                            // WishlistController içindeki mark-as-visited endpointi
                            await api.put(`/Wishlist/${placeId}/mark-as-visited`);
                            loadWishlist(); // Listeyi güncelle
                        } catch (err) {
                            Alert.alert("Hata", getApiErrorMessage(err));
                        }
                    }
                }
            ]
        );
    };

    // Kategorilere Göre Gruplandır
    const groupedData = useMemo(() => {
        return places.reduce((acc: any, place) => {
            const cat = place.category || "General Plans";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(place);
            return acc;
        }, {});
    }, [places]);

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground source={require("../../../assets/images/home-bg.png")} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.75)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        
                        {/* HEADER */}
                        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#8aa0b2", letterSpacing: 1 }}>
                                UPCOMING ADVENTURES
                            </Text>
                        </View>

                        <ScrollView 
                            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWishlist(); }} />}
                        >
                            {loading && !refreshing ? (
                                <LoadingSpinner />
                            ) : places.length === 0 ? (
                                <View style={{ alignItems: "center", marginTop: 100 }}>
                                    <Ionicons name="map-outline" size={60} color="#cbd5e1" />
                                    <Text style={{ color: "#94a3b8", fontSize: 16, textAlign: "center", marginTop: 16 }}>
                                        Henüz planlanan bir yer yok.{"\n"}Hadi yeni yerler keşfedin!
                                    </Text>
                                </View>
                            ) : (
                                Object.keys(groupedData).map(cat => (
                                    <View key={cat} style={{ 
                                        marginBottom: 25, padding: 18, borderRadius: 24, marginTop: -13,
                                        backgroundColor: "rgba(255,255,255,1)", borderWidth: 1, borderColor: "white" 
                                    }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom:2 }}>
                                            <View style={{ width: 4, height: 18, backgroundColor: "#2F7E8D", borderRadius: 2, marginRight: 8 }} />
                                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#102a43" }}>{cat}</Text>
                                        </View>
                                        
                                        <View style={{ gap: 3 }}>
                                            {groupedData[cat].map((item: Place) => (
                                                <WishlistCard 
                                                    key={item.id} 
                                                    place={item} 
                                                    onPress={() => navigation.navigate("PlaceDetail", { placeId: item.id })}
                                                    onMarkAsVisited={() => handleMarkAsVisited(String(item.id))}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {/* + BUTONU (MUTLAKA SCROLLVIEW DIŞINDA) */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("CreatePlace", { initialStatus: 1 })} // 1 = Wishlist olarak başlat
                            style={{
                                position: "absolute",
                                bottom: 30,
                                right: 30,
                                backgroundColor: "#102a43",
                                width: 68,
                                height: 68,
                                borderRadius: 34,
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 999,
                                elevation: 8,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                            }}
                        >
                            <Ionicons name="add" size={38} color="white" />
                        </TouchableOpacity>

                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}