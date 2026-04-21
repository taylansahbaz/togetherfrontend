import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { uploadPlacePhoto } from "../../api/photos";
import { getApiErrorMessage } from "../../utils/helpers";

type PhotoDraft = {
    key: string;
    uri: string;
    caption: string;
};

const makeKey = () =>
    `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function UploadPhotoScreen({ route, navigation }: any) {
    const { placeId } = route.params;
    const [photos, setPhotos] = useState<PhotoDraft[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);

    const addPhotos = (uris: string[]) => {
        if (!uris.length) return;
        setPhotos((prev) => [
            ...prev,
            ...uris.map((uri) => ({
                key: makeKey(),
                uri,
                caption: "",
            })),
        ]);
    };

    const takePhoto = async () => {
        setIsSourceModalVisible(false);

        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                "İzin Gerekli",
                "Fotoğraf çekebilmek için kamera erişimine izin vermelisiniz."
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            addPhotos(result.assets.map((a) => a.uri));
        }
    };

    const pickFromGallery = async () => {
        setIsSourceModalVisible(false);

        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                "İzin Gerekli",
                "Fotoğraf seçebilmek için galeri erişimine izin vermelisiniz."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 20,
        });

        if (!result.canceled && result.assets.length > 0) {
            addPhotos(result.assets.map((a) => a.uri));
        }
    };

    const removePhoto = (key: string) => {
        setPhotos((prev) => prev.filter((p) => p.key !== key));
    };

    const updateCaption = (key: string, caption: string) => {
        setPhotos((prev) =>
            prev.map((p) => (p.key === key ? { ...p, caption } : p))
        );
    };

    const onUpload = async () => {
        if (photos.length === 0) {
            Alert.alert("Uyarı", "Lütfen önce bir fotoğraf seçin.");
            return;
        }

        try {
            setLoading(true);
            setUploadedCount(0);

            let failed = 0;
            for (const p of photos) {
                try {
                    await uploadPlacePhoto(placeId, p.uri, p.caption);
                    setUploadedCount((c) => c + 1);
                } catch (err) {
                    failed += 1;
                }
            }

            if (failed > 0) {
                Alert.alert(
                    "Kısmi Başarı",
                    `${photos.length - failed} / ${photos.length} fotoğraf yüklendi. ${failed} fotoğraf yüklenemedi.`
                );
            } else {
                Alert.alert(
                    "Başarılı",
                    photos.length === 1
                        ? "Fotoğraf anılara eklendi!"
                        : `${photos.length} fotoğraf anılara eklendi!`
                );
            }
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const canUpload = photos.length > 0 && !loading;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color="#102a43" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {photos.length > 0
                        ? `Fotoğraf Ekle (${photos.length})`
                        : "Fotoğraf Ekle"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {photos.length === 0 ? (
                        <TouchableOpacity
                            style={styles.imagePickerBox}
                            onPress={() => setIsSourceModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.emptyState}>
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name="images"
                                        size={32}
                                        color="#3b82f6"
                                    />
                                </View>
                                <Text style={styles.emptyStateTitle}>
                                    Fotoğraf Ekle
                                </Text>
                                <Text style={styles.emptyStateDesc}>
                                Biriktirdiğiniz anları ölümsüzleştir ✨📸
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <FlatList
                                data={photos}
                                keyExtractor={(item) => item.key}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 4 }}
                                renderItem={({ item }) => (
                                    <View style={styles.thumbWrapper}>
                                        <Image
                                            source={{ uri: item.uri }}
                                            style={styles.thumbImage}
                                        />
                                        <TouchableOpacity
                                            style={styles.thumbRemove}
                                            onPress={() => removePhoto(item.key)}
                                        >
                                            <Ionicons
                                                name="close"
                                                size={16}
                                                color="#fff"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                ListFooterComponent={
                                    <TouchableOpacity
                                        style={styles.addMoreBox}
                                        onPress={() =>
                                            setIsSourceModalVisible(true)
                                        }
                                    >
                                        <Ionicons
                                            name="add"
                                            size={30}
                                            color="#3b82f6"
                                        />
                                        <Text style={styles.addMoreText}>
                                            Ekle
                                        </Text>
                                    </TouchableOpacity>
                                }
                            />

                            <View style={{ height: 16 }} />

                            {photos.map((p, idx) => (
                                <View
                                    key={p.key}
                                    style={styles.captionCard}
                                >
                                    <View style={styles.captionHeader}>
                                        <Image
                                            source={{ uri: p.uri }}
                                            style={styles.captionThumb}
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.captionIndex}>
                                                Fotoğraf {idx + 1}
                                            </Text>
                                            <Text style={styles.captionHint}>
                                                İstersen bu fotoğraf için not ekle
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removePhoto(p.key)}
                                            style={styles.captionRemoveBtn}
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={18}
                                                color="#dc2626"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Bu fotoğrafla ilgili ne hatırlıyorsunuz?"
                                        placeholderTextColor="#94a3b8"
                                        value={p.caption}
                                        onChangeText={(t) =>
                                            updateCaption(p.key, t)
                                        }
                                        multiline
                                    />
                                </View>
                            ))}
                        </>
                    )}

                    <View style={{ height: 24 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.uploadButton,
                            !canUpload && {
                                backgroundColor: "#cbd5e1",
                                shadowOpacity: 0,
                            },
                        ]}
                        onPress={onUpload}
                        disabled={!canUpload}
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator color="white" />
                                <Text
                                    style={[
                                        styles.uploadButtonText,
                                        { marginLeft: 10 },
                                    ]}
                                >
                                    {photos.length > 1
                                        ? `Yükleniyor ${uploadedCount}/${photos.length}`
                                        : "Yükleniyor..."}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="cloud-upload"
                                    size={20}
                                    color="white"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.uploadButtonText}>
                                    {photos.length > 1
                                        ? `${photos.length} Fotoğrafı Yükle`
                                        : "Anıyı Yükle"}
                                </Text>
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
                            <Text style={styles.modalTitle}>
                                Fotoğraf Kaynağı
                            </Text>
                            <Pressable
                                onPress={() => setIsSourceModalVisible(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color="#64748b"
                                />
                            </Pressable>
                        </View>

                        <TouchableOpacity
                            style={styles.sourceOption}
                            onPress={takePhoto}
                        >
                            <View
                                style={[
                                    styles.sourceIcon,
                                    { backgroundColor: "#fef3c7" },
                                ]}
                            >
                                <Ionicons
                                    name="camera"
                                    size={24}
                                    color="#d97706"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sourceOptionTitle}>
                                    Fotoğraf Çek
                                </Text>
                                <Text style={styles.sourceOptionDesc}>
                                    Anında kamera ile fotoğraf çek
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#cbd5e1"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sourceOption}
                            onPress={pickFromGallery}
                        >
                            <View
                                style={[
                                    styles.sourceIcon,
                                    { backgroundColor: "#e0f2fe" },
                                ]}
                            >
                                <Ionicons
                                    name="images"
                                    size={24}
                                    color="#0284c7"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sourceOptionTitle}>
                                    Galeriden Seç
                                </Text>
                                <Text style={styles.sourceOptionDesc}>
                                    Birden fazla fotoğrafı aynı anda
                                    seçebilirsin
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#cbd5e1"
                            />
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e2e8f0",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#102a43" },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

    imagePickerBox: {
        width: "100%",
        height: 320,
        backgroundColor: "#f1f5f9",
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#cbd5e1",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    emptyState: { alignItems: "center", padding: 20 },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#e0f2fe",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 8,
    },
    emptyStateDesc: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        paddingHorizontal: 20,
    },

    thumbWrapper: {
        width: 110,
        height: 110,
        borderRadius: 18,
        marginRight: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    thumbImage: { width: "100%", height: "100%", resizeMode: "cover" },
    thumbRemove: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    addMoreBox: {
        width: 110,
        height: 110,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "#cbd5e1",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    addMoreText: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "700",
        color: "#3b82f6",
    },

    captionCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    captionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    captionThumb: {
        width: 48,
        height: 48,
        borderRadius: 12,
        resizeMode: "cover",
    },
    captionIndex: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0f172a",
    },
    captionHint: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
    },
    captionRemoveBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#fef2f2",
        justifyContent: "center",
        alignItems: "center",
    },
    textInput: {
        backgroundColor: "#f8fafc",
        borderRadius: 14,
        padding: 12,
        fontSize: 14,
        color: "#0f172a",
        minHeight: 70,
        textAlignVertical: "top",
    },

    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 30 : 16,
        backgroundColor: "#f8fafc",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    uploadButton: {
        flexDirection: "row",
        backgroundColor: "#2F7E8D",
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2F7E8D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    uploadButtonText: { color: "white", fontSize: 16, fontWeight: "800" },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 40,
        maxHeight: "70%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
    sourceOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    sourceIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    sourceOptionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    sourceOptionDesc: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
});
