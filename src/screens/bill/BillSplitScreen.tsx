import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    deletePlaceBill,
    getPlaceBill,
    upsertPlaceBill,
} from "../../api/bills";
import { getGroupMembers } from "../../api/groups";
import CustomAlert from "../../components/common/CustomAlert";
import { useAuth } from "../../hooks/useAuth";
import {
    Bill,
    BillItemInput,
    BillPaymentInput,
    SUPPORTED_CURRENCIES,
    Transfer,
    UserBalance,
    getCurrencySymbol,
} from "../../types/bill";
import { GroupMember } from "../../types/group";
import { getApiErrorMessage } from "../../utils/helpers";

type ItemDraft = {
    key: string;
    title: string;
    amountText: string;
    responsibleUserIds: string[];
    payerUserId: string;
};

function parseAmount(text: string): number {
    if (!text) return 0;
    const cleaned = String(text).replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function formatAmount(n: number): string {
    if (!isFinite(n)) return "0.00";
    return (Math.round(n * 100) / 100).toFixed(2);
}

function genKey() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function BillSplitScreen({ route, navigation }: any) {
    const { placeId, groupId, placeTitle } = route.params || {};
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bill, setBill] = useState<Bill | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);

    // form state
    const [title, setTitle] = useState<string>("");
    const [currency, setCurrency] = useState<string>("TRY");
    const [items, setItems] = useState<ItemDraft[]>([]);

    // ui state
    const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
    const [responsiblePickerItemKey, setResponsiblePickerItemKey] =
        useState<string | null>(null);
    const [itemPayerPickerItemKey, setItemPayerPickerItemKey] = useState<
        string | null
    >(null);
    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

    const totalAmount = useMemo(
        () => items.reduce((s, it) => s + parseAmount(it.amountText), 0),
        [items]
    );
    const totalPaid = useMemo(
        () =>
            items.reduce(
                (s, it) =>
                    s + (it.payerUserId ? parseAmount(it.amountText) : 0),
                0
            ),
        [items]
    );

    const memberNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const m of members) map[m.userId] = m.name;
        return map;
    }, [members]);

    // local balances preview (before saving)
    const localBalances: UserBalance[] = useMemo(() => {
        const owed: Record<string, number> = {};
        const paid: Record<string, number> = {};
        for (const it of items) {
            const amt = parseAmount(it.amountText);
            const count = it.responsibleUserIds.length;
            if (count === 0 || amt <= 0) continue;
            const per = amt / count;
            for (const uid of it.responsibleUserIds) {
                owed[uid] = (owed[uid] || 0) + per;
            }
        }
        for (const it of items) {
            const amt = parseAmount(it.amountText);
            if (!it.payerUserId || amt <= 0) continue;
            paid[it.payerUserId] = (paid[it.payerUserId] || 0) + amt;
        }
        const ids = new Set<string>([
            ...Object.keys(owed),
            ...Object.keys(paid),
        ]);
        return Array.from(ids)
            .map((uid) => {
                const o = owed[uid] || 0;
                const pa = paid[uid] || 0;
                return {
                    userId: uid,
                    userName: memberNameById[uid] || "",
                    owedShare: Math.round(o * 100) / 100,
                    paid: Math.round(pa * 100) / 100,
                    netBalance: Math.round((pa - o) * 100) / 100,
                };
            })
            .sort((a, b) => a.userName.localeCompare(b.userName));
    }, [items, memberNameById]);

    const localTransfers: Transfer[] = useMemo(() => {
        const eps = 0.01;
        const creditors = localBalances
            .filter((b) => b.netBalance > eps)
            .map((b) => ({ ...b, remaining: b.netBalance }))
            .sort((a, b) => b.remaining - a.remaining);
        const debtors = localBalances
            .filter((b) => b.netBalance < -eps)
            .map((b) => ({ ...b, remaining: -b.netBalance }))
            .sort((a, b) => b.remaining - a.remaining);
        const out: Transfer[] = [];
        let i = 0,
            j = 0;
        while (i < creditors.length && j < debtors.length) {
            const c = creditors[i];
            const d = debtors[j];
            const amt = Math.round(Math.min(c.remaining, d.remaining) * 100) / 100;
            if (amt >= eps) {
                out.push({
                    fromUserId: d.userId,
                    fromUserName: d.userName,
                    toUserId: c.userId,
                    toUserName: c.userName,
                    amount: amt,
                });
            }
            c.remaining -= amt;
            d.remaining -= amt;
            if (c.remaining < eps) i++;
            if (d.remaining < eps) j++;
        }
        return out;
    }, [localBalances]);

    const load = useCallback(async () => {
        if (!placeId) return;
        try {
            setLoading(true);
            const [billData, memberList] = await Promise.all([
                getPlaceBill(placeId),
                groupId ? getGroupMembers(groupId) : Promise.resolve([]),
            ]);

            setMembers(memberList || []);
            setBill(billData);

            if (billData) {
                setTitle(billData.title || "");
                setCurrency(billData.currency || "TRY");

                // migrate old payments to per-item payer: if only one unique
                // payer exists in payments, assign to all items; otherwise
                // try to match by amount, else leave blank
                const uniquePayers = Array.from(
                    new Set(billData.payments.map((p) => p.userId))
                );
                const amountToPayer: Record<string, string> = {};
                if (uniquePayers.length > 1) {
                    for (const p of billData.payments) {
                        amountToPayer[formatAmount(p.amount)] = p.userId;
                    }
                }
                const defaultPayer =
                    uniquePayers.length === 1 ? uniquePayers[0] : "";

                setItems(
                    billData.items.map((it) => ({
                        key: it.id || genKey(),
                        title: it.title,
                        amountText: formatAmount(it.amount),
                        responsibleUserIds: it.responsibleUsers.map(
                            (r) => r.userId
                        ),
                        payerUserId:
                            defaultPayer ||
                            amountToPayer[formatAmount(it.amount)] ||
                            "",
                    }))
                );
            } else {
                // fresh: start with one empty item, current user as default payer
                setItems([
                    {
                        key: genKey(),
                        title: "",
                        amountText: "",
                        responsibleUserIds: (memberList || []).map(
                            (m) => m.userId
                        ),
                        payerUserId: user?.id || "",
                    },
                ]);
            }
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [placeId, groupId, user?.id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    // ---------- Item helpers ----------
    const addItem = () => {
        // default payer = previous item's payer if any, else current user
        const prevPayer =
            items.length > 0
                ? items[items.length - 1].payerUserId
                : user?.id || "";
        setItems((prev) => [
            ...prev,
            {
                key: genKey(),
                title: "",
                amountText: "",
                responsibleUserIds: members.map((m) => m.userId),
                payerUserId: prevPayer,
            },
        ]);
    };

    const updateItem = (key: string, patch: Partial<ItemDraft>) => {
        setItems((prev) =>
            prev.map((it) => (it.key === key ? { ...it, ...patch } : it))
        );
    };

    const removeItem = (key: string) => {
        setItems((prev) => prev.filter((it) => it.key !== key));
    };

    const toggleResponsible = (itemKey: string, userId: string) => {
        setItems((prev) =>
            prev.map((it) => {
                if (it.key !== itemKey) return it;
                const has = it.responsibleUserIds.includes(userId);
                return {
                    ...it,
                    responsibleUserIds: has
                        ? it.responsibleUserIds.filter((u) => u !== userId)
                        : [...it.responsibleUserIds, userId],
                };
            })
        );
    };

    // ---------- Save / delete ----------
    const onSave = async () => {
        if (items.length === 0) {
            Alert.alert("Eksik", "En az bir harcama eklemelisin.");
            return;
        }
        for (const it of items) {
            if (!it.title.trim()) {
                Alert.alert("Eksik", "Her harcamanın bir adı olmalı.");
                return;
            }
            if (parseAmount(it.amountText) <= 0) {
                Alert.alert("Eksik", `'${it.title}' tutarı geçersiz.`);
                return;
            }
            if (it.responsibleUserIds.length === 0) {
                Alert.alert(
                    "Eksik",
                    `'${it.title}' için en az bir sorumlu kişi seç.`
                );
                return;
            }
            if (!it.payerUserId) {
                Alert.alert(
                    "Eksik",
                    `'${it.title}' için kimin ödediğini seç.`
                );
                return;
            }
        }

        const itemsInput: BillItemInput[] = items.map((it) => ({
            title: it.title.trim(),
            amount: parseAmount(it.amountText),
            responsibleUserIds: it.responsibleUserIds,
        }));

        // aggregate per-item payments by user
        const paymentMap: Record<string, number> = {};
        for (const it of items) {
            const amt = parseAmount(it.amountText);
            if (!it.payerUserId || amt <= 0) continue;
            paymentMap[it.payerUserId] =
                (paymentMap[it.payerUserId] || 0) + amt;
        }
        const paymentsInput: BillPaymentInput[] = Object.entries(
            paymentMap
        ).map(([userId, amount]) => ({
            userId,
            amount: Math.round(amount * 100) / 100,
        }));

        try {
            setSaving(true);
            const updated = await upsertPlaceBill(placeId, {
                title: title.trim() || null,
                currency,
                items: itemsInput,
                payments: paymentsInput,
            });
            setBill(updated);
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        try {
            setSaving(true);
            await deletePlaceBill(placeId);
            navigation.goBack();
        } catch (err) {
            Alert.alert("Hata", getApiErrorMessage(err));
        } finally {
            setSaving(false);
            setDeleteAlertVisible(false);
        }
    };

    const sym = getCurrencySymbol(currency);
    const diff = Math.round((totalAmount - totalPaid) * 100) / 100;

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2F7E8D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                >
                    <Ionicons name="chevron-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Hesap Paylaş
                    </Text>
                    {!!placeTitle && (
                        <Text style={styles.headerSub} numberOfLines={1}>
                            {placeTitle}
                        </Text>
                    )}
                </View>
                {bill ? (
                    <TouchableOpacity
                        onPress={() => setDeleteAlertVisible(true)}
                        style={styles.headerBtn}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={22}
                            color="#dc2626"
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerBtn} />
                )}
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Items */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Harcamalar</Text>
                    <TouchableOpacity
                        onPress={addItem}
                        style={styles.sectionBtn}
                    >
                        <Ionicons name="add" size={18} color="#2F7E8D" />
                        <Text style={styles.sectionBtnText}>Harcama ekle</Text>
                    </TouchableOpacity>
                </View>

                {items.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>
                            Henüz harcama eklenmedi.
                        </Text>
                    </View>
                )}

                {items.map((it, idx) => (
                    <View key={it.key} style={styles.itemCard}>
                        <View style={styles.itemHeaderRow}>
                            <Text style={styles.itemIndex}># Harcama {idx + 1}</Text>
                            <TouchableOpacity
                                onPress={() => removeItem(it.key)}
                                style={styles.itemRemoveBtn}
                            >
                                <Ionicons
                                    name="close"
                                    size={18}
                                    color="#dc2626"
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.titleAmountRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Ne Alındı?"
                                placeholderTextColor="#9ca3af"
                                value={it.title}
                                onChangeText={(t) =>
                                    updateItem(it.key, { title: t })
                                }
                            />
                            <TextInput
                                style={[styles.input, styles.amountInput]}
                                placeholder="₺ 0.00"
                                placeholderTextColor="#9ca3af"
                                textAlign="center"
                                keyboardType="decimal-pad"
                                value={it.amountText}
                                onChangeText={(t) =>
                                    updateItem(it.key, { amountText: t })
                                }
                            />
                        </View>

                        <Text style={[styles.label, { marginTop: 10 }]}>
                            # Ödeme {idx + 1} — Kim Ödedi?
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                setItemPayerPickerItemKey(it.key)
                            }
                            style={styles.payerPickerRow}
                        >
                            {it.payerUserId ? (
                                <>
                                    <View style={styles.avatarSmInline}>
                                        <Ionicons
                                            name="person"
                                            size={14}
                                            color="#fff"
                                        />
                                    </View>
                                    <Text style={styles.payerPickerText}>
                                        {memberNameById[it.payerUserId] ||
                                            "Bilinmeyen"}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.placeholderInline}>
                                    Ödeyeni seç
                                </Text>
                            )}
                            <View style={{ flex: 1 }} />
                            <Ionicons
                                name="chevron-down"
                                size={16}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>

                        <Text style={[styles.label, { marginTop: 10 }]}>
                            Sorumlular ({it.responsibleUserIds.length})
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                setResponsiblePickerItemKey(it.key)
                            }
                            style={styles.responsibleRow}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    flex: 1,
                                    gap: 6,
                                }}
                            >
                                {it.responsibleUserIds.length === 0 ? (
                                    <Text style={styles.placeholderInline}>
                                        Sorumlu seç
                                    </Text>
                                ) : (
                                    it.responsibleUserIds.map((uid) => (
                                        <View key={uid} style={styles.chip}>
                                            <Text style={styles.chipText}>
                                                {memberNameById[uid] ||
                                                    "Bilinmeyen"}
                                            </Text>
                                        </View>
                                    ))
                                )}
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>

                        {it.responsibleUserIds.length > 0 &&
                            parseAmount(it.amountText) > 0 && (
                                <Text style={styles.perUserText}>
                                    Kişi başı:{" "}
                                    {sym}
                                    {formatAmount(
                                        parseAmount(it.amountText) /
                                            it.responsibleUserIds.length
                                    )}
                                </Text>
                            )}
                    </View>
                ))}

                {/* Balances */}
                {localBalances.length > 0 && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <Text style={styles.sectionTitleInline}>Bakiyeler</Text>
                        {localBalances.map((b) => (
                            <View key={b.userId} style={styles.balanceRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.balanceName}>
                                        {b.userName}
                                    </Text>
                                    <Text style={styles.balanceDetail}>
                                        Ödedi: {sym}
                                        {formatAmount(b.paid)}  •  Payı: {sym}
                                        {formatAmount(b.owedShare)}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.balanceNet,
                                        {
                                            color:
                                                b.netBalance > 0.01
                                                    ? "#16a34a"
                                                    : b.netBalance < -0.01
                                                    ? "#dc2626"
                                                    : "#6b7280",
                                        },
                                    ]}
                                >
                                    {b.netBalance > 0 ? "+" : ""}
                                    {sym}
                                    {formatAmount(b.netBalance)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Suggested transfers */}
                {localTransfers.length > 0 && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <Text style={styles.sectionTitleInline}>
                            Kim Kime Ne Atacak?
                        </Text>
                        {localTransfers.map((t, i) => (
                            <View key={i} style={styles.transferRow}>
                                <View style={styles.transferAvatar}>
                                    <Text style={styles.avatarText}>
                                        {t.fromUserName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.transferText}>
                                        <Text style={{ fontWeight: "700" }}>
                                            {t.fromUserName}
                                        </Text>{" "}
                                        →{" "}
                                        <Text style={{ fontWeight: "700" }}>
                                            {t.toUserName}
                                        </Text>
                                    </Text>
                                </View>
                                <Text style={styles.transferAmount}>
                                    {sym}
                                    {formatAmount(t.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Save button */}
            <View style={styles.saveBar}>
                <TouchableOpacity
                    style={[
                        styles.saveBtn,
                        saving && { opacity: 0.6 },
                    ]}
                    onPress={onSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.saveBtnText}>Kaydet</Text>
                        </>
                    )}
                    
                </TouchableOpacity>
            </View>

            {/* Currency picker */}
            <Modal
                transparent
                visible={currencyPickerVisible}
                animationType="fade"
                onRequestClose={() => setCurrencyPickerVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setCurrencyPickerVisible(false)}
                >
                    <Pressable style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Para Birimi</Text>
                        {SUPPORTED_CURRENCIES.map((c) => (
                            <TouchableOpacity
                                key={c.code}
                                style={styles.modalOption}
                                onPress={() => {
                                    setCurrency(c.code);
                                    setCurrencyPickerVisible(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>
                                    {c.symbol}  {c.code} — {c.label}
                                </Text>
                                {c.code === currency && (
                                    <Ionicons
                                        name="checkmark"
                                        size={18}
                                        color="#2F7E8D"
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Responsible users picker for a specific item */}
            <Modal
                transparent
                visible={responsiblePickerItemKey !== null}
                animationType="fade"
                onRequestClose={() => setResponsiblePickerItemKey(null)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setResponsiblePickerItemKey(null)}
                >
                    <Pressable
                        style={[styles.modalCard, { maxHeight: "70%" }]}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                            }}
                        >
                            <Text style={styles.modalTitle}>Sorumlular</Text>
                            {responsiblePickerItemKey && (
                                <View style={{ flexDirection: "row", gap: 6 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const key =
                                                responsiblePickerItemKey;
                                            if (!key) return;
                                            updateItem(key, {
                                                responsibleUserIds: members.map(
                                                    (m) => m.userId
                                                ),
                                            });
                                        }}
                                        style={styles.quickBtn}
                                    >
                                        <Text style={styles.quickBtnText}>
                                            Herkes
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const key =
                                                responsiblePickerItemKey;
                                            if (!key) return;
                                            updateItem(key, {
                                                responsibleUserIds: [],
                                            });
                                        }}
                                        style={styles.quickBtn}
                                    >
                                        <Text style={styles.quickBtnText}>
                                            Temizle
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <ScrollView>
                            {members.map((m) => {
                                const currentItem = items.find(
                                    (it) => it.key === responsiblePickerItemKey
                                );
                                const checked =
                                    !!currentItem?.responsibleUserIds.includes(
                                        m.userId
                                    );
                                return (
                                    <TouchableOpacity
                                        key={m.userId}
                                        onPress={() => {
                                            if (!responsiblePickerItemKey)
                                                return;
                                            toggleResponsible(
                                                responsiblePickerItemKey,
                                                m.userId
                                            );
                                        }}
                                        style={styles.checkRow}
                                    >
                                        <View style={styles.avatarSm}>
                                            <Text style={styles.avatarText}>
                                                {m.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{
                                                flex: 1,
                                                color: "#1f2937",
                                                fontSize: 15,
                                            }}
                                        >
                                            {m.name}
                                        </Text>
                                        <Ionicons
                                            name={
                                                checked
                                                    ? "checkbox"
                                                    : "square-outline"
                                            }
                                            size={22}
                                            color={
                                                checked
                                                    ? "#2F7E8D"
                                                    : "#9ca3af"
                                            }
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalDoneBtn}
                            onPress={() => setResponsiblePickerItemKey(null)}
                        >
                            <Text style={styles.modalDoneBtnText}>Tamam</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Per-item payer picker */}
            <Modal
                transparent
                visible={itemPayerPickerItemKey !== null}
                animationType="fade"
                onRequestClose={() => setItemPayerPickerItemKey(null)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setItemPayerPickerItemKey(null)}
                >
                    <Pressable style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Kim Ödedi?</Text>
                        <ScrollView>
                            {members.map((m) => {
                                const currentItem = items.find(
                                    (it) =>
                                        it.key === itemPayerPickerItemKey
                                );
                                const selected =
                                    currentItem?.payerUserId === m.userId;
                                return (
                                    <TouchableOpacity
                                        key={m.userId}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            const key =
                                                itemPayerPickerItemKey;
                                            if (!key) return;
                                            updateItem(key, {
                                                payerUserId: m.userId,
                                            });
                                            setItemPayerPickerItemKey(null);
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                flex: 1,
                                            }}
                                        >
                                            <View style={styles.avatarSm}>
                                                <Ionicons
                                                    name="person"
                                                    size={16}
                                                    color="#fff"
                                                />
                                            </View>
                                            <Text style={styles.modalOptionText}>
                                                {m.name}
                                            </Text>
                                        </View>
                                        {selected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color="#2F7E8D"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            <CustomAlert
                visible={deleteAlertVisible}
                title="Hesabı sil"
                message="Bu hesabı silmek istediğine emin misin?"
                type="danger"
                confirmText="Sil"
                cancelText="Vazgeç"
                onConfirm={onDelete}
                onCancel={() => setDeleteAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f3f4f6" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1f2937",
    },
    headerSub: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 1,
    },
    label: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 6,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: "#1f2937",
    },
    pickerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    pickerText: {
        fontSize: 15,
        color: "#1f2937",
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: -8,
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
    },
    sectionTitleInline: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 10,
    },
    sectionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#e0f2f1",
    },
    sectionBtnText: {
        color: "#2F7E8D",
        fontSize: 13,
        fontWeight: "600",
    },
    emptyBox: {
        padding: 20,
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    emptyText: {
        color: "#9ca3af",
        fontSize: 13,
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 1,
    },
    itemHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    itemIndex: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
    },
    itemRemoveBtn: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "#fee2e2",
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    amountSym: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1f2937",
        width: 28,
        textAlign: "center",
    },
    titleAmountRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    amountInput: {
        width: 100,
        textAlign: "right",
    },
    payerPickerRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
    },
    payerPickerText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f2937",
    },
    avatarSmInline: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#2F7E8D",
        alignItems: "center",
        justifyContent: "center",
    },
    responsibleRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    chip: {
        backgroundColor: "#e0f2f1",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    chipText: {
        color: "#2F7E8D",
        fontSize: 12,
        fontWeight: "600",
    },
    placeholderInline: {
        color: "#9ca3af",
        fontSize: 14,
        paddingHorizontal: 2,
    },
    perUserText: {
        color: "#6b7280",
        fontSize: 12,
        marginTop: 6,
        fontStyle: "italic",
    },
    paymentCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 1,
    },
    payerPicker: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    payerName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#1f2937",
    },
    paymentRemoveBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "#fee2e2",
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#2F7E8D",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarSm: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#2F7E8D",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    totalsCard: {
        marginTop: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 1,
    },
    totalsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },
    totalsLabel: {
        fontSize: 14,
        color: "#6b7280",
    },
    totalsValue: {
        fontSize: 15,
        color: "#1f2937",
    },
    totalsDivider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 6,
    },
    warnText: {
        marginTop: 6,
        fontSize: 12,
        color: "#dc2626",
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    balanceName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f2937",
    },
    balanceDetail: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    balanceNet: {
        fontSize: 15,
        fontWeight: "700",
    },
    transferRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    transferAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#2F7E8D",
        alignItems: "center",
        justifyContent: "center",
    },
    transferText: {
        fontSize: 14,
        color: "#1f2937",
    },
    transferAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2F7E8D",
    },
    saveBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    saveBtn: {
        backgroundColor: "#2F7E8D",
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 6,
    },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    modalOptionText: {
        fontSize: 15,
        color: "#1f2937",
    },
    modalDoneBtn: {
        marginTop: 8,
        backgroundColor: "#2F7E8D",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalDoneBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    checkRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    quickBtn: {
        backgroundColor: "#e0f2f1",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    quickBtnText: {
        color: "#2F7E8D",
        fontSize: 12,
        fontWeight: "600",
    },
});
