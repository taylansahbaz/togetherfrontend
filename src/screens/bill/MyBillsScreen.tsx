import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getMyBills } from "../../api/bills";
import { useAuth } from "../../hooks/useAuth";
import { Bill, MyBillsResponse, getCurrencySymbol } from "../../types/bill";
import { formatDate } from "../../utils/date";
import { getApiErrorMessage } from "../../utils/helpers";

function formatMoney(amount: number, currency: string): string {
    const sym = getCurrencySymbol(currency);
    return `${sym}${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

export default function MyBillsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<MyBillsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const res = await getMyBills();
            setData(res);
        } catch (err: any) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const renderBillCard = (b: Bill) => {
        const subtitle = b.title || b.placeTitle;

        // incoming = others owe me, outgoing = I owe others
        const incoming = b.suggestedTransfers.filter(
            (t) => t.toUserId === user?.id
        );
        const outgoing = b.suggestedTransfers.filter(
            (t) => t.fromUserId === user?.id
        );
        const incomingSum = incoming.reduce((s, t) => s + t.amount, 0);
        const outgoingSum = outgoing.reduce((s, t) => s + t.amount, 0);
        const net = incomingSum - outgoingSum;

        let statusColor = "#64748b";
        let statusLabel = "Hesap temiz";
        let statusBg = "#f1f5f9";
        if (net > 0.01) {
            statusLabel = `Sana ${formatMoney(net, b.currency)} gelecek`;
            statusColor = "#16a34a";
            statusBg = "#dcfce7";
        } else if (net < -0.01) {
            statusLabel = `${formatMoney(Math.abs(net), b.currency)} vereceksin`;
            statusColor = "#dc2626";
            statusBg = "#fee2e2";
        }

        return (
            <TouchableOpacity
                key={b.id}
                style={styles.billCard}
                onPress={() =>
                    navigation.navigate("BillSplit", {
                        placeId: b.placeId,
                        groupId: b.groupId,
                        placeTitle: b.placeTitle,
                    })
                }
            >
                <View style={styles.billHeader}>
                    <View style={styles.iconBox}>
                        <Ionicons name="receipt-outline" size={18} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.billTitle} numberOfLines={1}>{subtitle}</Text>
                        <Text style={styles.billSubtitle} numberOfLines={1}>
                            {b.groupName ? `${b.groupName} • ` : ""}
                            {formatDate(b.updatedAt || b.createdAt)}
                        </Text>
                    </View>
                    <Text style={styles.billTotal}>{formatMoney(b.totalAmount, b.currency)}</Text>
                </View>

                <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusLabel}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hesap Paylaş</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {data && data.balancesByCurrency.length > 0 ? (
                    data.balancesByCurrency.map((summary) => {
                        const net = summary.netBalance;
                        const netColor =
                            net > 0 ? "#16a34a" : net < 0 ? "#dc2626" : "#64748b";
                        return (
                            <View key={summary.currency} style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>
                                    {getCurrencySymbol(summary.currency)} {summary.currency} Özeti
                                </Text>
                                <View style={styles.summaryGrid}>
                                    <View style={styles.summaryCell}>
                                        <Text style={styles.summaryCellLabel}>Alacak</Text>
                                        <Text style={[styles.summaryCellValue, { color: "#16a34a" }]}>
                                            {formatMoney(summary.totalOwed, summary.currency)}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryCell}>
                                        <Text style={styles.summaryCellLabel}>Borç</Text>
                                        <Text style={[styles.summaryCellValue, { color: "#dc2626" }]}>
                                            {formatMoney(summary.totalOwing, summary.currency)}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryCell}>
                                        <Text style={styles.summaryCellLabel}>Net</Text>
                                        <Text style={[styles.summaryCellValue, { color: netColor }]}>
                                            {net >= 0 ? "+" : ""}
                                            {formatMoney(net, summary.currency)}
                                        </Text>
                                    </View>
                                </View>

                                {summary.counterparties.length > 0 && (
                                    <View style={styles.counterpartiesWrap}>
                                        {summary.counterparties.map((c) => {
                                            const isOwed = c.netAmount > 0;
                                            return (
                                                <View key={c.userId} style={styles.counterRow}>
                                                    <View style={styles.counterAvatar}>
                                                        <Text style={styles.counterAvatarText}>
                                                            {c.userName.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.counterName} numberOfLines={1}>
                                                        {c.userName}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.counterAmount,
                                                            { color: isOwed ? "#16a34a" : "#dc2626" },
                                                        ]}
                                                    >
                                                        {isOwed ? "alacak: " : "borç: "}
                                                        {formatMoney(
                                                            Math.abs(c.netAmount),
                                                            summary.currency
                                                        )}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="receipt-outline" size={42} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>Henüz hesap yok</Text>
                        <Text style={styles.emptyText}>
                            Bir plana ait hesap oluşturduğunda burada listelenecek.
                        </Text>
                    </View>
                )}

                {data && data.bills.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Tüm Hesaplar</Text>
                        {data.bills.map(renderBillCard)}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backBtn: { width: 32 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "900", color: "#0f172a", textAlign: "center" },
    errorText: { color: "#dc2626", textAlign: "center", marginBottom: 12 },
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    summaryTitle: { fontSize: 14, fontWeight: "900", color: "#0f172a", marginBottom: 10 },
    summaryGrid: { flexDirection: "row", gap: 10 },
    summaryCell: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
    },
    summaryCellLabel: { fontSize: 10, fontWeight: "800", color: "#64748b", textTransform: "uppercase" },
    summaryCellValue: { fontSize: 15, fontWeight: "900", marginTop: 4 },
    counterpartiesWrap: { marginTop: 12, gap: 8 },
    counterRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    counterAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#c7d2fe",
        alignItems: "center",
        justifyContent: "center",
    },
    counterAvatarText: { fontSize: 12, fontWeight: "900", color: "#1e1b4b" },
    counterName: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a" },
    counterAmount: { fontSize: 12, fontWeight: "900" },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "900",
        color: "#64748b",
        textTransform: "uppercase",
        marginTop: 8,
        marginBottom: 10,
    },
    billCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    billHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "#ede9fe",
        alignItems: "center",
        justifyContent: "center",
    },
    billTitle: { fontSize: 14, fontWeight: "900", color: "#0f172a" },
    billSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },
    billTotal: { fontSize: 14, fontWeight: "900", color: "#0f172a" },
    statusPill: {
        alignSelf: "flex-start",
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    statusText: { fontSize: 11, fontWeight: "900" },
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 26,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: "900", color: "#0f172a" },
    emptyText: { marginTop: 6, fontSize: 12, color: "#64748b", textAlign: "center" },
});
