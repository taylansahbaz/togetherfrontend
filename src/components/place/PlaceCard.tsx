import React from "react";
import { Pressable, Text, View } from "react-native";
import { Place } from "../../types/place";
import { formatDate } from "../../utils/date";

export default function PlaceCard({
    place,
    onPress,
}: {
    place: Place;
    onPress: () => void;
}) {
    // Backend'den Enum değeri 2 (Visited) veya string olarak "Visited" gelebilir.
    const isVisited = place.status === "Visited"; 
    
    // Visited ise hafif turkuaz/yeşil tema rengi, değilse beyaz arka plan
    const bgColor = isVisited ? "#E8F4F6" : "#ffffff";
    const borderColor = isVisited ? "#2F7E8D" : "#e2e8f0";

    return (
        <Pressable onPress={onPress}>
            <View
                style={{
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 16,
                    padding: 18,
                    marginTop: 16, // YENİ: Etiketin yukarı taşabilmesi için karta üstten biraz boşluk verdik
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                {/* YENİ: Üst Çizgiye Ortalı Tarih Etiketi */}
                {place.visitDate && (
                    <View style={{ 
                        position: "absolute", // Kartın normal akışından çıkarır
                        top: -12, // Çizginin üstüne çıkması için yukarı iter
                        alignSelf: "center", // Yatayda tam ortaya hizalar
                        backgroundColor: "#64748b", 
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                        borderRadius: 12, // Kapsül (hap) görünümü için köşeleri daha çok yuvarlattık
                    }}>
                        <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "700", letterSpacing: 1.5 }}>
                            {formatDate(place.visitDate)}
                        </Text>
                    </View>
                )}

                <Text style={{ fontSize: 18, fontWeight: "800", color: "#102a43" }}>
                    {place.title}
                </Text>
                
                {/* Şehir ve Kategori */}
                <Text style={{ color: "#64748b", marginTop: 6, fontSize: 14, fontWeight: "500" }}>
                    {[place.city, place.category].filter(Boolean).join(" - ")}
                </Text>
            </View>
        </Pressable>
    );
}