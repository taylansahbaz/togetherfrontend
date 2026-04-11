import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  acceptNotificationInvite,
  getMyNotifications,
  markNotificationAsRead,
  rejectNotificationInvite,
} from "../../api/notification";
import CustomAlert from "../../components/common/CustomAlert";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: string;
  inviteStatus?: string | null;
  canRespond: boolean;
  groupName?: string | null;
  invitedByName?: string | null;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("Info");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "danger" | "info">("info");

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "danger" | "info" = "info"
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchNotifications = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const result = await getMyNotifications();

      if (result.success) {
        setNotifications(result.data ?? []);
      } else {
        showAlert("Error", result.message || "Failed to load notifications.", "danger");
      }
    } catch {
      showAlert("Error", "An error occurred while loading notifications.", "danger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);

      if (result.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          )
        );
      }
    } catch {
      showAlert("Error", "Failed to mark notification as read.", "danger");
    }
  };

    const handleAccept = async (notificationId: string) => {
    try {
        setProcessingId(notificationId);

        const result = await acceptNotificationInvite(notificationId);

        if (result.success) {
        setNotifications((prev) =>
            prev.filter((item) => item.id !== notificationId)
        );

        showAlert("Success", result.message || "Invitation accepted.", "success");
        } else {
        showAlert("Error", result.message || "Failed to accept invitation.", "danger");
        }
    } catch {
        showAlert("Error", "An error occurred while accepting invitation.", "danger");
    } finally {
        setProcessingId(null);
    }
    };


 const handleReject = async (notificationId: string) => {
  try {
    setProcessingId(notificationId);

    const result = await rejectNotificationInvite(notificationId);

    if (result.success) {
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );

      showAlert("Success", result.message || "Invitation rejected.", "success");
    } else {
      showAlert("Error", result.message || "Failed to reject invitation.", "danger");
    }
  } catch {
    showAlert("Error", "An error occurred while rejecting invitation.", "danger");
  } finally {
    setProcessingId(null);
  }
};

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderInviteStatus = (item: NotificationItem) => {
    if (item.type !== "GroupInvite" || item.canRespond || !item.inviteStatus) {
      return null;
    }

    const isAccepted = item.inviteStatus.toLowerCase() === "accepted";

    return (
      <View
        style={[
          styles.statusChip,
          isAccepted ? styles.acceptedChip : styles.rejectedChip,
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            isAccepted ? styles.acceptedChipText : styles.rejectedChipText,
          ]}
        >
          {item.inviteStatus}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isInvite = item.type === "GroupInvite";
    const isProcessing = processingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => {
          if (!item.isRead) handleMarkAsRead(item.id);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons
              name={isInvite ? "people-outline" : "notifications-outline"}
              size={20}
              color="#51627E"
            />
          </View>

          <View style={styles.cardHeaderText}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {isInvite ? (
          <View style={styles.inviteBody}>
            <Text style={styles.inviteMainText}>
              <Text style={styles.boldText}>
                {item.invitedByName || "Someone"}
              </Text>{" "}
              invited you to join{" "}
              <Text style={styles.boldText}>
                {item.groupName || "this group"}
              </Text>
              .
            </Text>

            <Text style={styles.inviteSubText}>{item.message}</Text>

            {renderInviteStatus(item)}

            {item.canRespond && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(item.id)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAccept(item.id)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.normalMessage}>{item.message}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color="#243047" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.counterBubble}>
          <Text style={styles.counterText}>{unreadCount}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="notifications-off-outline" size={28} color="#73809B" />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        Group invites and updates will appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#8FAFC0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.backgroundBlobTop} />
      <View style={styles.backgroundBlobBottom} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8FAFC0"
          />
        }
      />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
        type={alertType}
        showCancelButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF1F6",
    paddingHorizontal: 16,
  },
  backgroundBlobTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(152, 188, 204, 0.18)",
  },
  backgroundBlobBottom: {
    position: "absolute",
    bottom: 40,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(230, 207, 199, 0.20)",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingTop: 14,
    paddingBottom: 32,
  },
  headerCard: {
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#74839B",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },

  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1D2433",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6F7A8D",
  },
  counterBubble: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6CFC7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  counterText: {
    color: "#43353B",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(222,228,238,0.95)",
    shadowColor: "#6F7D95",
    shadowOpacity: 0.09,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: "#FDFEFF",
    borderColor: "#D7E4EC",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EAF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#202636",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#8FAFC0",
  },
  cardDate: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#8A92A3",
    fontWeight: "600",
  },
  inviteBody: {
    marginTop: 14,
    marginLeft: 58,
  },
  inviteMainText: {
    fontSize: 15.5,
    lineHeight: 23,
    color: "#3A4355",
  },
  boldText: {
    fontWeight: "800",
    color: "#1D2433",
  },
  inviteSubText: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#7E8798",
  },
  normalMessage: {
    marginTop: 12,
    marginLeft: 58,
    fontSize: 14,
    lineHeight: 21,
    color: "#5B6475",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  rejectButton: {
    backgroundColor: "#C98792",
  },
  acceptButton: {
    backgroundColor: "#98BCCC",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  statusChip: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  acceptedChip: {
    backgroundColor: "#E4F5EC",
  },
  rejectedChip: {
    backgroundColor: "#FBE7EA",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  acceptedChipText: {
    color: "#3F8B67",
  },
  rejectedChipText: {
    color: "#B45B6A",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8EDF3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2433",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#7E8798",
  },
});