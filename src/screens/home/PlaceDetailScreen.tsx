import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { deletePlacePhoto } from "../../api/photos";
import ZoomableImage from "../../components/common/ZoomableImage";
import WishDayRsvpCard from "../../components/place/WishDayRsvpCard";
import { useAlert } from "../../context/AlertContext";
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

import CustomActionSheet from "@/src/components/common/CustomActionSheet";
import { deletePlace, getPlaceDetail } from "../../api/places";
import { markPlaceAsVisited } from "../../api/wishlist";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { PlaceDetailAggregate } from "../../types/place";
import { formatDate } from "../../utils/date";
import { getApiErrorMessage } from "../../utils/helpers";

export default function PlaceDetailScreen({ route, navigation }: any) {
    const { placeId } = route.params;
    const { showAlert, confirm } = useAlert();
    const [detail, setDetail] = useState<PlaceDetailAggregate | null>(null);
    const [loading, setLoading] = useState(true);
    const [markingVisited, setMarkingVisited] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [savingPhoto, setSavingPhoto] = useState(false);
    const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    const headerSliderRef = useRef<FlatList<any>>(null);
    const viewerSliderRef = useRef<FlatList<any>>(null);
    const load = async () => {
        try {
            setLoading(true);
            const data = await getPlaceDetail(placeId);
            setDetail(data);
        } catch (err) {
            showAlert({ title: "Hata", message: getApiErrorMessage(err), type: "danger" });
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
            showAlert({
                title: "Başarılı",
                message: "Mekan ziyaret edildi olarak işaretlendi.",
                type: "success",
            });
        } catch (err) {
            showAlert({ title: "Hata", message: getApiErrorMessage(err), type: "danger" });
        } finally {
            setMarkingVisited(false);
        }
    };

    const handleDeletePlacePress = async () => {
        const ok = await confirm({
            title: "Mekanı Sil",
            message:
                "Bu mekanı tamamen silmek istediğinize emin misiniz? Fotoğraflar ve yorumlar da kalıcı olarak silinecektir.",
            type: "danger",
            confirmText: "Mekanı Sil",
            cancelText: "Vazgeç",
        });
        if (!ok) return;

        try {
            setLoading(true);
            await deletePlace(placeId);
            navigation.goBack();
        } catch (err) {
            setLoading(false);
            showAlert({ title: "Hata", message: getApiErrorMessage(err), type: "danger" });
        }
    };

    const actionOptions = [
        {
            label: "Mekanı Düzenle",
            icon: "create-outline",
            onPress: () => navigation.navigate("CreatePlace", { editPlaceId: placeId, placeData: detail })
        },
        {
            label: "Mekanı Sil",
            icon: "trash-outline",
            isDestructive: true,
            onPress: () => handleDeletePlacePress()
        },
    ];

    const handleDeletePhotoPress = async (photoId: string) => {
        const ok = await confirm({
            title: "Fotoğrafı Sil",
            message: "Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?",
            type: "danger",
            confirmText: "Sil",
            cancelText: "Vazgeç",
        });
        if (!ok) return;

        try {
            setLoading(true);
            await deletePlacePhoto(photoId);
            await load();
        } catch (err) {
            showAlert({ title: "Hata", message: getApiErrorMessage(err), type: "danger" });
            setLoading(false);
        }
    };
    const handleSaveCurrentPhoto = async () => {
        const currentPhotos = detail?.photos ?? [];
        const current = currentPhotos[viewerIndex];
        if (!current?.imageUrl) {
            showAlert({ title: "Hata", message: "Kaydedilecek fotoğraf bulunamadı.", type: "danger" });
            return;
        }

        try {
            setSavingPhoto(true);

            const permission = await MediaLibrary.requestPermissionsAsync();
            if (!permission.granted) {
                showAlert({
                    title: "İzin Gerekli",
                    message: "Fotoğrafı cihazına kaydetmek için galeri erişimine izin vermelisin.",
                    type: "info",
                });
                return;
            }

            const fileExtMatch = current.imageUrl.match(/\.(jpg|jpeg|png|heic|webp)(?:\?|$)/i);
            const ext = fileExtMatch ? fileExtMatch[1].toLowerCase() : "jpg";
            const fileName = `sm_${current.id ?? Date.now()}.${ext}`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            const downloadRes = await FileSystem.downloadAsync(current.imageUrl, fileUri);
            await MediaLibrary.saveToLibraryAsync(downloadRes.uri);

            showAlert({
                title: "Başarılı",
                message: "Fotoğraf cihazına kaydedildi.",
                type: "success",
            });
        } catch (err) {
            showAlert({
                title: "Hata",
                message: getApiErrorMessage(err) || "Fotoğraf kaydedilemedi.",
                type: "danger",
            });
        } finally {
            setSavingPhoto(false);
        }
    };

   const renderAccurateStars = (ratingOutOf10: number | null) => {
        // Puan yoksa 5 tane gri, boş yıldız göster
        if (ratingOutOf10 === null || ratingOutOf10 === 0) {
            return (
                <View style={{ flexDirection: "row", marginTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name="star-outline" size={16} color="#cbd5e1" style={{ marginRight: 2 }} />
                    ))}
                </View>
            );
        }

        // Puan varsa 5 üzerinden hesapla (Örn: 9/2 = 4.5)
        const ratingOutOf5 = ratingOutOf10 / 2;
        return (
            <View style={{ flexDirection: "row", marginTop: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => {
                    if (ratingOutOf5 >= i + 1) {
                        return <Ionicons key={i} name="star" size={16} color="#F59E0B" style={{ marginRight: 2 }} />;
                    } else if (ratingOutOf5 >= i + 0.5) {
                        return <Ionicons key={i} name="star-half" size={16} color="#F59E0B" style={{ marginRight: 2 }} />;
                    } else {
                        return <Ionicons key={i} name="star-outline" size={16} color="#F59E0B" style={{ marginRight: 2 }} />;
                    }
                })}
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

    return (
        <View style={styles.mainContainer}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* 1. KAPAK FOTOĞRAFI & BUTONLAR */}
                <View style={styles.headerCover}>
                    {photos && photos.length > 0 ? (
                        <>
                            <FlatList
                                ref={headerSliderRef}
                                data={photos}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item: any, index) => item.id ?? String(index)}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                                    setCurrentPhotoIndex(index);
                                }}
                                renderItem={({ item }: any) => (
                                    <Pressable
                                        onPress={() => {
                                            const index = photos.findIndex((p: any) => p.id === item.id);
                                            setViewerIndex(index >= 0 ? index : 0);
                                            setIsViewerVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            style={[styles.coverImage, { width: screenWidth }]}
                                            resizeMode="cover"
                                        />
                                    </Pressable>
                                )}
                            />

                            {photos.length > 1 && ( 
                                <>
                                    <TouchableOpacity
                                        style={[styles.sliderNavButton, styles.sliderNavLeft, { backgroundColor: ('rgba(213, 251, 253, 0.2)') }]}
                                        onPress={() => {
                                            const newIndex = Math.max(currentPhotoIndex - 1, 0);
                                            headerSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                            setCurrentPhotoIndex(newIndex);
                                        }}
                                    >
                                        <Ionicons name="chevron-back" size={22} color="#102a43" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.sliderNavButton, styles.sliderNavRight,{backgroundColor :('rgba(213, 251, 253, 0.2)')}]}
                                        onPress={() => {
                                            const newIndex = Math.min(currentPhotoIndex + 1, photos.length - 1);
                                            headerSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                            setCurrentPhotoIndex(newIndex);
                                        }}
                                    >
                                        <Ionicons name="chevron-forward" size={22} color="#102a43" />
                                    </TouchableOpacity>

                                    <View style={styles.paginationWrapper}>
                                        {photos.map((_: any, index: number) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.paginationDot,
                                                    currentPhotoIndex === index && styles.paginationDotActive
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={styles.noCoverPlaceholder}>
                            <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.noCoverText}>Henüz Fotoğraf Eklenmemiş</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.backTopButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#102a43" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionsButton} onPress={() => setIsActionSheetVisible(true)}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#102a43" />
                    </TouchableOpacity>
                </View>
                <CustomActionSheet 
                    visible={isActionSheetVisible}
                    onClose={() => setIsActionSheetVisible(false)}
                    title="Mekan Ayarları"
                    options={actionOptions}
                />
                {/* 2. ANA İÇERİK KARTI (Değişiklik yok) */}
                <View style={styles.contentCard}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>
                                {[city, category].filter(Boolean).join(" • ")}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("UploadPhoto", { placeId })}>
                            <View style={[styles.actionIconBox, { backgroundColor: "#e0f2fe" }]}><Ionicons name="camera" size={20} color="#0284c7" /></View>
                            <Text style={styles.actionBtnText} numberOfLines={1}> Fotoğraf Ekle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("EditReview", { placeId, review: currentUserReview ?? null })}>
                            <View style={[styles.actionIconBox, { backgroundColor: "#fef3c7" }]}><Ionicons name="star" size={20} color="#d97706" /></View>
                            <Text style={styles.actionBtnText} numberOfLines={1}>{currentUserReview ? "Yorumu Düzenle" : "Yorum Ekle"}</Text>
                        </TouchableOpacity>

                        {status !== 1 && (status as any) !== "Wishlist" && (
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() =>
                                    navigation.navigate("BillSplit", {
                                        placeId,
                                        groupId: detail?.groupId,
                                        placeTitle: detail?.title,
                                    })
                                }
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: "#ede9fe" }]}>
                                    <Ionicons name="calculator" size={20} color="#7c3aed" />
                                </View>
                                <Text style={styles.actionBtnText} numberOfLines={1}>Hesap Paylaş</Text>
                            </TouchableOpacity>
                        )}

                        {status === 1 && (
                            <TouchableOpacity style={styles.actionBtn} onPress={onMarkAsVisited} disabled={markingVisited}>
                                <View style={[styles.actionIconBox, { backgroundColor: "#dcfce7" }]}>
                                    {markingVisited ? <ActivityIndicator size="small" color="#16a34a" /> : <Ionicons name="checkmark-done" size={20} color="#16a34a" />}
                                </View>
                                <Text style={styles.actionBtnText} numberOfLines={1}>Ziyaret Ettik</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {(status === 1 || (status as any) === "Wishlist") && (
                        <WishDayRsvpCard
                            placeId={placeId}
                            onError={(msg) => showAlert({ title: "Hata", message: msg, type: "danger" })}
                        />
                    )}

                    <View style={styles.unifiedReviewCard}>
                        
                        {/* Üst Kısım: Puanlar (My Rate | Group Rate) */}
                        <View style={styles.unifiedRatesHeader}>
                            <View style={styles.rateColumn}>
                                <Text style={styles.rateLabel}>PUANIM</Text>
                                <Text style={styles.rateValue}>{myRating !== null ? myRating : "-"}</Text>
                                {renderAccurateStars(myRating)}
                            </View>
                            
                            <View style={styles.rateDivider} />
                            
                            <View style={styles.rateColumn}>
                                <Text style={styles.rateLabel}>GRUP PUANI</Text>
                                <Text style={styles.rateValue}>{groupAverage > 0 ? groupAverage.toFixed(1) : "-"}</Text>
                                {renderAccurateStars(groupAverage > 0 ? groupAverage : null)}
                            </View>
                        </View>

                        <View style={styles.unifiedLine} />

                        {/* Alt Kısım: Yorumlar Listesi */}
                        {!reviews.length ? (
                            <Text style={styles.noReviewText}>Bu mekan için henüz yorum yapılmamış.</Text>
                        ) : (
                            <View style={styles.unifiedReviewList}>
                                {reviews.map((review, index) => (
                                    <View 
                                        key={review.id} 
                                        style={[
                                            styles.unifiedReviewItem, 
                                            index === reviews.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }
                                        ]}
                                    >
                                        {/* Profil Fotoğrafı (Şimdilik İkon Placeholder) */}
                                        <View style={styles.reviewAvatar}>
                                            <Ionicons name="person" size={20} color="#94a3b8" />
                                        </View>
                                        
                                        {/* İçerik: İsim, Puan ve Yorum */}
                                        <View style={styles.reviewContent}>
                                            <View style={styles.reviewNameRow}>
                                                <Text style={styles.reviewName}>
                                                    {review.userName || review.userName || "Kullanıcı"}
                                                </Text>
                                                
                                                {/* Sağ Üstteki Sarı Puan Kutucuğu */}
                                                <View style={styles.reviewStarBadge}>
                                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                                    <Text style={styles.reviewStarText}>{review.rating}</Text>
                                                </View>
                                            </View>
                                            
                                            {/* Yorum Metni */}
                                            {review.comment ? (
                                                <Text style={styles.reviewCommentText}>{review.comment}</Text>
                                            ) : (
                                                <Text style={[styles.reviewCommentText, { fontStyle: "italic", color: "#cbd5e1" }]}>Yorum bırakılmamış.</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                    {Platform.OS !== "web" && latitude && longitude && MapView && (
                       <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Fotoğraflar</Text>
                        {!photos.length ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyCardText}>Henüz fotoğraf eklenmemiş. İlk fotoğrafı yükleyin!</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginHorizontal: -24, paddingHorizontal: 24 }}
                            >
                                {photos.map((photo: any, i: number) => (
                                    <Pressable
                                        key={photo.id ?? i}
                                        onPress={() => {
                                            setViewerIndex(i);
                                            setIsViewerVisible(true);
                                        }}
                                        style={styles.galleryItemWrapper}
                                    >
                                        <Image source={{ uri: photo.imageUrl }} style={styles.galleryImage} />

                                        <TouchableOpacity
                                            style={styles.deletePhotoButton}
                                            onPress={() => handleDeletePhotoPress(photo.id)}
                                        >
                                            <Ionicons name="close" size={14} color="#ffffff" />
                                        </TouchableOpacity>
                                    </Pressable>
                                ))}
                                <View style={{ width: 24 }} />
                            </ScrollView>
                        )}
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
                            <Ionicons name="person-sharp" size={20} color="#64748b" style={styles.infoIcon} />
                            <Text style={styles.infoText}><Text style={{ fontWeight: "700", color: "#102a43" }}>{createdByName || "Unknown"} Ekledi</Text></Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-sharp" size={20} color="#986c64" style={styles.infoIcon} />
                            <Text style={[styles.infoText,{ color: "#986c64", fontWeight: "600" }]}>{formatDate(createdAt)} Tarihinde Eklendi</Text>
                        </View>
                        {!!visitDate && (
                            <View style={styles.infoRow}>
                                <Ionicons name="flag-sharp" size={20} color="#136d34a2" style={styles.infoIcon} />
                                <Text style={[styles.infoText, { color: "#136d34a2", fontWeight: "600" }]}>
                                    {formatDate(visitDate)} Tarihinde {status === 1 ? "Planlandı" : "Gidildi"}
                                </Text>                            
                            </View>
                        )}
                    </View>

                </View>
                <Modal
                    visible={isViewerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        setIsViewerVisible(false);
                        setIsPhotoZoomed(false);
                    }}
                >
                    <View style={styles.viewerOverlay}>
                        <View style={styles.viewerTopBar}>
                            <TouchableOpacity
                                style={styles.viewerTopButton}
                                onPress={() => {
                                    setIsViewerVisible(false);
                                    setIsPhotoZoomed(false);
                                }}
                            >
                                <Ionicons name="close" size={26} color="#ffffff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewerTopButton}
                                onPress={handleSaveCurrentPhoto}
                                disabled={savingPhoto}
                            >
                                {savingPhoto ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Ionicons name="download-outline" size={24} color="#ffffff" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {photos.length > 0 && (
                            <FlatList
                                ref={viewerSliderRef}
                                data={photos}
                                horizontal
                                pagingEnabled
                                scrollEnabled={!isPhotoZoomed}
                                initialScrollIndex={viewerIndex}
                                getItemLayout={(_, index) => ({
                                    length: screenWidth,
                                    offset: screenWidth * index,
                                    index,
                                })}
                                keyExtractor={(item: any, index) => item.id ?? String(index)}
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                                    setViewerIndex(index);
                                    setIsPhotoZoomed(false);
                                }}
                                renderItem={({ item }: any) => (
                                    <View style={[styles.viewerImageWrapper, { width: screenWidth }]}>
                                        <ZoomableImage
                                            uri={item.imageUrl}
                                            width={screenWidth}
                                            height={screenHeight * 0.78}
                                            onZoomStateChange={setIsPhotoZoomed}
                                        />
                                    </View>
                                )}
                            />
                        )}

                        {photos.length > 1 && (
                            <>
                                <TouchableOpacity
                                    style={[styles.viewerNavButton, styles.viewerNavLeft]}
                                    onPress={() => {
                                        const newIndex = Math.max(viewerIndex - 1, 0);
                                        viewerSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                        setViewerIndex(newIndex);
                                    }}
                                >
                                    <Ionicons name="chevron-back" size={28} color="#ffffff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.viewerNavButton, styles.viewerNavRight]}
                                    onPress={() => {
                                        const newIndex = Math.min(viewerIndex + 1, photos.length - 1);
                                        viewerSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                        setViewerIndex(newIndex);
                                    }}
                                >
                                    <Ionicons name="chevron-forward" size={28} color="#ffffff" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Modal>
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
    backTopButton: {
        position: "absolute", top: Platform.OS === "ios" ? 50 : 30, left: 20,
        backgroundColor: "rgba(255,255,255,0.9)", width: 44, height: 44,
        borderRadius: 22, justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
    },
    sliderNavButton: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5
    },
    sliderNavLeft: {
        left: 16
    },
    sliderNavRight: {
        right: 16
    },
    paginationWrapper: {
        position: "absolute",
        bottom: 18,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.5)",
        marginHorizontal: 4
    },
    paginationDotActive: {
        backgroundColor: "#ffffff",
        width: 18
    },
    galleryItemWrapper: {
        position: "relative",
        marginRight: 12
    },
    deletePhotoButton: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(239,68,68,0.95)",
        justifyContent: "center",
        alignItems: "center"
    },
    
    // --- YENİ EKLENEN VEYA GÜNCELLENEN STİLLER ---
    scoreCard: { 
        flexDirection: "row", 
        backgroundColor: "white", 
        marginTop: 28, 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 10, 
        elevation: 2 
    },
    scoreBox: { flex: 1, alignItems: "center", justifyContent: "center" },
    scoreDivider: { width: 1, backgroundColor: "#f1f5f9", marginHorizontal: 10 },
    scoreLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
    scoreValueRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 2 },
    scoreValue: { fontSize: 32, fontWeight: "900", color: "#0f172a" },
    scoreMax: { fontSize: 15, fontWeight: "700", color: "#94a3b8", marginLeft: 2 },
    noScoreText: { fontSize: 12, color: "#94a3b8", marginTop: 4, fontStyle: "italic" },
// --- BİRLEŞTİRİLMİŞ YORUM KARTI STİLLERİ ---
    unifiedReviewCard: {
        backgroundColor: "white",
        marginTop: 28,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    unifiedRatesText: {
        fontSize: 15,
        color: "#64748b",
        fontWeight: "600",
    },
    unifiedRatesBold: {
        color: "#102a43",
        fontWeight: "800",
        fontSize: 16,
    },
    unifiedRatesDivider: {
        color: "#cbd5e1",
        fontWeight: "400",
    },
    unifiedLine: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginBottom: 16,
    },
    noReviewText: {
        color: "#94a3b8",
        fontStyle: "italic",
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 10,
    },
    unifiedReviewList: {
        flexDirection: "column",
    },
    unifiedReviewItem: {
        flexDirection: "row",
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f8fafc",
    },
    reviewAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    reviewContent: {
        flex: 1,
        justifyContent: "center",
    },
    reviewNameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    reviewName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#102a43",
    },
    reviewStarBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
    },
    reviewStarText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#d97706",
        marginLeft: 4,
    },
    reviewCommentText: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 20,
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.96)",
        justifyContent: "center",
        alignItems: "center"
    },
    unifiedRatesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    rateColumn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    rateDivider: {
        width: 1,
        height: 44, // İki sütun arasındaki dikey çizginin boyu
        backgroundColor: "#e2e8f0",
    },
    rateLabel: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    rateValue: {
        fontSize: 28, 
        fontWeight: "900",
        color: "#102a43",
    },

    viewerTopBar: {
        position: "absolute",
        top: Platform.OS === "ios" ? 56 : 26,
        right: 20,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    viewerTopButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    viewerImageWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    viewerImage: {
        width: "100%",
        height: "78%"
    },
    viewerNavButton: {
        position: "absolute",
        top: "50%",
        marginTop: -24,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.16)",
        justifyContent: "center",
        alignItems: "center"
    },
    viewerNavLeft: {
        left: 16
    },
    viewerNavRight: {
        right: 16
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