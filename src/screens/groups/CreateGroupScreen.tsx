import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { createGroup } from "../../api/groups";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { getApiErrorMessage } from "../../utils/helpers";

const GROUP_COLORS = [
    "#2F7E8D", // Senin Ana Turkuaz Rengin (Varsayılan)
    "#fcbebe", // Wishlist Pembe/Kırmızı
    "#a78bfa", // Soft Mor
    "#fbbf24", // Sıcak Sarı/Hardal
    "#34d399", // Zümrüt Yeşili
    "#f472b6", // Şeker Pembe
    "#38bdf8"  // Gökyüzü Mavisi
];

export default function CreateGroupScreen({ navigation }: any) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [colorCode, setColorCode] = useState(GROUP_COLORS[0]);
    const onCreate = async () => {
        try {
            setLoading(true);
            await createGroup({ name , color : colorCode });
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f8fafc" }}>
        
        {/* Senin Mevcut Input'un */}
        <AppInput label="Group Name" value={name} onChangeText={setName} />
        
        {/* YENİ: Renk Seçici Palet (Input ile Buton Arasına) */}
        <View style={{ marginTop: 20, marginBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#102a43", marginBottom: 12 }}>
                Grup Rengini Seç
            </Text>
            
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {GROUP_COLORS.map((color) => {
                    const isSelected = colorCode === color; // state'deki renk bu mu?
                    
                    return (
                        <Pressable
                            key={color}
                            onPress={() => setColorCode(color)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: color,
                                justifyContent: "center",
                                alignItems: "center",
                                // Seçiliyse etrafına şık bir çerçeve ve gölge atıyoruz
                                borderWidth: isSelected ? 3 : 0,
                                borderColor: "#102a43",
                                shadowColor: color,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: isSelected ? 0.4 : 0,
                                shadowRadius: 6,
                                elevation: isSelected ? 4 : 0,
                            }}
                        >
                            {/* Seçiliyse içine bir beyaz tik koyuyoruz */}
                            {isSelected && (
                                <Ionicons name="checkmark-sharp" size={24} color="#ffffff" />
                            )}
                        </Pressable>
                    );
                })}
            </View>
            
            <Text style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>
                Bu renk, takvimdeki ortak anılarınızı temsil edecek.
            </Text>
        </View>

        {/* Senin Mevcut Butonun */}
        <AppButton title="Create" onPress={onCreate} loading={loading} />
        
    </View>
);
}