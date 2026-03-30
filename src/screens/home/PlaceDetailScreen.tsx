import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

// YENİ: deletePlace eklendi
import { deletePlace, getPlaceDetail } from "../../api/places";
import { markPlaceAsVisited } from "../../api/wishlist";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReviewCard from "../../components/place/ReviewCard";
import StatusBadge from "../../components/place/StatusBadge";
import { PlaceDetailAggregate } from "../../types/place";
import { formatDate } from "../../utils/date";
import { getApiErrorMessage } from "../../utils/helpers";

export default function PlaceDetailScreen({ route, navigation }: any) {
    const { placeId } = route.params;

    const [detail, setDetail] = useState<PlaceDetailAggregate | null>(null);
    const [loading, setLoading] = useState(true);
    const [markingVisited, setMarkingVisited] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getPlaceDetail(placeId);
            setDetail(data);
        } catch (err) {
            Alert.alert("Error", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [placeId])
    );

    const onMarkAsVisited = async () => {
        try {
            setMarkingVisited(true);
            const nowIso = new Date().toISOString();
            await markPlaceAsVisited(placeId, nowIso);
            await load();
            Alert.alert("Success", "Place marked as visited.");
        } catch (err) {
            Alert.alert("Error", getApiErrorMessage(err));
        } finally {
            setMarkingVisited(false);
        }
    };

    // --- YENİ: MEKANI SİLME İŞLEMLERİ ---
    const confirmDeletePlace = () => {
        Alert.alert(
            "Emin misiniz?",
            "Bu mekanı tamamen silmek istediğinize emin misiniz? Fotoğraflar ve yorumlar da silinecektir.",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deletePlace(placeId);
                            Alert.alert("Başarılı", "Mekan silindi.");
                            navigation.navigate("HomeTab"); // Silindikten sonra ana sayfaya dön
                        } catch (err) {
                            Alert.alert("Hata", getApiErrorMessage(err));
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const showOptions = () => {
        Alert.alert(
            "Mekan Ayarları",
            "Bu mekanla ilgili ne yapmak istiyorsunuz?",
            [
                { 
                    text: "Mekanı Düzenle", 
                    onPress: () => navigation.navigate("CreatePlace", { 
                        editPlaceId: placeId, 
                        placeData: detail 
                    }) 
                },
                { text: "Mekanı Sil", style: "destructive", onPress: confirmDeletePlace },
                { text: "İptal", style: "cancel" }
            ]
        );
    };
    const renderStars = (ratingOutOf10: number) => {
        const starCount = Math.round(ratingOutOf10 / 2);
        return (
            <View style={{ flexDirection: "row", marginTop: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < starCount ? "star" : "star-outline"} size={14} color="#F59E0B" style={{ marginRight: 2 }} />
                ))}
            </View>
        );
    };

    if (loading) return <LoadingSpinner />;

    if (!detail) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="map-outline" size={48} color="#94a3b8" />
                <Text style={styles.errorText}>Place not found.</Text>
            </View>
        );
    }

    const {
        title, city, address, category, description,
        visitDate, createdAt, createdByName, averageRating,
        reviewCount, currentUserReview, reviews, photos, status,
        latitude, longitude 
    } = detail;

    const myRating = typeof currentUserReview?.rating === "number" ? currentUserReview.rating : null;
    const groupAverage = typeof averageRating === "number" ? averageRating : 0;
    const coverImageUrl = photos && photos.length > 0 ? (photos[0] as any).imageUrl : null;

    return (
        <View style={styles.mainContainer}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* 1. KAPAK FOTOĞRAFI & BUTONLAR */}
                <View style={styles.headerCover}>
                    {coverImageUrl ? (
                        <Image source={{ uri: coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.noCoverPlaceholder}>
                            <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.noCoverText}>No photo yet</Text>
                        </View>
                    )}
                    
                    {/* Geri Butonu */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#102a43" />
                    </TouchableOpacity>

                    {/* YENİ: Seçenekler (Ayarlar) Butonu */}
                    <TouchableOpacity style={styles.optionsButton} onPress={showOptions}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#102a43" />
                    </TouchableOpacity>
                </View>

                {/* 2. ANA İÇERİK KARTI (Değişiklik yok) */}
                <View style={styles.contentCard}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>
                                {[city, category].filter(Boolean).join(" • ")}
                            </Text>
                        </View>
                        {!!status && <StatusBadge status={status} />}
                    </View>

                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("UploadPhoto", { placeId })}>
                            <View style={[styles.actionIconBox, { backgroundColor: "#e0f2fe" }]}><Ionicons name="camera" size={20} color="#0284c7" /></View>
                            <Text style={styles.actionBtnText} numberOfLines={1}>Add Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("EditReview", { placeId, review: currentUserReview ?? null })}>
                            <View style={[styles.actionIconBox, { backgroundColor: "#fef3c7" }]}><Ionicons name="star" size={20} color="#d97706" /></View>
                            <Text style={styles.actionBtnText} numberOfLines={1}>{currentUserReview ? "Edit Review" : "Add Review"}</Text>
                        </TouchableOpacity>

                        {status === "Wishlist" && (
                            <TouchableOpacity style={styles.actionBtn} onPress={onMarkAsVisited} disabled={markingVisited}>
                                <View style={[styles.actionIconBox, { backgroundColor: "#dcfce7" }]}>
                                    {markingVisited ? <ActivityIndicator size="small" color="#16a34a" /> : <Ionicons name="checkmark-done" size={20} color="#16a34a" />}
                                </View>
                                <Text style={styles.actionBtnText} numberOfLines={1}>Mark Visited</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.ratingsCard}>
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingLabel}>My Rating</Text>
                            <View style={styles.ratingValueRow}>
                                <Text style={styles.ratingValue}>{myRating !== null ? myRating : "-"}</Text>
                                <Text style={styles.ratingMax}>/10</Text>
                            </View>
                            {myRating !== null && renderStars(myRating)}
                        </View>
                        <View style={styles.ratingDivider} />
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingLabel}>Group Ortalamasi</Text>
                            <View style={styles.ratingValueRow}>
                                <Text style={styles.ratingValue}>{groupAverage.toFixed(1)}</Text>
                                <Text style={styles.ratingMax}>/10</Text>
                            </View>
                            {renderStars(groupAverage)}
                        </View>
                    </View>
                    
                    {Platform.OS !== "web" && latitude && longitude && MapView && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            {!!address && <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>{address}</Text>}
                            <View style={styles.mapWidgetContainer}>
                                <MapView
                                    style={styles.mapWidget}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={{ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
                                    scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
                                >
                                    <Marker coordinate={{ latitude, longitude }} pinColor={status === "Visited" ? "#2F7E8D" : "#fcbebe"} />
                                </MapView>
                                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => Alert.alert("Map", "Full map opening feature is coming soon!")} />
                            </View>
                        </View>
                    )}

                    <View style={styles.infoSection}>
                        {!!description && (
                            <View style={styles.infoRow}>
                                <Ionicons name="document-text-outline" size={20} color="#64748b" style={styles.infoIcon} />
                                <Text style={styles.infoText}>{description}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.infoIcon} />
                            <Text style={styles.infoText}>Added by <Text style={{ fontWeight: "700", color: "#102a43" }}>{createdByName || "Unknown"}</Text></Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#64748b" style={styles.infoIcon} />
                            <Text style={styles.infoText}>Created on {formatDate(createdAt)}</Text>
                        </View>
                        {!!visitDate && (
                            <View style={styles.infoRow}>
                                <Ionicons name="flag-outline" size={20} color="#16a34a" style={styles.infoIcon} />
                                <Text style={[styles.infoText, { color: "#16a34a", fontWeight: "600" }]}>Visited on {formatDate(visitDate)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Photos</Text>
                        {!photos.length ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyCardText}>No photos yet. Be the first to upload!</Text></View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
                                {photos.map((photo: any, i: number) => (
                                    <Image key={i} source={{ uri: photo.imageUrl }} style={styles.galleryImage} />
                                ))}
                                <View style={{ width: 24 }} />
                            </ScrollView>
                        )}
                    </View>

                    <View style={styles.sectionContainer}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            <Text style={styles.reviewCountText}>{reviewCount} reviews</Text>
                        </View>
                        {!reviews.length ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyCardText}>No reviews yet.</Text></View>
                        ) : (
                            reviews.map((review) => (
                                <View key={review.id} style={{ marginBottom: 12 }}>
                                    <ReviewCard review={review} />
                                </View>
                            ))
                        )}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: "#f8fafc" },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
    errorText: { marginTop: 12, color: "#64748b", fontSize: 16, fontWeight: "500" },
    
    headerCover: { width: "100%", height: 280, position: "relative" },
    coverImage: { width: "100%", height: "100%" },
    noCoverPlaceholder: { flex: 1, backgroundColor: "#94a3b8", justifyContent: "center", alignItems: "center" },
    noCoverText: { marginTop: 8, color: "rgba(255,255,255,0.8)", fontWeight: "600", fontSize: 14 },
    backButton: { 
        position: "absolute", top: Platform.OS === "ios" ? 50 : 30, left: 20, 
        backgroundColor: "rgba(255,255,255,0.9)", width: 44, height: 44, 
        borderRadius: 22, justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
    },
    // YENİ EKLENDİ
    optionsButton: { 
        position: "absolute", top: Platform.OS === "ios" ? 50 : 30, right: 20, 
        backgroundColor: "rgba(255,255,255,0.9)", width: 44, height: 44, 
        borderRadius: 22, justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
    },

    contentCard: { backgroundColor: "#f8fafc", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, padding: 24, minHeight: 500 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    title: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginBottom: 4 },
    subtitle: { fontSize: 14, color: "#64748b", fontWeight: "500" },

    quickActionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 10 },
    actionBtn: { flex: 1, alignItems: "center" },
    actionIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 6 },
    actionBtnText: { fontSize: 12, fontWeight: "600", color: "#475569", textAlign: "center" },

    ratingsCard: { flexDirection: "row", backgroundColor: "white", marginTop: 28, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
    ratingBox: { flex: 1, alignItems: "center" },
    ratingDivider: { width: 1, backgroundColor: "#f1f5f9", marginHorizontal: 10 },
    ratingLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    ratingValueRow: { flexDirection: "row", alignItems: "baseline" },
    ratingValue: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
    ratingMax: { fontSize: 14, fontWeight: "600", color: "#94a3b8", marginLeft: 2 },

    infoSection: { marginTop: 28, backgroundColor: "white", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    infoIcon: { marginRight: 12, marginTop: 2 },
    infoText: { flex: 1, fontSize: 14, color: "#475569", lineHeight: 22 },

    sectionContainer: { marginTop: 32 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
    
    mapWidgetContainer: { width: "100%", height: 160, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" },
    mapWidget: { width: "100%", height: "100%" },

    galleryImage: { width: 130, height: 130, borderRadius: 20, marginRight: 12, backgroundColor: "#e2e8f0" },
    reviewCountText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
    emptyCard: { backgroundColor: "white", padding: 24, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9", borderStyle: "dashed" },
    emptyCardText: { color: "#94a3b8", fontSize: 14, fontWeight: "500", textAlign: "center" }
});