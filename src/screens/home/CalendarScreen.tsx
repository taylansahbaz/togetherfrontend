import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { getPlacesByGroup } from "../../api/places";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Place } from "../../types/place";
import { getApiErrorMessage } from "../../utils/helpers";

// Takvimi Türkçeleştirmek istersen (İsteğe bağlı)
LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

export default function CalendarScreen({ navigation }: any) {
    const { selectedGroupId } = useSelectedGroup();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Bugünü varsayılan seçili gün yapıyoruz
    const todayStr = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    const loadPlaces = async () => {
        if (!selectedGroupId) return;
        try {
            setLoading(true);
            const data = await getPlacesByGroup(selectedGroupId);
            setPlaces(data);
        } catch (err) {
            Alert.alert("Error", getApiErrorMessage(err));
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

                // Renk Belirleme: Ziyaret edildiyse Turkuaz, Plan (Wishlist) ise Turuncu
                const dayColor = isVisited ? '#2F7E8D' : '#F59E0B';

                // YENİ: Nokta yerine o günün kutusunu tamamen özelleştiriyoruz
                marks[dateStr] = {
                    customStyles: {
                        container: {
                            backgroundColor: dayColor, // Arka planı tamamen renklendirir
                            borderRadius: 12, // Hafif yuvarlak köşeli (veya tam yuvarlak için 20 yapabilirsin)
                            elevation: 2, // Android için hafif gölge
                            shadowColor: dayColor,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                        },
                        text: {
                            color: 'white', // Yazı rengini beyaz yap
                            fontWeight: 'bold',
                        }
                    }
                };
            }
        });

        // Eğer bir gün seçiliyse ve onda zaten bir anı varsa, seçili halini biraz daha farklı göster
        if (marks[selectedDate]) {
            marks[selectedDate] = {
                ...marks[selectedDate],
                customStyles: {
                    ...marks[selectedDate].customStyles,
                    container: {
                        ...marks[selectedDate].customStyles.container,
                        borderWidth: 2,
                        borderColor: '#102a43', // Seçili olduğunu belli eden kalın bir çerçeve
                    }
                }
            };
        } else {
            // Seçilen günde hiçbir şey yoksa standart seçili stili
            marks[selectedDate] = {
                customStyles: {
                    container: {
                        backgroundColor: 'rgba(47, 126, 141, 0.1)',
                        borderWidth: 1,
                        borderColor: '#2F7E8D',
                        borderRadius: 12,
                    },
                    text: {
                        color: '#2F7E8D',
                        fontWeight: 'bold',
                    }
                }
            };
        }

        return marks;
    }, [places, selectedDate]);

    // Seçilen güne ait mekanları/planları filtrele
    const selectedDayPlaces = useMemo(() => {
        return places.filter(place => place.visitDate && place.visitDate.split('T')[0] === selectedDate);
    }, [places, selectedDate]);

    // Görüntülenecek günün dostane formatı (Örn: 24 Mayıs Cuma)
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
                        
                        {/* HEADER */}
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
                                
                                {/* TAKVİM KARTI */}
                                <View style={{ marginHorizontal: 20, marginTop: 10, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                                    <Calendar
                                        markingType={'multi-dot'}
                                        markedDates={markedDates}
                                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                                        theme={{
                                            backgroundColor: '#ffffff',
                                            calendarBackground: '#ffffff',
                                            textSectionTitleColor: '#64748b',
                                            selectedDayBackgroundColor: '#2F7E8D',
                                            selectedDayTextColor: '#ffffff',
                                            todayTextColor: '#2F7E8D',
                                            dayTextColor: '#102a43',
                                            textDisabledColor: '#cbd5e1',
                                            dotColor: '#2F7E8D',
                                            selectedDotColor: '#ffffff',
                                            arrowColor: '#2F7E8D',
                                            monthTextColor: '#102a43',
                                            textDayFontWeight: '500',
                                            textMonthFontWeight: 'bold',
                                            textDayHeaderFontWeight: '600',
                                            textDayFontSize: 15,
                                            textMonthFontSize: 18,
                                        }}
                                    />
                                </View>

                                {/* BİLGİ ETİKETLERİ (LEGEND) */}
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

                                {/* SEÇİLİ GÜNÜN DETAYLARI */}
                                <View style={{ paddingHorizontal: 24 }}>
                                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#102a43", marginBottom: 16 }}>
                                        {formattedSelectedDate}
                                    </Text>

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
                                                        borderLeftWidth: 5, borderLeftColor: isVisited ? "#2F7E8D" : "#F59E0B"
                                                    }}
                                                >
                                                    <View style={{ backgroundColor: isVisited ? "#E8F4F6" : "#FFFBEB", width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                                                        <Ionicons name={isVisited ? "checkmark-done" : "star"} size={24} color={isVisited ? "#2F7E8D" : "#F59E0B"} />
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