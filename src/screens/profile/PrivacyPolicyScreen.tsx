import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PrivacyPolicyScreen() {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <View style={styles.navyHeader}>
                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.lastUpdated}>
                        Son güncelleme: 20 Nisan 2026
                    </Text>

                    <Text style={styles.paragraph}>
                        Bu Gizlilik Politikası; Lets Together (&quot;Uygulama&quot;)
                        tarafından toplanan, işlenen ve saklanan kişisel verileri,
                        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve
                        geçerli diğer mevzuata uygun olarak açıklamak amacıyla
                        hazırlanmıştır.
                    </Text>

                    <Text style={styles.sectionTitle}>1. Topladığımız Veriler</Text>
                    <Text style={styles.paragraph}>
                        Uygulamayı kullanırken aşağıdaki verileri toplayabiliriz:
                    </Text>
                    <Text style={styles.bullet}>
                        • Ad soyad, e-posta adresi (hesap oluşturma sırasında)
                    </Text>
                    <Text style={styles.bullet}>
                        • Google veya Apple ile giriş yaparsanız, bu sağlayıcılardan
                        alınan temel profil bilgileri
                    </Text>
                    <Text style={styles.bullet}>
                        • Oluşturduğunuz gruplar, mekanlar, yorumlar, fotoğraflar,
                        plan ve RSVP yanıtları
                    </Text>
                    <Text style={styles.bullet}>
                        • Cihaz bildirim jetonu (push bildirim göndermek için)
                    </Text>
                    <Text style={styles.bullet}>
                        • Mekan eklerken paylaştığınız konum bilgisi (enlem/boylam)
                    </Text>
                    <Text style={styles.bullet}>
                        • Uygulama kullanım günlükleri (hata takibi ve güvenlik amacıyla)
                    </Text>

                    <Text style={styles.sectionTitle}>
                        2. Verileri Nasıl Kullanıyoruz?
                    </Text>
                    <Text style={styles.paragraph}>
                        Verileriniz yalnızca uygulamanın çalışması ve size daha iyi
                        hizmet verilmesi amacıyla kullanılır:
                    </Text>
                    <Text style={styles.bullet}>
                        • Hesabınızı oluşturmak, kimliğinizi doğrulamak ve oturumunuzu
                        yönetmek için.
                    </Text>
                    <Text style={styles.bullet}>
                        • Grup üyeleriyle mekan, fotoğraf ve hatıraları paylaşabilmeniz
                        için.
                    </Text>
                    <Text style={styles.bullet}>
                        • Plan günü hatırlatmaları ve grup davetleri gibi bildirimleri
                        göndermek için.
                    </Text>
                    <Text style={styles.bullet}>
                        • Hesap silme, şifre sıfırlama ve e-posta doğrulama gibi servis
                        işlemleri için.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Veri Paylaşımı</Text>
                    <Text style={styles.paragraph}>
                        Kişisel verileriniz üçüncü taraflara satılmaz. Sadece aşağıdaki
                        durumlarda veri işleyen tedarikçilerle paylaşılır:
                    </Text>
                    <Text style={styles.bullet}>
                        • Cloudinary: Fotoğraflarınızın barındırılması için.
                    </Text>
                    <Text style={styles.bullet}>
                        • Expo Push Notification servisi: Bildirim gönderimi için.
                    </Text>
                    <Text style={styles.bullet}>
                        • Google / Apple: Yalnızca sosyal giriş seçeneklerinden birini
                        kullandığınızda kimlik doğrulaması amacıyla.
                    </Text>
                    <Text style={styles.bullet}>
                        • Yasal bir zorunluluk durumunda yetkili makamlarla.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Veri Saklama Süresi</Text>
                    <Text style={styles.paragraph}>
                        Hesabınız aktif olduğu sürece verileriniz saklanır. Hesabınızı
                        sildiğinizde, ilgili kişisel verileriniz 30 gün içinde
                        sunucularımızdan kalıcı olarak silinir. Yasal yükümlülükler
                        gerektirdiğinde bu süre değişebilir.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Haklarınız</Text>
                    <Text style={styles.paragraph}>
                        KVKK kapsamında aşağıdaki haklara sahipsiniz:
                    </Text>
                    <Text style={styles.bullet}>
                        • Verilerinize erişim talep etme (uygulama içinde &quot;Verilerimi
                        İndir&quot; özelliği ile).
                    </Text>
                    <Text style={styles.bullet}>
                        • Verilerinizin düzeltilmesini isteme.
                    </Text>
                    <Text style={styles.bullet}>
                        • Hesabınızı ve tüm kişisel verilerinizi silme (&quot;Hesabımı
                        Sil&quot; butonu).
                    </Text>
                    <Text style={styles.bullet}>
                        • Verilerinizin işlenmesine itiraz etme veya sınırlandırma
                        isteme.
                    </Text>

                    <Text style={styles.sectionTitle}>6. Güvenlik</Text>
                    <Text style={styles.paragraph}>
                        Şifreler BCrypt ile hashlenerek saklanır. Tüm API çağrıları
                        JWT tabanlı kimlik doğrulama ile korunur ve HTTPS üzerinden
                        şifreli olarak iletilir.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Çocukların Gizliliği</Text>
                    <Text style={styles.paragraph}>
                        Uygulama 13 yaşın altındaki çocuklara yönelik değildir.
                        Bilinçli olarak bu yaş altındaki kullanıcılardan veri
                        toplamıyoruz.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Değişiklikler</Text>
                    <Text style={styles.paragraph}>
                        Gizlilik politikasında zaman zaman değişiklik yapabiliriz.
                        Önemli değişiklikler uygulama içi bildirim veya e-posta ile
                        size duyurulur.
                    </Text>

                    <Text style={styles.sectionTitle}>9. İletişim</Text>
                    <Text style={styles.paragraph}>
                        Gizlilikle ilgili her türlü talep ve sorularınız için bize
                        uygulama içi destek menüsünden ulaşabilirsiniz.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },

    navyHeader: {
        backgroundColor: "#102a43",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: Platform.OS === "android" ? 40 : 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "800",
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    lastUpdated: {
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: "600",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0f172a",
        marginTop: 20,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: "#475569",
        marginBottom: 6,
    },
    bullet: {
        fontSize: 14,
        lineHeight: 22,
        color: "#475569",
        marginLeft: 4,
        marginBottom: 4,
    },
});
