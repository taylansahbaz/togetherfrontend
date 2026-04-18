import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { uploadPlacePhoto } from "../../api/photos";
import { getApiErrorMessage } from "../../utils/helpers";

export default function UploadPhotoScreen({ route, navigation }: any) {
    const { placeId } = route.params;
    const [imageUri, setImageUri] = useState("");
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);

    const takePhoto = async () => {
        setIsSourceModalVisible(false);
        
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("İzin Gerekli", "Fotoğraf çekebilmek için kamera erişimine izin vermelisiniz.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const pickFromGallery = async () => {
        setIsSourceModalVisible(false);
        
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("İzin Gerekli", "Fotoğraf seçebilmek için galeri erişimine izin vermelisiniz.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const onUpload = async () => {
        if (!imageUri) {
            Alert.alert("Uyarı", "Lütfen önce bir fotoğraf seçin.");
            return;
        }

        try {
            setLoading(true);
            await uploadPlacePhoto(placeId, imageUri, caption);
            Alert.alert("Başarılı", "Fotoğraf anılara eklendi!");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="#102a43" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fotoğraf Ekle</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.content}>
                    
                    <TouchableOpacity 
                        style={[styles.imagePickerBox, imageUri ? styles.imagePickerFilled : null]} 
                        onPress={() => setIsSourceModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        {imageUri ? (
                            <>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                <View style={styles.editBadge}>
                                    <Ionicons name="pencil" size={16} color="white" />
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="images" size={32} color="#3b82f6" />
                                </View>
                                <Text style={styles.emptyStateTitle}>Fotoğraf Ekle</Text>
                                <Text style={styles.emptyStateDesc}>Buradan harika bir anınızı gruba ekleyin</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Fotoğraf Notu</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Bu fotoğrafla ilgili ne hatırlıyorsunuz?"
                            placeholderTextColor="#94a3b8"
                            value={caption}
                            onChangeText={setCaption}
                            multiline
                        />
                    </View>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity 
                        style={[styles.uploadButton, !imageUri && { backgroundColor: "#cbd5e1", shadowOpacity: 0 }]} 
                        onPress={onUpload} 
                        disabled={loading || !imageUri}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.uploadButtonText}>Anıyı Yükle</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={isSourceModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsSourceModalVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setIsSourceModalVisible(false)}
                >
                    <Pressable 
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Fotoğraf Kaynağı</Text>
                            <Pressable onPress={() => setIsSourceModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </Pressable>
                        </View>

                        <TouchableOpacity 
                            style={styles.sourceOption}
                            onPress={takePhoto}
                        >
                            <View style={[styles.sourceIcon, { backgroundColor: "#fef3c7" }]}>
                                <Ionicons name="camera" size={24} color="#d97706" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sourceOptionTitle}>Fotoğraf Çek</Text>
                                <Text style={styles.sourceOptionDesc}>Anında kamera ile fotoğraf çek</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.sourceOption}
                            onPress={pickFromGallery}
                        >
                            <View style={[styles.sourceIcon, { backgroundColor: "#e0f2fe" }]}>
                                <Ionicons name="images" size={24} color="#0284c7" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sourceOptionTitle}>Galeriden Seç</Text>
                                <Text style={styles.sourceOptionDesc}>Daha önceki fotoğraflardan birini seçin</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#102a43" },
    content: { flex: 1, paddingHorizontal: 20, paddingBottom: 30 },
    
    imagePickerBox: {
        width: "100%", height: 320, backgroundColor: "#f1f5f9", borderRadius: 24,
        borderWidth: 2, borderColor: "#cbd5e1", borderStyle: "dashed",
        justifyContent: "center", alignItems: "center", marginBottom: 24, overflow: "hidden"
    },
    imagePickerFilled: { borderWidth: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
    previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
    editBadge: { position: "absolute", bottom: 16, right: 16, backgroundColor: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 20, backdropFilter: "blur(10px)" },
    
    emptyState: { alignItems: "center", padding: 20 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e0f2fe", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    emptyStateTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
    emptyStateDesc: { fontSize: 14, color: "#64748b", textAlign: "center", paddingHorizontal: 20 },

    inputContainer: { backgroundColor: "white", borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    inputLabel: { fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    textInput: { backgroundColor: "#f8fafc", borderRadius: 16, padding: 16, fontSize: 15, color: "#0f172a", minHeight: 100, textAlignVertical: "top" },

    uploadButton: { flexDirection: "row", backgroundColor: "#2F7E8D", borderRadius: 16, paddingVertical: 18, alignItems: "center", justifyContent: "center", shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    uploadButtonText: { color: "white", fontSize: 16, fontWeight: "800" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, maxHeight: "70%" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
    sourceOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    sourceIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 16 },
    sourceOptionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
    sourceOptionDesc: { fontSize: 13, color: "#64748b", fontWeight: "500" }
});