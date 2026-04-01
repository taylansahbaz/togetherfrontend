import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// YENİ: Artık sadece seçili grubu değil, tüm takvimi getiren fonksiyonu kullanıyoruz
import { getMyCalendarPlaces } from "../../api/places";
import { getApiErrorMessage } from "../../utils/helpers";

LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

// Open-Meteo hava durumu kodlarını İkonlara çeviren yardımcı fonksiyon
const getWeatherDetails = (weatherCode: number) => {
    if (weatherCode === 0) return { icon: "sunny", color: "#fcbebe", text: "Açık" };
    if (weatherCode >= 1 && weatherCode <= 3) return { icon: "partly-sunny", color: "#64748b", text: "Parçalı Bulutlu" };
    if (weatherCode >= 45 && weatherCode <= 48) return { icon: "cloud", color: "#94a3b8", text: "Sisli" };
    if (weatherCode >= 51 && weatherCode <= 67) return { icon: "rainy", color: "#3b82f6", text: "Yağmurlu" };
    if (weatherCode >= 71 && weatherCode <= 77) return { icon: "snow", color: "#0ea5e9", text: "Karlı" };
    if (weatherCode >= 95) return { icon: "thunderstorm", color: "#6366f1", text: "Fırtınalı" };
    return { icon: "cloud-outline", color: "#64748b", text: "Bilinmiyor" };
};

export default function CalendarScreen({ navigation }: any) {
    // any kullanarak yeni eklenen groupColor'ın TypeScript hatası vermesini engelliyoruz
    const [places, setPlaces] = useState<any[]>([]); 
    const [loading, setLoading] = useState(false);
    
    const todayStr = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Hava durumu state'leri
    const [weather, setWeather] = useState<any>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    const loadPlaces = async () => {
        try {
            setLoading(true);
            // YENİ: Backend'den tüm mekanları çekiyoruz
            const data = await getMyCalendarPlaces();
            const placesArray = Array.isArray(data) ? data : (data?.data || []);
            setPlaces(placesArray);
        } catch (err: any) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadPlaces(); }, []));

    const selectedDayPlaces = useMemo(() => {
        return places.filter(place => place.visitDate && place.visitDate.split('T')[0] === selectedDate);
    }, [places, selectedDate]);

    // Seçili gün değiştiğinde Open-Meteo'dan hava durumunu çeken Hook
    useEffect(() => {
        const fetchWeather = async () => {
            setLoadingWeather(true);
            setWeather(null);

            try {
                let lat = 41.0082; // İstanbul Latitude
                let lng = 28.9784; // İstanbul Longitude

                if (selectedDayPlaces.length > 0) {
                    const placeWithLocation = selectedDayPlaces.find(p => p.latitude && p.longitude);
                    if (placeWithLocation) {
                        lat = placeWithLocation.latitude!;
                        lng = placeWithLocation.longitude!;
                    }
                }

                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max&timezone=auto&start_date=${selectedDate}&end_date=${selectedDate}`;
                
                const response = await fetch(url);
                const data = await response.json();

                if (data && data.daily && data.daily.temperature_2m_max) {
                    const temp = Math.round(data.daily.temperature_2m_max[0]);
                    const code = data.daily.weathercode[0];
                    setWeather({ temp, ...getWeatherDetails(code) });
                }
            } catch (error) {
                console.log("Hava durumu çekilemedi:", error);
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeather();
    }, [selectedDate, places]);

    const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground source={require("../../../assets/images/home-bg.png")} resizeMode="cover" style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.9)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                            <View>
                                <Text style={{ fontSize: 32, fontWeight: "800", color: "#102a43", marginTop: 4 }}>
                                    Takvimim
                                </Text>
                            </View>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#2F7E8D" style={{ marginTop: 50 }} />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                                
                                <View style={{ marginHorizontal: 20, marginTop: 10, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                                    <Calendar
                                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                                        theme={{
                                            backgroundColor: '#ffffff', calendarBackground: '#ffffff',
                                            textSectionTitleColor: '#64748b', todayTextColor: '#2F7E8D',
                                            dayTextColor: '#102a43', textDisabledColor: '#cbd5e1',
                                            arrowColor: '#2F7E8D', monthTextColor: '#102a43',
                                            textDayFontWeight: '500', textMonthFontWeight: '800',
                                            textDayHeaderFontWeight: '600', textDayFontSize: 15, textMonthFontSize: 18,
                                        }}
                                        // YENİ: MARKED DATES YERİNE KENDİ TASARIMIMIZI ÇİZİYORUZ
                                        dayComponent={({ date, state }: any) => {
                                            const dayPlaces = places.filter(p => p.visitDate && p.visitDate.split('T')[0] === date.dateString);
                                            const isSelected = selectedDate === date.dateString;
                                            
                                            if (dayPlaces.length > 0) {
                                                const firstEvent = dayPlaces[0]; 
                                                const isVisited = firstEvent.status === 2 || firstEvent.status === "Visited"; 
                                                const groupColor = firstEvent.groupColor || "#2F7E8D"; // Dinamik Renk

                                                return (
                                                    <Pressable onPress={() => setSelectedDate(date.dateString)}>
                                                        <View style={[{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 }, isSelected && { borderWidth: 2, borderColor: '#102a43' }]}>
                                                            {isVisited ? (
                                                                // GİDİLEN: Yuvarlak
                                                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: groupColor, alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{date.day}</Text>
                                                                </View>
                                                            ) : (
                                                                // PLAN: Kalp
                                                                <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Ionicons name="heart" size={38} color={groupColor} style={{ position: 'absolute' }} />
                                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, zIndex: 1, marginTop: -2 }}>{date.day}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </Pressable>
                                                );
                                            }

                                            // BOŞ GÜNLER
                                            return (
                                                <Pressable onPress={() => setSelectedDate(date.dateString)}>
                                                    <View style={[{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }, isSelected && { backgroundColor: 'rgba(47, 126, 141, 0.1)', borderWidth: 1, borderColor: '#2F7E8D' }]}>
                                                        <Text style={{ color: state === 'disabled' ? '#cbd5e1' : '#102a43', fontWeight: isSelected ? 'bold' : 'normal' }}>
                                                            {date.day}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        }}
                                    />
                                </View>

                                {/* YENİ: BİLGİLENDİRME (LEGEND) KISMI ŞEKİLLERE GÖRE GÜNCELLENDİ */}
                                <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16, marginBottom: 20 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Ionicons name="ellipse" size={14} color="#2F7E8D" />
                                        <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Gidilenler</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Ionicons name="heart" size={16} color="#2F7E8D" />
                                        <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Wish Day (Planlar)</Text>
                                    </View>
                                </View>

                                {/* GÜNÜN BİLGİLERİ VE HAVA DURUMU */}
                                <View style={{ paddingHorizontal: 24 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <Text style={{ fontSize: 18, fontWeight: "800", color: "#102a43", flex: 1 }}>
                                            {formattedSelectedDate}
                                        </Text>

                                        {loadingWeather ? (
                                            <ActivityIndicator size="small" color="#94a3b8" />
                                        ) : weather ? (
                                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                                                <Ionicons name={weather.icon} size={18} color={weather.color} style={{ marginRight: 6 }} />
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#102a43" }}>
                                                    {weather.temp}°C
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {selectedDayPlaces.length === 0 ? (
                                        <View style={{ backgroundColor: "rgba(255,255,255,0.6)", padding: 24, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" }}>
                                            <Ionicons name="calendar-clear-outline" size={32} color="#94a3b8" style={{ marginBottom: 10 }} />
                                            <Text style={{ color: "#64748b", fontSize: 15, textAlign: "center", fontWeight: "500" }}>
                                                Bu tarihte henüz bir planınız veya anınız yok.
                                            </Text>
                                        </View>
                                    ) : (
                                        selectedDayPlaces.map(place => {
                                            const isVisited = place.status === 2 || place.status === "Visited";
                                            const groupColor = place.groupColor || "#2F7E8D"; // Liste rengi de dinamik

                                            return (
                                                <Pressable 
                                                    key={place.id}
                                                    onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}
                                                    style={{ 
                                                        flexDirection: "row", backgroundColor: "#ffffff", borderRadius: 20, padding: 16, marginBottom: 12, 
                                                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                                                        borderLeftWidth: 5, borderLeftColor: groupColor // Kenarlık rengi dinamik
                                                    }}
                                                >
                                                    <View style={{ backgroundColor: `${groupColor}20`, width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                                                        <Ionicons name={isVisited ? "checkmark-done" : "star"} size={24} color={groupColor} />
                                                    </View>
                                                    <View style={{ flex: 1, justifyContent: "center" }}>
                                                        <Text style={{ fontSize: 16, fontWeight: "800", color: "#102a43" }} numberOfLines={1}>
                                                            {place.title}
                                                        </Text>
                                                        {/* SENİN EKLENTİN: Şehir ve Kategori Birlikte */}
                                                        <Text style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                                                            {place.city ? `${place.city} • ` : ''}{place.category}
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={{ alignSelf: "center" }} />
                                                </Pressable>
                                            );
                                        })
                                    )}
                                </View>
                                <View style={styles.quickActionContainer}>
                                <TouchableOpacity 
                                    style={[styles.quickActionButton, { backgroundColor: "#50d7e0e1" }]} 
                                    // Yönlendirme isimlerini kendi navigasyonuna göre ayarlayabilirsin
                                    onPress={() => navigation.navigate("CreatePlace", { defaultDate: selectedDate , initialStatus: 2})}
                                >
                                    <Ionicons name="location" size={20} color="#252f9c" />
                                    <Text style={styles.quickActionText}>Mekan Ekle</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.quickActionButton, { backgroundColor: "#fcbebe" }]} 
                                    onPress={() => navigation.navigate("CreateWishlist", { defaultDate: selectedDate })}
                                >
                                    <Ionicons name="heart" size={20} color="#ff5656" />
                                    <Text style={[styles.quickActionText, { color: "#ff5656" }]}>Wish Day Planla</Text>
                                </TouchableOpacity>
                            </View>
                            </ScrollView>
                        )}
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}
const styles = StyleSheet.create({
    // --- HIZLI AKSİYON BUTONLARI STİLLERİ ---
    quickActionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        marginHorizontal: 24, // Üstteki liste ile aynı hizada olması için
        gap: 12, 
    },
    quickActionButton: {
        flex: 1, 
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    quickActionText: {
        fontWeight: "700",
        fontSize: 14,
        marginLeft: 8, 
    },
});