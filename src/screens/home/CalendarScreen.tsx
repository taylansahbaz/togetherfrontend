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
    Text,
    View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { getPlacesByGroup } from "../../api/places";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Place } from "../../types/place";
import { getApiErrorMessage } from "../../utils/helpers";

LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

// YENİ: Open-Meteo hava durumu kodlarını İkonlara çeviren yardımcı fonksiyon
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
    const { selectedGroupId } = useSelectedGroup();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    
    const todayStr = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // YENİ: Hava durumu state'leri
    const [weather, setWeather] = useState<any>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    const loadPlaces = async () => {
        if (!selectedGroupId) {
        setPlaces([]);
        return;
    }
        try {
            setLoading(true);
            const data = await getPlacesByGroup(selectedGroupId);
            setPlaces(data);
        } catch (err: any) {
           if (err.response?.status === 403 || err.response?.status === 401) {
            setPlaces([]);
        } else {
            Alert.alert("Hata", getApiErrorMessage(err));
        }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadPlaces(); }, [selectedGroupId]));

    const markedDates = useMemo(() => {
        const marks: any = {};

        places.forEach(place => {
            if (place.visitDate) {
                const dateStr = place.visitDate.split('T')[0];
                const isVisited = place.status === 2 || place.status === "Visited";
                const dayColor = isVisited ? '#2F7E8D' : '#fcbebe';

                marks[dateStr] = {
                    customStyles: {
                        container: {
                            backgroundColor: dayColor,
                            borderRadius: 18, 
                            width: 36,
                            height: 36,
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        text: { color: 'white', fontWeight: 'bold' }
                    }
                };
            }
        });

        if (marks[selectedDate]) {
            marks[selectedDate] = {
                customStyles: {
                    container: {
                        ...marks[selectedDate].customStyles.container, 
                        borderWidth: 2,
                        borderColor: '#102a43', 
                    },
                    text: { color: 'white', fontWeight: 'bold' }
                }
            };
        } else {
            marks[selectedDate] = {
                customStyles: {
                    container: {
                        backgroundColor: 'rgba(47, 126, 141, 0.1)',
                        borderWidth: 1, borderColor: '#2F7E8D', borderRadius: 18,
                        width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
                    },
                    text: { color: '#2F7E8D', fontWeight: 'bold' }
                }
            };
        }

        return marks;
    }, [places, selectedDate]);

    const selectedDayPlaces = useMemo(() => {
        return places.filter(place => place.visitDate && place.visitDate.split('T')[0] === selectedDate);
    }, [places, selectedDate]);

    // YENİ: Seçili gün değiştiğinde Open-Meteo'dan hava durumunu çeken Hook
    useEffect(() => {
        const fetchWeather = async () => {
            setLoadingWeather(true);
            setWeather(null);

            try {
                // Eğer o güne ait bir mekan varsa onun koordinatlarını al, yoksa varsayılan olarak İstanbul'u kullan
                let lat = 41.0082; // İstanbul Latitude
                let lng = 28.9784; // İstanbul Longitude

                if (selectedDayPlaces.length > 0) {
                    const placeWithLocation = selectedDayPlaces.find(p => p.latitude && p.longitude);
                    if (placeWithLocation) {
                        lat = placeWithLocation.latitude!;
                        lng = placeWithLocation.longitude!;
                    }
                }

                // Open-Meteo Historical / Forecast API birleşimi
                // (Günlük max sıcaklık ve hava kodu istenir)
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
    }, [selectedDate, places]); // places'i de ekliyoruz ki veriler yüklendikten sonra koordinat hesaplansın

    const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    if (!selectedGroupId) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "#64748b" }}>Lütfen önce bir grup seçin.</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground source={require("../../../assets/images/home-bg.png")} resizeMode="cover" style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.9)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                            <View>
                                <Text style={{ fontSize: 32, fontWeight: "800", color: "#102a43", marginTop: 4 }}>
                                    Takvim
                                </Text>
                            </View>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#2F7E8D" style={{ marginTop: 50 }} />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                                
                                <View style={{ marginHorizontal: 20, marginTop: 10, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                                    <Calendar
                                        markingType={'custom'}
                                        markedDates={markedDates}
                                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                                        theme={{
                                            backgroundColor: '#ffffff', calendarBackground: '#ffffff',
                                            textSectionTitleColor: '#64748b', todayTextColor: '#2F7E8D',
                                            dayTextColor: '#102a43', textDisabledColor: '#cbd5e1',
                                            arrowColor: '#2F7E8D', monthTextColor: '#102a43',
                                            textDayFontWeight: '500', textMonthFontWeight: '800',
                                            textDayHeaderFontWeight: '600', textDayFontSize: 15, textMonthFontSize: 18,
                                        }}
                                    />
                                </View>

                                <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16, marginBottom: 20 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#2F7E8D" }} />
                                        <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Gidilenler</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fcbebe" }} />
                                        <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Wish Day (Planlar)</Text>
                                    </View>
                                </View>

                                {/* GÜNÜN BİLGİLERİ VE HAVA DURUMU */}
                                <View style={{ paddingHorizontal: 24 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <Text style={{ fontSize: 18, fontWeight: "800", color: "#102a43", flex: 1 }}>
                                            {formattedSelectedDate}
                                        </Text>

                                        {/* YENİ: Hava Durumu Rozeti */}
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
                                            return (
                                                <Pressable 
                                                    key={place.id}
                                                    onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}
                                                    style={{ 
                                                        flexDirection: "row", backgroundColor: "#ffffff", borderRadius: 20, padding: 16, marginBottom: 12, 
                                                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                                                        borderLeftWidth: 5, borderLeftColor: isVisited ? "#2F7E8D" : "#fcbebe"
                                                    }}
                                                >
                                                    <View style={{ backgroundColor: isVisited ? "#E8F4F6" : "#FFFBEB", width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                                                        <Ionicons name={isVisited ? "checkmark-done" : "star"} size={24} color={isVisited ? "#2F7E8D" : "#fcbebe"} />
                                                    </View>
                                                    <View style={{ flex: 1, justifyContent: "center" }}>
                                                        <Text style={{ fontSize: 16, fontWeight: "800", color: "#102a43" }} numberOfLines={1}>
                                                            {place.title}
                                                        </Text>
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
                                
                            </ScrollView>
                        )}
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}