import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getWishDayRsvps, respondToWishDay } from "../../api/placeRsvp";
import { useAuth } from "../../hooks/useAuth";
import {
  WishDayRsvpMember,
  WishDayRsvpResponse,
  WishDayRsvpSummary,
} from "../../types/place";
import { getApiErrorMessage } from "../../utils/helpers";

type Props = {
  placeId: string;
  onError?: (message: string) => void;
};

type ResponseChoice = Exclude<WishDayRsvpResponse, "NotResponded">;

const RESPONSE_META: Record<
  WishDayRsvpResponse,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Accepted: {
    label: "Katılıyor",
    color: "#0f766e",
    bg: "#d1fae5",
    icon: "checkmark-circle",
  },
  Maybe: {
    label: "Bilmiyor",
    color: "#b45309",
    bg: "#fef3c7",
    icon: "help-circle",
  },
  Rejected: {
    label: "Katılmıyor",
    color: "#b91c1c",
    bg: "#fee2e2",
    icon: "close-circle",
  },
  NotResponded: {
    label: "Bekliyor",
    color: "#475569",
    bg: "#e2e8f0",
    icon: "time-outline",
  },
};

const BUTTON_CHOICES: {
  value: ResponseChoice;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: "Accepted", label: "Katılırım", icon: "checkmark-circle", color: "#16a34a" },
  { value: "Maybe", label: "Kararsızım", icon: "help-circle", color: "#d97706" },
  { value: "Rejected", label: "Katılmam", icon: "close-circle", color: "#dc2626" },
];

export default function WishDayRsvpCard({ placeId, onError }: Props) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WishDayRsvpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState<ResponseChoice | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await getWishDayRsvps(placeId);
      setSummary(data);
      setUnavailable(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setUnavailable(true);
      } else {
        onError?.(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [placeId]);

  const handleRespond = async (choice: ResponseChoice) => {
    if (submitting) return;
    try {
      setSubmitting(choice);
      const data = await respondToWishDay(placeId, choice);
      setSummary(data);
    } catch (err) {
      onError?.(getApiErrorMessage(err));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingBox]}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (unavailable || !summary) {
    return null;
  }

  const currentResponse = summary.currentUserResponse;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIconBox}>
          <Ionicons name="people" size={20} color="#0f766e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Katılım Durumu</Text>
          <Text style={styles.subtitle}>
            {summary.totalMembers} üyenin {summary.acceptedCount +
              summary.maybeCount +
              summary.rejectedCount}{" "}
            tanesi cevap verdi
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.memberList}>
        {summary.members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isCurrentUser={member.userId === user?.id}
          />
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.promptLabel}>Sen ne diyorsun?</Text>

      <View style={styles.actionRow}>
        {BUTTON_CHOICES.map((choice) => {
          const isSelected = currentResponse === choice.value;
          const isBusy = submitting === choice.value;
          return (
            <TouchableOpacity
              key={choice.value}
              activeOpacity={0.85}
              disabled={submitting !== null}
              onPress={() => handleRespond(choice.value)}
              style={[
                styles.actionButton,
                isSelected && {
                  backgroundColor: choice.color,
                  borderColor: choice.color,
                },
                !isSelected && { borderColor: choice.color },
              ]}
            >
              {isBusy ? (
                <ActivityIndicator
                  size="small"
                  color={isSelected ? "#ffffff" : choice.color}
                />
              ) : (
                <>
                  <Ionicons
                    name={choice.icon}
                    size={16}
                    color={isSelected ? "#ffffff" : choice.color}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      { color: isSelected ? "#ffffff" : choice.color },
                    ]}
                  >
                    {choice.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CountChip = ({
  label,
  count,
  color,
  bg,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View style={[styles.countChip, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[styles.countChipLabel, { color }]}>{label}</Text>
    <Text style={[styles.countChipNumber, { color }]}>{count}</Text>
  </View>
);

const MemberRow = ({
  member,
  isCurrentUser,
}: {
  member: WishDayRsvpMember;
  isCurrentUser: boolean;
}) => {
  const meta = RESPONSE_META[member.response];
  const initial = (member.userName || "?").charAt(0).toUpperCase();

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>
          {member.userName}
          {isCurrentUser ? "  (Sen)" : ""}
        </Text>
      </View>
      <View style={[styles.memberBadge, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={13} color={meta.color} />
        <Text style={[styles.memberBadgeText, { color: meta.color }]}>
          {meta.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  countsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  countChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  countChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  countChipNumber: {
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  memberList: {
    marginTop: 4,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  promptLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 45,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
