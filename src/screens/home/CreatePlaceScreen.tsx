import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../../api/client";
import { updatePlace } from "../../api/places";
import { createReview } from "../../api/reviews";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { getApiErrorMessage } from "../../utils/helpers";

const FormField = ({ icon, placeholder, value, onChangeText, multiline = false, keyboardType = "default", flex = undefined }: any) => (
    <View style={{ flex: flex, flexDirection: "row", alignItems: multiline ? "flex-start" : "center", backgroundColor: "#f8fafc", borderRadius: 14, paddingHorizontal: 14, paddingVertical: multiline ? 12 : 4, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" }}>
        <Ionicons name={icon} size={18} color="#94a3b8" style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} />
        <TextInput
            placeholder={placeholder} placeholderTextColor="#94a3b8"
            value={value} onChangeText={onChangeText}
            multiline={multiline} keyboardType={keyboardType}
            style={{ flex: 1, fontSize: 14, color: "#102a43", height: multiline ? 80 : 40, textAlignVertical: multiline ? "top" : "center" }}
        />
    </View>
);

const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.trim().split(" ").map(word => {
        if (word.length === 0) return "";
        return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
    }).join(" ");
};

export default function CreatePlaceScreen({ navigation, route }: any) {
    const { selectedGroupId } = useSelectedGroup();
    
    const editPlaceId = route.params?.editPlaceId;
    const placeData = route.params?.placeData;
    const initialStatus = route.params?.initialStatus || 1; 

    const isVisitedPlace = editPlaceId ? (placeData?.status === 2 || placeData?.visitDate) : (initialStatus === 2);
    
    const [title, setTitle] = useState(placeData?.title || "");
    const [category, setCategory] = useState(placeData?.category || "");
    const [city, setCity] = useState(placeData?.city || "");
    const [address, setAddress] = useState(placeData?.address || "");
    const [latitude, setLatitude] = useState(placeData?.latitude ? String(placeData.latitude) : "");
    const [longitude, setLongitude] = useState(placeData?.longitude ? String(placeData.longitude) : "");
    const formattedInitialDate = placeData?.visitDate ? new Date(placeData.visitDate).toISOString().split('T')[0] : "";
    const [visitDate, setVisitDate] = useState(formattedInitialDate);

    const [score, setScore] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [wouldGoAgain, setWouldGoAgain] = useState<boolean>(true);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [predictions, setPredictions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const typingTimeoutRef = useRef<any>(null);

    const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. ARAMA İŞLEMİ
    const fetchPredictions = async (input: string) => {
        if (!input || input.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': API_KEY || "",
                },
                body: JSON.stringify({ input: input, languageCode: 'tr' })
            });

            const data = await response.json();
            
            if (data.suggestions) {
                setPredictions(data.suggestions.map((s: any) => ({
                    // ÇÖZÜM: Google'dan gelen ID'nin başındaki "places/" kelimesini temizliyoruz!
                    placeId: s.placePrediction.placeId || s.placePrediction.place.replace('places/', ''),
                    text: s.placePrediction.text.text,
                    mainText: s.placePrediction.structuredFormat.mainText.text,
                    secondaryText: s.placePrediction.structuredFormat.secondaryText?.text || ''
                })));
                setShowDropdown(true);
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error("Autocomplete Error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { fetchPredictions(text); }, 500); 
    };

    // 2. DETAY GETİRME İŞLEMİ
    const handleSelectPrediction = async (placeId: string, mainText: string) => {
        setSearchQuery(mainText);
        setShowDropdown(false);
        setIsSearching(true);

        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`, {
                method: 'GET',
                headers: {
                    'X-Goog-Api-Key': API_KEY || "",
                    'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents,types'
                }
            });

            // ÇÖZÜM: JSON dönüşümünden önce Google ne göndermiş diye Düz Metin (Text) olarak okuyoruz
            const rawText = await response.text();

            if (!response.ok) {
                console.error("🚨 GOOGLE API DETAY HATASI: ", rawText);
                Alert.alert("Hata", "Mekan detayları alınırken bir sorun oluştu.");
                setIsSearching(false);
                return; // JSON.parse yapmadan fonksiyondan çıkıyoruz ki uygulama çökmesin
            }

            // Eğer hata yoksa metni JSON'a güvenle çeviriyoruz
            const details = JSON.parse(rawText);

            setTitle(details.displayName?.text ? toTitleCase(details.displayName.text) : mainText);
            setAddress(details.formattedAddress || "");
            
            if (details.location) {
                setLatitude(String(details.location.latitude));
                setLongitude(String(details.location.longitude));
            }

            if (details.addressComponents) {
                const cityComponent = details.addressComponents.find((c: any) => 
                    c.types.includes("administrative_area_level_1") || c.types.includes("locality")
                );
                if (cityComponent) setCity(toTitleCase(cityComponent.longText));
            }

            if (details.types && details.types.length > 0) {
                const rawCategory = details.types[0].replace(/_/g, " ");
                setCategory(toTitleCase(rawCategory));
            }

        } catch (error) {
            console.error("Place Details Error:", error);
            Alert.alert("Hata", "Mekan detayları okunamadı.");
        } finally {
            setIsSearching(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 5,
        });
        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setSelectedImages(prev => [...prev, ...newUris]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Hata", "Lütfen bir mekan seçin veya başlık girin.");
            return;
        }

        const formattedTitle = toTitleCase(title);
        const formattedCity = toTitleCase(city);
        const formattedCategory = toTitleCase(category);

        let finalVisitDate = null;
        if (isVisitedPlace) {
            if (visitDate.trim() !== "") {
                const dateObj = new Date(visitDate.trim());
                if (!isNaN(dateObj.getTime())) {
                    finalVisitDate = dateObj.toISOString();
                } else {
                    Alert.alert("Uyarı", "Geçerli bir tarih formatı girin (Örn: 2024-05-20) veya bugünü seçmek için boş bırakın.");
                    return;
                }
            } else {
                finalVisitDate = new Date().toISOString();
            }
        }

        try {
            setIsSaving(true);
            let createdPlaceId = editPlaceId;
            
            if (editPlaceId) {
                await updatePlace(editPlaceId, {
                    title: formattedTitle, category: formattedCategory, city: formattedCity, address,
                    latitude: latitude ? parseFloat(latitude) : 0, longitude: longitude ? parseFloat(longitude) : 0,
                    visitDate: finalVisitDate, description: placeData?.description 
                });
            } else {
                if (!selectedGroupId) { Alert.alert("Hata", "Lütfen bir grup seçin."); return; }
                const payload: any = {
                    groupId: selectedGroupId, title: formattedTitle, category: formattedCategory, city: formattedCity, address,
                    latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null,
                    status: initialStatus 
                };
                if (initialStatus === 2) payload.visitDate = finalVisitDate; 

                const response = await api.post("/Places/CreatePlace", payload);
                createdPlaceId = response.data.data.id; 
            }

            if (isVisitedPlace && score > 0 && createdPlaceId) {
                await createReview({ placeId: createdPlaceId, rating: score, comment, wouldGoAgain });
            }

            if (isVisitedPlace && selectedImages.length > 0 && createdPlaceId) {
                for (const uri of selectedImages) {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                        name: `photo_${Date.now()}.jpg`, type: 'image/jpeg'
                    } as any);
                    formData.append('placeId', createdPlaceId);
                    await api.post("/PlacePhotos/Upload", formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                }
            }

            Alert.alert("Başarılı", `Mekan kaydedildi!`);
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground source={require("../../../assets/images/home-bg.png")} resizeMode="cover" style={{ flex: 1, width: "100%", height: "100%" }}>
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.85)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                            
                            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                                <Pressable onPress={() => navigation.goBack()} style={{ backgroundColor: "#ffffff", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                                    <Ionicons name="arrow-back" size={20} color="#102a43" />
                                </Pressable>
                                <View style={{ marginLeft: 16 }}>
                                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#102a43" }}>
                                        {editPlaceId ? "Edit Memory" : "New Memory"}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500" }}>
                                        {isVisitedPlace ? "Log your experience" : "Add to wishlist"}
                                    </Text>
                                </View>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                                
                                {!editPlaceId && (
                                    <View style={{ zIndex: 9999, marginBottom: 20 }}>
                                        <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 12 }}>Search Place</Text>
                                            
                                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: "#e2e8f0" }}>
                                                <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    placeholder="Search a cafe, restaurant, park..."
                                                    placeholderTextColor="#94a3b8"
                                                    value={searchQuery}
                                                    onChangeText={handleSearchChange}
                                                    style={{ flex: 1, height: 48, fontSize: 14, color: "#102a43" }}
                                                />
                                                {isSearching && <ActivityIndicator size="small" color="#2F7E8D" />}
                                                {searchQuery.length > 0 && !isSearching && (
                                                    <TouchableOpacity onPress={() => { setSearchQuery(""); setPredictions([]); setShowDropdown(false); }}>
                                                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        {showDropdown && predictions.length > 0 && (
                                            <View style={{ position: "absolute", top: 105, left: 0, right: 0, backgroundColor: "white", borderRadius: 16, padding: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 10000 }}>
                                                {predictions.map((item, index) => (
                                                    <TouchableOpacity 
                                                        key={item.placeId} 
                                                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: index === predictions.length - 1 ? 0 : 1, borderBottomColor: "#f1f5f9" }}
                                                        onPress={() => handleSelectPrediction(item.placeId, item.mainText)}
                                                    >
                                                        <View style={{ backgroundColor: "#f1f5f9", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                                                            <Ionicons name="location" size={18} color="#2F7E8D" />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#102a43" }}>{item.mainText}</Text>
                                                            {item.secondaryText ? <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }} numberOfLines={1}>{item.secondaryText}</Text> : null}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, zIndex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 16 }}>Basic Details</Text>
                                    <FormField icon="business-outline" placeholder="Place Title" value={title} onChangeText={setTitle} />
                                    <FormField icon="list-outline" placeholder="Category" value={category} onChangeText={setCategory} />
                                    <FormField icon="map-outline" placeholder="City" value={city} onChangeText={setCity} />
                                </View>

                                {isVisitedPlace && (
                                    <>
                                        <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 16 }}>Visit Date</Text>
                                            <FormField icon="calendar-outline" placeholder="YYYY-MM-DD (Leave empty for today)" value={visitDate} onChangeText={setVisitDate} />
                                        </View>

                                        <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43" }}>Photos</Text>
                                                <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#e0f2fe", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                                    <Text style={{ color: "#0284c7", fontWeight: "700", fontSize: 12 }}>+ Add Photos</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {selectedImages.length > 0 ? (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                                    {selectedImages.map((uri, index) => (
                                                        <View key={index} style={{ position: "relative" }}>
                                                            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 16 }} />
                                                            <TouchableOpacity onPress={() => removeImage(index)} style={{ position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", borderRadius: 12, width: 24, height: 24, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "white" }}>
                                                                <Ionicons name="close" size={14} color="white" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                </ScrollView>
                                            ) : (
                                                <Text style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>No photos selected yet.</Text>
                                            )}
                                        </View>

                                        {!editPlaceId && (
                                            <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43" }}>Quick Review (Optional)</Text>
                                                    {score > 0 && (
                                                        <View style={{ backgroundColor: "#FFFBEB", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                            <Text style={{ fontSize: 14, fontWeight: "800", color: "#D97706" }}>{score} / 10</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                                                    {[1, 2, 3, 4, 5].map((index) => {
                                                        const starValue = index * 2; 
                                                        let iconName: any = "star-outline";
                                                        if (score >= starValue) iconName = "star";
                                                        else if (score === starValue - 1) iconName = "star-half";

                                                        return (
                                                            <View key={index} style={{ position: "relative" }}>
                                                                <Ionicons name={iconName} size={36} color={score >= starValue - 1 ? "#F59E0B" : "#e2e8f0"} />
                                                                <TouchableOpacity style={{ position: "absolute", left: 0, width: "50%", height: "100%" }} onPress={() => setScore(starValue - 1)} activeOpacity={1} />
                                                                <TouchableOpacity style={{ position: "absolute", right: 0, width: "50%", height: "100%" }} onPress={() => setScore(starValue)} activeOpacity={1} />
                                                            </View>
                                                        );
                                                    })}
                                                </View>

                                                <FormField icon="chatbubble-outline" placeholder="Write your experience..." value={comment} onChangeText={setComment} multiline={true} />
                                            </View>
                                        )}
                                    </>
                                )}

                                <Pressable
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    style={{ backgroundColor: "#2F7E8D", borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, opacity: isSaving ? 0.7 : 1, marginTop: 10 }}
                                >
                                    {isSaving ? <ActivityIndicator color="white" /> : <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>{editPlaceId ? "Save Changes" : "Confirm & Save All"}</Text>}
                                </Pressable>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}