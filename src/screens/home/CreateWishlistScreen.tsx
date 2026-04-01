import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function CreateWishlistScreen({ navigation, route }: any) {
    const { selectedGroupId } = useSelectedGroup();
    
    const editPlaceId = route.params?.editPlaceId;
    const placeData = route.params?.placeData;
    
    // YENİ: Takvimden "defaultDate" parametresi gelirse onu başlangıç tarihi yap
    const defaultDate = route.params?.defaultDate || "";
    const formattedInitialDate = placeData?.visitDate ? new Date(placeData.visitDate).toISOString().split('T')[0] : defaultDate;

    const [title, setTitle] = useState(placeData?.title || "");
    const [category, setCategory] = useState(placeData?.category || "");
    const [city, setCity] = useState(placeData?.city || "");
    const [address, setAddress] = useState(placeData?.address || "");
    const [latitude, setLatitude] = useState(placeData?.latitude ? String(placeData.latitude) : "");
    const [longitude, setLongitude] = useState(placeData?.longitude ? String(placeData.longitude) : "");
    const [visitDate, setVisitDate] = useState(formattedInitialDate);
    const [description, setDescription] = useState(placeData?.description || "");

    const [isSaving, setIsSaving] = useState(false);

    // Google Arama State'leri
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
            const formattedPredictions = data.suggestions.map((suggestionItem: any) => {
                // 's' yerine daha açık bir isim verelim ve her basamağı kontrol edelim
                const prediction = suggestionItem.placePrediction;
                
                if (!prediction) return null; // Eğer prediction objesi yoksa atla

                return {
                    placeId: prediction.placeId || prediction.place?.replace('places/', '') || '',
                    text: prediction.text?.text || '',
                    mainText: prediction.structuredFormat?.mainText?.text || 'Bilinmeyen Mekan',
                    secondaryText: prediction.structuredFormat?.secondaryText?.text || ''
                };
            }).filter(Boolean); // null olanları listeden temizle

            setPredictions(formattedPredictions);
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

            const rawText = await response.text();

            if (!response.ok) {
                Alert.alert("Hata", "Mekan detayları alınırken bir sorun oluştu.");
                setIsSearching(false);
                return;
            }

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
            Alert.alert("Hata", "Mekan detayları okunamadı.");
        } finally {
            setIsSearching(false);
        }
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
        if (visitDate.trim() !== "") {
            const dateObj = new Date(visitDate.trim());
            if (!isNaN(dateObj.getTime())) {
                finalVisitDate = dateObj.toISOString();
            } else {
                Alert.alert("Uyarı", "Geçerli bir tarih formatı girin (Örn: 2024-05-20) veya tarihi boş bırakın.");
                return;
            }
        }

        try {
            setIsSaving(true);
            
            if (editPlaceId) {
                await updatePlace(editPlaceId, {
                    title: formattedTitle, category: formattedCategory, city: formattedCity, address,
                    latitude: latitude ? parseFloat(latitude) : 0, longitude: longitude ? parseFloat(longitude) : 0,
                    visitDate: finalVisitDate, description
                });
            } else {
                if (!selectedGroupId) { Alert.alert("Hata", "Lütfen bir grup seçin."); return; }
                const payload: any = {
                    groupId: selectedGroupId, title: formattedTitle, category: formattedCategory, city: formattedCity, address,
                    latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null,
                    status: 1, // DİKKAT: Wishlist (Plan) statüsü her zaman 1'dir.
                    visitDate: finalVisitDate,
                    description
                };

                await api.post("/Places/CreatePlace", payload);
            }

            Alert.alert("Başarılı", `Wish Day planı kaydedildi!`);
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* YENİ: İstenilen ferahlatılmış Wishlist Arka Planı */}
            <ImageBackground source={require("../../../assets/images/home-bg.png")} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.75)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                            
                            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                                <Pressable onPress={() => navigation.goBack()} style={{ backgroundColor: "#ffffff", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                                    <Ionicons name="arrow-back" size={20} color="#102a43" />
                                </Pressable>
                                <View style={{ marginLeft: 16 }}>
                                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#fcbebe" }}>
                                        {editPlaceId ? "Edit Wish Day" : "Plan a Wish Day"}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500" }}>
                                        Add a new place to your future plans
                                    </Text>
                                </View>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                                
                                {!editPlaceId && (
                                    <View style={{ zIndex: 9999, marginBottom: 20 }}>
                                        <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 12 }}>Search Place</Text>
                                            
                                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: "#fecaca" }}>
                                                <Ionicons name="search" size={18} color="#f87171" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    placeholder="Search a place to visit..."
                                                    placeholderTextColor="#f87171"
                                                    value={searchQuery}
                                                    onChangeText={handleSearchChange}
                                                    style={{ flex: 1, height: 48, fontSize: 14, color: "#102a43" }}
                                                />
                                                {isSearching && <ActivityIndicator size="small" color="#f87171" />}
                                                {searchQuery.length > 0 && !isSearching && (
                                                    <TouchableOpacity onPress={() => { setSearchQuery(""); setPredictions([]); setShowDropdown(false); }}>
                                                        <Ionicons name="close-circle" size={18} color="#f87171" />
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
                                                        <View style={{ backgroundColor: "#fef2f2", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                                                            <Ionicons name="heart" size={18} color="#f87171" />
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
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 16 }}>Details</Text>
                                    <FormField icon="business-outline" placeholder="Place Title" value={title} onChangeText={setTitle} />
                                    <FormField icon="list-outline" placeholder="Category" value={category} onChangeText={setCategory} />
                                    <FormField icon="map-outline" placeholder="City" value={city} onChangeText={setCity} />
                                </View>

                                <View style={{ backgroundColor: "#ffffff", padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43", marginBottom: 16 }}>Planlama (İsteğe Bağlı)</Text>
                                    <FormField icon="calendar-outline" placeholder="Planlanan Tarih (YYYY-MM-DD)" value={visitDate} onChangeText={setVisitDate} />
                                    <FormField icon="document-text-outline" placeholder="Notlar veya beklentileriniz..." value={description} onChangeText={setDescription} multiline={true} />
                                </View>

                                <Pressable
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    // Buton Rengi Wishlist'e uygun pembe/kırmızı tonlarında güncellendi
                                    style={{ backgroundColor: "#fcbebe", borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#fcbebe", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6, opacity: isSaving ? 0.7 : 1, marginTop: 10 }}
                                >
                                    {isSaving ? <ActivityIndicator color="white" /> : <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>{editPlaceId ? "Değişiklikleri Kaydet" : "Wish Day Planını Kaydet"}</Text>}
                                </Pressable>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}