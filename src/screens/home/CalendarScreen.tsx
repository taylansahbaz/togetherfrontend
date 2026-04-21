import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { getMyNotifications } from "@/src/api/notification";
import { getPlaceCategoryLabel } from "@/src/utils/placeCategories";
import { getMyCalendarPlaces } from "../../api/places";
import { SkeletonListItem } from "../../components/common/Skeleton";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/helpers";

LocaleConfig.locales["tr"] = {
    monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    dayNames: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
    today: "Bugün"
};
LocaleConfig.defaultLocale = "tr";

// YENİ: Verilen HEX rengini belirtilen oranda (%0 ile 1 arası) koyulaştırır
const darkenColor = (hex: string, percent: number) => {
    let cleanHex = hex.replace(/^#/, "");
    if (cleanHex.length === 3) {
        cleanHex =
            cleanHex[0] +
            cleanHex[0] +
            cleanHex[1] +
            cleanHex[1] +
            cleanHex[2] +
            cleanHex[2];
    }

    let r = parseInt(cleanHex.substring(0, 2), 16);
    let g = parseInt(cleanHex.substring(2, 4), 16);
    let b = parseInt(cleanHex.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * (1 - percent)));
    g = Math.max(0, Math.floor(g * (1 - percent)));
    b = Math.max(0, Math.floor(b * (1 - percent)));

    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

// Open-Meteo hava durumu kodlarını İkonlara çeviren yardımcı fonksiyon
const getWeatherDetails = (weatherCode: number) => {
    if (weatherCode === 0) return { icon: "sunny", color: "#fcbebe", text: "Açık" };
    if (weatherCode >= 1 && weatherCode <= 3) return { icon: "partly-sunny", color: "#64748b", text: "Parçalı Bulutlu" };
    if (weatherCode >= 45 && weatherCode <= 48) return { icon: "cloud", color: "#94a3b8", text: "Sisli" };
    if (weatherCode >= 51 && weatherCode <= 67) return { icon: "rainy", color: "#3b82f6", text: "Yağmurlu" };
    if (weatherCode >= 71 && weatherCode <= 77) return { icon: "snow", color: "#0ea5e9", text: "Karlı" };
    if (weatherCode >= 95) return { icon: "thunderstorm", color: "#6366f1", text: "Fırtınalı" };
    return { icon: "cloud", color: "#64748b", text: "Bilinmiyor" };
};

export default function CalendarScreen({ navigation }: any) {
    const { logout } = useAuth();
    const { showAlert } = useAlert();
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const todayStr = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const fetchUnreadNotificationCount = async () => {
    try {
        const result = await getMyNotifications();

        if (result.success && Array.isArray(result.data)) {
        const unreadCount = result.data.filter((item: any) => !item.isRead).length;
        setUnreadNotificationCount(unreadCount);
        }
    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.log("Failed to fetch unread notifications:", errorMsg);
        
        // Refresh token hatası ise logout yap
        if (errorMsg.includes("Refresh token not found") || errorMsg.includes("must re-authenticate")) {
            console.log("Refresh token expired, logging out...");
            await logout();
        }
    }
    };

    useFocusEffect(
    useCallback(() => {
        fetchUnreadNotificationCount();
    }, [])
    );
    const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

    const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retryCount = 2
    ) => {
    let lastError: any;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();

        if (!response.ok) {
            const isRetryable =
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504;

            if (isRetryable && attempt < retryCount) {
            await sleep(700 * (attempt + 1));
            continue;
            }

            throw new Error(
            `Servis hatası ${response.status}: ${responseText.slice(0, 200)}`
            );
        }

        if (!contentType.toLowerCase().includes("application/json")) {
            throw new Error(
            `JSON yerine farklı cevap döndü: ${responseText.slice(0, 200)}`
            );
        }

        return JSON.parse(responseText);
        } catch (error: any) {
        lastError = error;

        if (attempt < retryCount) {
            await sleep(700 * (attempt + 1));
            continue;
        }
        }
    }

    throw lastError;
    };
    // Hava durumu state'leri
    const [weather, setWeather] = useState<any>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    const loadPlaces = async () => {
        try {
            setLoading(true);
            const data = await getMyCalendarPlaces();
            const placesArray = Array.isArray(data) ? data : data?.data || [];
            setPlaces(placesArray);
        } catch (err: any) {
            showAlert({
                title: "Hata",
                message: getApiErrorMessage(err),
                type: "danger",
            });
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPlaces();
        }, [])
    );

    const selectedDayPlaces = useMemo(() => {
        return places.filter(
            (place) =>
                place.visitDate &&
                place.visitDate.split("T")[0] === selectedDate
        );
    }, [places, selectedDate]);

  useEffect(() => {
  const controller = new AbortController();

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeather(null);

    try {
      let lat = 41.0082;
      let lng = 28.9784;

      const placeWithLocation = selectedDayPlaces.find(
        (p) => p.latitude != null && p.longitude != null
      );

      if (placeWithLocation) {
        lat = Number(placeWithLocation.latitude);
        lng = Number(placeWithLocation.longitude);
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const diffMs =
        new Date(todayStr).getTime() - new Date(selectedDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const isPast = selectedDate < todayStr;
      const useForecastForRecentPast = isPast && diffDays <= 92;
      const baseUrl =
        !isPast || useForecastForRecentPast
          ? "https://api.open-meteo.com/v1/forecast"
          : "https://archive-api.open-meteo.com/v1/archive";

      const url =
        `${baseUrl}?latitude=${encodeURIComponent(lat)}` +
        `&longitude=${encodeURIComponent(lng)}` +
        `&daily=weather_code,temperature_2m_max` +
        `&timezone=auto` +
        `&start_date=${encodeURIComponent(selectedDate)}` +
        `&end_date=${encodeURIComponent(selectedDate)}`;

      const data = await fetchWithRetry(
        url,
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
        2
      );

      const temp = data?.daily?.temperature_2m_max?.[0];
      const code =
        data?.daily?.weather_code?.[0] ?? data?.daily?.weathercode?.[0];

      if (temp == null || code == null) {
        throw new Error("Beklenen hava durumu alanları gelmedi.");
      }

      setWeather({
        temp: Math.round(temp),
        ...getWeatherDetails(code),
      });
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      console.log("Hava durumu çekilemedi:", error);
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  fetchWeather();

  return () => controller.abort();
}, [selectedDate, selectedDayPlaces]);
    const formattedSelectedDate = new Date(selectedDate).toLocaleDateString(
        "tr-TR",
        { day: "numeric", month: "long", weekday: "long" }
    );

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../assets/images/home-bg.png")}
                resizeMode="cover"
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.9)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingHorizontal: 24,
                                paddingTop: 10,
                                paddingBottom: 2
                            }}
                        >
                            <View>
                                <Text
                                    style={{
                                        fontSize: 32,
                                        fontWeight: "800",
                                        color: "#102a43",
                                        marginTop: 4
                                    }}
                                >
                                    Takvimim
                                </Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate("Notifications")}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: "rgba(217, 234, 204, 0.68)",
                                    borderWidth: 1,
                                    borderColor: "#dbe4ec",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative"
                                }}
                                >
                                <Ionicons name="notifications-sharp" size={22} color="#234f78" />

                                {unreadNotificationCount > 0 && (
                                    <View
                                    style={{
                                        position: "absolute",
                                        top: -4,
                                        right: -4,
                                        minWidth: 20,
                                        height: 20,
                                        paddingHorizontal: 5,
                                        borderRadius: 10,
                                        backgroundColor: "#ff6b81",
                                        borderWidth: 2,
                                        borderColor: "#ffffff",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                    >
                                    <Text
                                        style={{
                                        color: "#ffffff",
                                        fontSize: 10,
                                        fontWeight: "800"
                                        }}
                                    >
                                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                                    </Text>
                                    </View>
                                )}
                                </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={{ marginHorizontal: 20, marginTop: 20, gap: 10 }}>
                                <SkeletonListItem />
                                <SkeletonListItem />
                                <SkeletonListItem />
                            </View>
                        ) : (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 100 }}
                            >
                                <View
                                    style={{
                                        marginHorizontal: 20,
                                        marginTop: 10,
                                        borderRadius: 24,
                                        overflow: "hidden",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 10,
                                        elevation: 3
                                    }}
                                >
                                    <Calendar
                                        firstDay={1}
                                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                                        theme={{
                                            backgroundColor: "#234f78",
                                            calendarBackground: "#234f78",
                                            textSectionTitleColor: "rgba(255,255,255,0.75)",
                                            dayTextColor: "#D9E2FF",
                                            textDisabledColor: "rgba(217,226,255,0.28)",
                                            monthTextColor: "#FFFFFF",
                                            arrowColor: "#FFFFFF",
                                            todayTextColor: "#FFFFFF",
                                            textDayFontWeight: "600",
                                            textMonthFontWeight: "800",
                                            textDayHeaderFontWeight: "700",
                                            textDayFontSize: 16,
                                            textMonthFontSize: 20
                                        }}
                                        dayComponent={({ date, state }: any) => {
                                            const dayPlaces = places.filter(
                                                (p) =>
                                                    p.visitDate &&
                                                    p.visitDate.split("T")[0] === date.dateString
                                            );
                                            const isSelected = selectedDate === date.dateString;

                                            if (dayPlaces.length > 0) {
                                                const visitedEvent = dayPlaces.find(
                                                    (p) =>
                                                        p.status === 2 ||
                                                        p.status === "Visited"
                                                );
                                                const firstEvent =
                                                    visitedEvent || dayPlaces[0];
                                                const isVisited = !!visitedEvent;
                                                const groupColor =
                                                    firstEvent.groupColor || "#2F7E8D";
                                                const darkBorderColor = darkenColor(
                                                    groupColor,
                                                    0.3
                                                );

                                                return (
                                                    <Pressable
                                                        onPress={() => setSelectedDate(date.dateString)}
                                                    >
                                                        <View
                                                            style={[
                                                                {
                                                                    width: 36,
                                                                    height: 36,
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    borderRadius: 10
                                                                },
                                                                isSelected && {
                                                                    borderWidth: 2,
                                                                    borderColor: darkBorderColor
                                                                }
                                                            ]}
                                                        >
                                                            {isVisited ? (
                                                                <View
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: 10,
                                                                        backgroundColor: groupColor,
                                                                        alignItems: "center",
                                                                        justifyContent: "center"
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            color: "white",
                                                                            fontWeight: "bold",
                                                                            fontSize: 14
                                                                        }}
                                                                    >
                                                                        {date.day}
                                                                    </Text>
                                                                </View>
                                                            ) : (
                                                                <View
                                                                    style={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        alignItems: "center",
                                                                        justifyContent: "center"
                                                                    }}
                                                                >
                                                                    <View
                                                                        style={{
                                                                            position: "absolute",
                                                                            top: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            bottom: 0,
                                                                            alignItems: "center",
                                                                            justifyContent: "center"
                                                                        }}
                                                                    >
                                                                        <Ionicons
                                                                            name="heart"
                                                                            size={38}
                                                                            color={groupColor}
                                                                        />
                                                                    </View>
                                                                    <Text
                                                                        style={{
                                                                            color: "white",
                                                                            fontWeight: "bold",
                                                                            fontSize: 13,
                                                                            zIndex: 1,
                                                                            marginTop: 2,
                                                                            left: 1
                                                                        }}
                                                                    >
                                                                        {date.day}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </Pressable>
                                                );
                                            }

                                            return (
                                                <Pressable
                                                    onPress={() => setSelectedDate(date.dateString)}
                                                >
                                                    <View
                                                        style={[
                                                            {
                                                                width: 36,
                                                                height: 36,
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                borderRadius: 18
                                                            },
                                                            isSelected && {
                                                                borderWidth: 1.5,
                                                                borderColor: "#2DD4BF",
                                                                backgroundColor:
                                                                    "rgba(45,212,191,0.08)"
                                                            }
                                                        ]}
                                                    >
                                                        <Text
                                                            style={{
                                                                color:
                                                                    state === "disabled"
                                                                        ? "rgba(217,226,255,0.28)"
                                                                        : "#D9E2FF",
                                                                fontWeight: isSelected ? "700" : "600",
                                                                fontSize: 15
                                                            }}
                                                        >
                                                            {date.day}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        }}
                                    />

                                    <View style={styles.calendarLegendRow}>
                                        <View style={styles.legendItem}>
                                            <View style={styles.legendVisitedDot} />
                                            <Text style={styles.calendarLegendText}>Gidilenler</Text>
                                        </View>

                                        <View style={styles.legendItem}>
                                            <Ionicons
                                                name="heart"
                                                size={18}
                                                color="#ff5656"
                                            />
                                            <Text style={styles.calendarLegendText}>
                                                Planlar
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.detailsCard}>
                                    <View style={styles.detailsHeader}>
                                        <Text style={styles.detailsDate}>
                                            {formattedSelectedDate}
                                        </Text>

                                        {loadingWeather ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#94a3b8"
                                            />
                                        ) : weather ? (
                                            <View style={styles.weatherPill}>
                                                <Ionicons
                                                    name={weather.icon}
                                                    size={18}
                                                    color={weather.color}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={styles.weatherText}>
                                                    {weather.temp}°C
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {selectedDayPlaces.length === 0 ? (
                                        <View style={styles.emptyCard}>
                                            <Ionicons
                                                name="calendar-clear-outline"
                                                size={32}
                                                color="#94a3b8"
                                                style={{ marginBottom: 10 }}
                                            />
                                            <Text style={styles.emptyText}>
                                                Henüz bir planınız veya anınız yok.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.eventsList}>
                                            {selectedDayPlaces.map((place) => {
                                                const isVisited =
                                                    place.status === 2 ||
                                                    place.status === "Visited";
                                                const groupColor =
                                                    place.groupColor || "#2F7E8D";

                                                return (
                                                    <Pressable
                                                        key={place.id}
                                                        onPress={() =>
                                                            navigation.navigate("PlaceDetail", {
                                                                placeId: place.id
                                                            })
                                                        }
                                                        style={[
                                                            styles.placeCard,
                                                            { borderLeftColor: groupColor,
                                                                backgroundColor:  "rgba(255,255,255,0.72)",
                                                             }
                                                        ]}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.placeIconBox,
                                                                {
                                                                    backgroundColor: `${groupColor}20`
                                                                }
                                                            ]}
                                                        >
                                                            <Ionicons
                                                                name={
                                                                    isVisited
                                                                        ? "location"
                                                                        : "heart"
                                                                }
                                                                size={24}
                                                                color={groupColor}
                                                            />
                                                        </View>

                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                justifyContent: "center"
                                                            }}
                                                        >
                                                            <Text
                                                                style={styles.placeTitle}
                                                                numberOfLines={1}
                                                            >
                                                                {place.title}
                                                            </Text>

                                                            <Text style={styles.placeMeta}>
                                                                {place.city
                                                                    ? `${place.city} • `
                                                                    : ""}
                                                                {getPlaceCategoryLabel(place.category)}
                                                                  {place.groupName ? ` • ${place.groupName.charAt(0).toUpperCase() + place.groupName.slice(1)}` : ""}

                                                            </Text>
                                                        </View>

                                                        <Ionicons
                                                            name="chevron-forward"
                                                            size={20}
                                                            color="#cbd5e1"
                                                            style={{ alignSelf: "center" }}
                                                        />
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    )}

                                    <View style={styles.quickActionContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.quickActionButton,
                                                { backgroundColor: "#abca829e" }
                                            ]}
                                            onPress={() =>
                                                navigation.navigate("CreatePlace", {
                                                    defaultDate: selectedDate,
                                                    initialStatus: 2
                                                })
                                            }
                                        >
                                            <Ionicons
                                                name="location"
                                                size={20}
                                                color="#234f78"
                                            />
                                            <Text
                                                style={[
                                                    styles.quickActionText,
                                                    { color: "#424452" }
                                                ]}
                                            >
                                                Mekan Ekle
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.quickActionButton,
                                                { backgroundColor: "#fcbebe" }
                                            ]}
                                            onPress={() =>
                                                navigation.navigate("CreateWishlist", {
                                                    defaultDate: selectedDate
                                                })
                                            }
                                        >
                                            <Ionicons
                                                name="heart"
                                                size={20}
                                                color="#ff5656"
                                            />
                                            <Text
                                                style={[
                                                    styles.quickActionText,
                                                    { color: "#ff5656" }
                                                ]}
                                            >
                                                Wish Day Planla
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
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
    detailsCard: {
        marginTop: 10,
        marginHorizontal: 20,
        backgroundColor: "#9ab8d4",
        borderRadius: 24,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3
    },
    legendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        marginBottom: 18
    },
    calendarLegendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 22,
        paddingTop: 6,
        paddingBottom: 14,
        paddingHorizontal: 12,
        backgroundColor: "#234f78",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)"
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    legendVisitedDot: {
        width: 14,
        height: 14,
        borderRadius: 5,
        backgroundColor: "#ede6e6"
    },
    legendText: {
        fontSize: 13,
        color: "#5c697b",
        fontWeight: "600"
    },
    calendarLegendText: {
        fontSize: 13,
        color: "#E6ECF5",
        fontWeight: "700"
    },
    detailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
    },
    detailsDate: {
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        color: "#102a43",
        paddingRight: 12
    },
    weatherPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.72)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12
    },
    weatherText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#102a43"
    },
    emptyCard: {
        backgroundColor: "rgba(255,255,255,0.72)",
        padding: 24,
        borderRadius: 20,
        alignItems: "center",   
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
        marginBottom: 16
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
        textAlign: "center",
        fontWeight: "500"
    },
    eventsList: {
        marginBottom: 16,
        color   : "#94a3b8"
    },
    placeCard: {
        flexDirection: "row",
         backgroundColor: "#F6F1FF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderLeftWidth: 5
    },
    placeIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16
    },
    placeTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#102a43"
    },
    placeMeta: {
        fontSize: 13,
        color: "#64748b",
        marginTop: 4
    },
    quickActionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12
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
        
    },
    quickActionText: {
        fontWeight: "700",
        fontSize: 14,
        marginLeft: 8
    }
});
