import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { createReview, deleteReview, updateReview } from "../../api/reviews";
import { getApiErrorMessage } from "../../utils/helpers";

export default function EditReviewScreen({ route, navigation }: any) {
    const { placeId, review } = route.params ?? {};
    const scrollViewRef = useRef<ScrollView>(null);
    
    // YENİ: Artık direkt 10 üzerinden (1-10) puanı tutuyoruz. 
    // Eğer önceden verilmiş puan yoksa 0'dan başlar.
    const [score, setScore] = useState<number>(review?.rating || 0);
    
    const [comment, setComment] = useState(review?.comment ?? "");
    const [wouldGoAgain, setWouldGoAgain] = useState<boolean>(review?.wouldGoAgain ?? true);
    const [loading, setLoading] = useState(false);

    const onSave = async () => {
        if (score === 0) {
            Alert.alert("Uyarı", "Lütfen mekana bir puan verin.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                placeId,
                rating: score, // YENİ: Artık çarpmaya gerek yok, direkt 1 ile 10 arasında gönderiyoruz
                comment,
                wouldGoAgain,
            };

            if (review?.id) {
                await updateReview(review.id, payload);
            } else {
                await createReview(payload);
            }

            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const onDelete = () => {
        Alert.alert(
            "Yorumu Sil",
            "Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteReview(review.id);
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert("Hata", getApiErrorMessage(err));
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="#102a43" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{review ? "Yorumu Düzenle" : "Yorum Yap"}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                >
                    <View style={styles.content}>
                    
                    {/* YENİ: YARIM YILDIZ DESTEKLİ PUANLAMA */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Puanınız: {score > 0 ? (score).toFixed(1) : "0.0"} / 10
                        </Text>
                        
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((index) => {
                                // Her yıldızın tam puan karşılığı (2, 4, 6, 8, 10)
                                const starValue = index * 2; 
                                
                                // İkon belirleme mantığı
                                let iconName: keyof typeof Ionicons.glyphMap = "star-outline";
                                if (score >= starValue) {
                                    iconName = "star"; // Tamamen dolu
                                } else if (score === starValue - 1) {
                                    iconName = "star-half"; // Yarım dolu (Örn: score 7 ise 4. yıldız yarım olur)
                                }

                                // Renk belirleme (Eğer en azından yarım yıldızlık puanı aldıysa sarı, almadıysa gri)
                                const iconColor = score >= starValue - 1 ? "#F59E0B" : "#cbd5e1";

                                return (
                                    <View key={index} style={{ position: "relative" }}>
                                        {/* Görünen Yıldız İkonu */}
                                        <Ionicons name={iconName} size={44} color={iconColor} />
                                        
                                        {/* Sol Yarım İçin Görünmez Tıklama Alanı (Örn: 7 puan) */}
                                        <TouchableOpacity
                                            style={{ position: "absolute", left: 0, width: "50%", height: "100%" }}
                                            onPress={() => setScore(starValue - 1)}
                                            activeOpacity={1}
                                        />
                                        
                                        {/* Sağ Yarım İçin Görünmez Tıklama Alanı (Örn: 8 puan) */}
                                        <TouchableOpacity
                                            style={{ position: "absolute", right: 0, width: "50%", height: "100%" }}
                                            onPress={() => setScore(starValue)}
                                            activeOpacity={1}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* TEKRAR GİDER MİSİN? */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Tekrar Gider Misiniz?</Text>
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity 
                                style={[styles.segmentButton, wouldGoAgain && styles.segmentActiveYes]}
                                onPress={() => setWouldGoAgain(true)}
                            >
                                <Ionicons name="thumbs-up" size={20} color={wouldGoAgain ? "white" : "#64748b"} />
                                <Text style={[styles.segmentText, wouldGoAgain && { color: "white" }]}>Kesinlikle</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.segmentButton, !wouldGoAgain && styles.segmentActiveNo]}
                                onPress={() => setWouldGoAgain(false)}
                            >
                                <Ionicons name="thumbs-down" size={20} color={!wouldGoAgain ? "white" : "#64748b"} />
                                <Text style={[styles.segmentText, !wouldGoAgain && { color: "white" }]}>Hayır</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* YORUM ALANI */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Deneyiminizi Anlatın</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Mekan nasıldı? Neleri beğendiniz veya beğenmediniz?"
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                            onFocus={() => {
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                }, 100);
                            }}
                        />
                    </View>

                    {/* KAYDET BUTONU */}
                    <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Yorumu Paylaş</Text>}
                    </TouchableOpacity>

                    {/* SİLME BUTONU */}
                    {review?.id && (
                        <TouchableOpacity 
                            style={styles.deleteButton} 
                            onPress={onDelete} 
                            disabled={loading}
                        >
                            <Text style={styles.deleteButtonText}>Yorumu Sil</Text>
                        </TouchableOpacity>
                    )}
                    
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#102a43" },
    scrollContent: { paddingBottom: 60, paddingTop: 10 },
    content: { paddingHorizontal: 20, paddingTop: 10 },
    
    card: { backgroundColor: "white", borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    sectionTitle: { fontSize: 15, fontWeight: "800", color: "#102a43", marginBottom: 16, textAlign: "center" },
    
    // YENİ: Yıldızların boyutunu bir tık büyütüp (size={44} yaptık) aralarını açtık ki dokunmak kolay olsun
    starsRow: { flexDirection: "row", justifyContent: "center", gap: 12 }, 
    
    segmentedControl: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 16, padding: 6 },
    segmentButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 8 },
    segmentActiveYes: { backgroundColor: "#10b981", shadowColor: "#10b981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    segmentActiveNo: { backgroundColor: "#ef4444", shadowColor: "#ef4444", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    segmentText: { fontSize: 15, fontWeight: "700", color: "#64748b" },

    textArea: { backgroundColor: "#f8fafc", borderRadius: 16, padding: 16, fontSize: 15, color: "#0f172a", height: 160 },
    
    saveButton: { backgroundColor: "#2F7E8D", borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    saveButtonText: { color: "white", fontSize: 16, fontWeight: "800" },

    deleteButton: { marginTop: 20, alignItems: "center", padding: 12 },
    deleteButtonText: { color: "#ef4444", fontSize: 16, fontWeight: "700" }
});