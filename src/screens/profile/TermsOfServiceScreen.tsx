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

export default function TermsOfServiceScreen() {
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
                        <Text style={styles.headerTitle}>Kullanım Şartları</Text>
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
                        Lets Together uygulamasını (&quot;Uygulama&quot;) indirerek,
                        kurarak veya kullanarak aşağıdaki Kullanım Şartları&apos;nı
                        kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız
                        uygulamayı kullanmamanız gerekir.
                    </Text>

                    <Text style={styles.sectionTitle}>1. Hesap Oluşturma</Text>
                    <Text style={styles.paragraph}>
                        Hesap oluştururken doğru, güncel ve eksiksiz bilgi vermelisiniz.
                        Hesap güvenliğinden ve hesabınız üzerinden yapılan tüm
                        işlemlerden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız.
                    </Text>
                    <Text style={styles.paragraph}>
                        13 yaşın altındaki kullanıcıların hesap açması yasaktır. 18 yaş
                        altı kullanıcılar ebeveyn/veli izni ile uygulamayı
                        kullanabilir.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Kullanıcı İçeriği</Text>
                    <Text style={styles.paragraph}>
                        Uygulamaya yüklediğiniz mekanlar, fotoğraflar, yorumlar ve
                        diğer içerikler size aittir. Bu içerikleri yüklerken, onları
                        grup üyelerinizle paylaşmamıza izin vermiş olursunuz.
                    </Text>
                    <Text style={styles.paragraph}>
                        Aşağıdaki türde içerik yüklenemez ve paylaşılamaz:
                    </Text>
                    <Text style={styles.bullet}>
                        • Yasalara, kamu ahlakına ve genel adaba aykırı içerikler
                    </Text>
                    <Text style={styles.bullet}>
                        • Şiddet, nefret söylemi, taciz veya ayrımcılık içeren paylaşımlar
                    </Text>
                    <Text style={styles.bullet}>
                        • Başkalarının telif, marka veya özel hayatına ilişkin haklarını
                        ihlal eden içerikler
                    </Text>
                    <Text style={styles.bullet}>
                        • Spam, reklam veya dolandırıcılık amaçlı paylaşımlar
                    </Text>
                    <Text style={styles.bullet}>
                        • Zararlı yazılım, virüs veya kötü niyetli kod içeren dosyalar
                    </Text>

                    <Text style={styles.sectionTitle}>3. Hizmetin Kullanımı</Text>
                    <Text style={styles.paragraph}>
                        Uygulamayı yalnızca kişisel, ticari olmayan amaçlarla ve
                        yürürlükteki kanunlara uygun şekilde kullanabilirsiniz.
                        Uygulamanın altyapısına zarar vermeye çalışmak, otomatik
                        sistemlerle erişim (scraping, bot vb.), ters mühendislik
                        yapmak veya güvenlik önlemlerini aşmaya çalışmak yasaktır.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Fikri Mülkiyet</Text>
                    <Text style={styles.paragraph}>
                        Uygulamanın tasarımı, logosu, arayüzü, kaynak kodu ve tüm
                        marka unsurları Lets Together&apos;a aittir. İzinsiz
                        kopyalanamaz, çoğaltılamaz veya dağıtılamaz.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        5. Hesap Askıya Alma ve Sonlandırma
                    </Text>
                    <Text style={styles.paragraph}>
                        Bu şartların ihlali halinde hesabınızı geçici olarak askıya
                        alabilir veya kalıcı olarak kapatabiliriz. Hesabınızı istediğiniz
                        zaman &quot;Gizlilik ve Güvenlik&quot; menüsündeki &quot;Hesabımı
                        Sil&quot; butonuyla kapatabilirsiniz.
                    </Text>

                    <Text style={styles.sectionTitle}>6. Sorumluluk Sınırı</Text>
                    <Text style={styles.paragraph}>
                        Uygulama &quot;olduğu gibi&quot; sunulur. Hizmetin kesintisiz
                        veya hatasız çalışacağına dair garanti verilmez. Kullanıcılar
                        tarafından paylaşılan içeriklerin doğruluğundan veya
                        güvenilirliğinden Lets Together sorumlu değildir.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Değişiklikler</Text>
                    <Text style={styles.paragraph}>
                        Kullanım Şartları zaman zaman güncellenebilir. Önemli
                        değişiklikler olduğunda uygulama içinde veya e-posta yoluyla
                        bildirim yapılır. Güncellemenin ardından uygulamayı kullanmaya
                        devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Uygulanacak Hukuk</Text>
                    <Text style={styles.paragraph}>
                        Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir.
                        Anlaşmazlıklarda İstanbul Merkez Mahkemeleri ve İcra
                        Daireleri yetkilidir.
                    </Text>

                    <Text style={styles.sectionTitle}>9. İletişim</Text>
                    <Text style={styles.paragraph}>
                        Soru ve talepleriniz için uygulama içi &quot;Yardım ve
                        Destek&quot; menüsünden bize ulaşabilirsiniz.
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
