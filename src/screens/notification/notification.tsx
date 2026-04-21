import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  PanResponder,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  acceptNotificationInvite,
  deleteNotification,
  getMyNotifications,
  markNotificationAsRead,
  rejectNotificationInvite,
  respondWishDayFromNotification,
} from "../../api/notification";
import CustomAlert from "../../components/common/CustomAlert";
import { formatDate as formatDateTurkish } from "../../utils/date";

interface NotificationIconMeta {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const getNotificationIconMeta = (type: string): NotificationIconMeta => {
  switch (type) {
    case "WishDayInvite":
    case "WishDayUpdated":
    case "WishDayReminder":
      return { icon: "heart-sharp", color: "#dc2626", bg: "#fee2e2" };
    case "WishDayCancelled":
      return { icon: "calendar-outline", color: "#7c2d12", bg: "#fee2e2" };
    case "WishDayRsvpResponse":
      return { icon: "chatbox-ellipses-outline", color: "#2563eb", bg: "#dbeafe" };
    case "GroupInvite":
      return { icon: "people-outline", color: "#7c3aed", bg: "#ede9fe" };
    case "GroupInviteAccepted":
      return { icon: "checkmark-circle-outline", color: "#16a34a", bg: "#dcfce7" };
    case "GroupInviteRejected":
      return { icon: "close-circle-outline", color: "#dc2626", bg: "#fee2e2" };
    case "GroupMemberAdded":
      return { icon: "person-add-outline", color: "#0ea5e9", bg: "#e0f2fe" };
    case "GroupMemberLeft":
      return { icon: "person-remove-outline", color: "#475569", bg: "#e2e8f0" };
    case "OwnershipTransferred":
      return { icon: "key-outline", color: "#ca8a04", bg: "#fef9c3" };
    case "PlaceCreated":
      return { icon: "location-outline", color: "#0d9488", bg: "#ccfbf1" };
    case "PlacePhotoAdded":
      return { icon: "image-outline", color: "#db2777", bg: "#fce7f3" };
    case "PlaceReviewAdded":
      return { icon: "star-outline", color: "#d97706", bg: "#fef3c7" };
    case "PlaceMarkedVisited":
      return { icon: "flag-outline", color: "#16a34a", bg: "#dcfce7" };
    default:
      return { icon: "notifications-outline", color: "#51627E", bg: "#F1F5F9" };
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
  placeId?: string | null;
  placeTitle?: string | null;
  placeVisitDate?: string | null;
  rsvpResponse?: string | null;
}

type WishDayRsvpChoice = "Accepted" | "Maybe" | "Rejected";

interface SwipeableNotificationCardProps {
  item: NotificationItem;
  processingId: string | null;
  processingChoice: WishDayRsvpChoice | null;
  onMarkAsRead: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenPlace: (placeId: string) => void;
  onWishDayRespond: (id: string, response: WishDayRsvpChoice) => void;
  renderInviteStatus: (item: NotificationItem) => React.ReactNode;
  formatDate: (dateString: string) => string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COMMIT_THRESHOLD = SCREEN_WIDTH * 0.28;
const VELOCITY_THRESHOLD = 0.35;

const SwipeableNotificationCard = ({
  item,
  processingId,
  processingChoice,
  onMarkAsRead,
  onAccept,
  onReject,
  onDelete,
  onOpenPlace,
  onWishDayRespond,
  renderInviteStatus,
  formatDate,
}: SwipeableNotificationCardProps) => {
  const panX = useRef(new Animated.Value(0)).current;
  const heightProgress = useRef(new Animated.Value(1)).current;
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const isDeletingRef = useRef(false);

  const resetCardPosition = () => {
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 10,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
    }).start();
  };

  const deleteCard = (fromX: number = 0) => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;

    // remaining distance left to slide
    const remaining = SCREEN_WIDTH + fromX; // fromX is negative
    const slideDuration = Math.max(140, Math.min(220, remaining * 0.6));

    Animated.timing(panX, {
      toValue: -SCREEN_WIDTH,
      duration: slideDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(heightProgress, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        onDelete(item.id);
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !isDeletingRef.current &&
        Math.abs(gestureState.dx) > 8 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,

      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gestureState) => {
        if (isDeletingRef.current) return;
        if (gestureState.dx < 0) {
          // follow finger 1:1 on left swipe (no resistance)
          panX.setValue(gestureState.dx);
        } else {
          // strong resistance on right swipe, clamped
          panX.setValue(Math.min(gestureState.dx * 0.12, 14));
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (isDeletingRef.current) return;
        const shouldDelete =
          gestureState.dx < -COMMIT_THRESHOLD ||
          (gestureState.dx < -30 && gestureState.vx < -VELOCITY_THRESHOLD);

        if (shouldDelete) {
          deleteCard(gestureState.dx);
        } else {
          resetCardPosition();
        }
      },

      onPanResponderTerminate: () => {
        if (!isDeletingRef.current) resetCardPosition();
      },
    })
  ).current;

  const isInvite = item.type === "GroupInvite";
  const isWishDay = item.type === "WishDayInvite";
  const isProcessing = processingId === item.id;

  const iconMeta = getNotificationIconMeta(item.type);
  const cardIconName = iconMeta.icon;

  // progressive reveal for background trash icon
  const bgOpacity = panX.interpolate({
    inputRange: [-COMMIT_THRESHOLD, -12, 0],
    outputRange: [1, 0.2, 0],
    extrapolate: "clamp",
  });
  // icon noticeably "pops" once user crosses commit threshold
  const trashScale = panX.interpolate({
    inputRange: [-COMMIT_THRESHOLD - 1, -COMMIT_THRESHOLD, -40, 0],
    outputRange: [1.25, 1.1, 0.85, 0.65],
    extrapolate: "clamp",
  });
  const cardShadowOpacity = panX.interpolate({
    inputRange: [-COMMIT_THRESHOLD, 0],
    outputRange: [0.18, 0.09],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (measuredHeight === null && h > 0) {
          setMeasuredHeight(h);
        }
      }}
      style={[
        styles.swipeableWrapper,
        measuredHeight !== null && {
          height: heightProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, measuredHeight],
          }),
          marginBottom: heightProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 14],
          }),
          opacity: heightProgress.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0, 1, 1],
          }),
        },
      ]}
    >
      <Animated.View style={[styles.deleteBackground, { opacity: bgOpacity }]}>
        <Animated.View style={{ transform: [{ scale: trashScale }] }}>
          <Ionicons name="trash" size={22} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.swipeableCard,
          {
            transform: [{ translateX: panX }],
            shadowOpacity: cardShadowOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          style={[styles.card, !item.isRead && styles.unreadCard]}
          onPress={() => {
            if (!item.isRead) onMarkAsRead(item.id);
            if (isWishDay && item.placeId) {
              onOpenPlace(item.placeId);
              return;
            }
            // Place-related notifications open the place detail if we know the id
            const placeRelatedTypes = [
              "WishDayRsvpResponse",
              "WishDayUpdated",
              "WishDayCancelled",
              "WishDayReminder",
              "PlaceCreated",
              "PlacePhotoAdded",
              "PlaceReviewAdded",
              "PlaceMarkedVisited",
            ];
            if (
              placeRelatedTypes.includes(item.type) &&
              item.relatedEntityId
            ) {
              onOpenPlace(item.relatedEntityId);
            }
          }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: iconMeta.bg }]}>
              <Ionicons
                name={cardIconName}
                size={20}
                color={iconMeta.color}
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
                  {item.invitedByName || "Birileri"}
                </Text>{" "}
                sizi{" "}
                <Text style={styles.boldText}>
                  {item.groupName || "bu gruba"}
                </Text>
                {" "} katılmaya davet etti.
              </Text>

            

              {renderInviteStatus(item)}

              {item.canRespond && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => onReject(item.id)}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="close-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Reddet</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => onAccept(item.id)}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.actionButtonText}>Kabul Et</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : isWishDay ? (
            <View style={styles.inviteBody}>
              <Text style={styles.inviteMainText}>
                <Text style={styles.boldText}>
                  {item.groupName || "Grubunda"}
                </Text>
                {" grubuyla "}
                {item.placeVisitDate ? (
                  <>
                    <Text style={styles.boldText}>
                      {formatDateTurkish(item.placeVisitDate)}
                    </Text>
                    {" günü "}
                  </>
                ) : (
                  ""
                )}
                yeni bir planın var 🥳
                {item.placeTitle ? (
                  <>
                    {" "}
                    <Text style={styles.boldText}>{item.placeTitle}</Text>
                  </>
                ) : (
                  ""
                )}
              </Text>

              {item.rsvpResponse &&
                item.rsvpResponse !== "NotResponded" && (
                  <View
                    style={[
                      styles.statusChip,
                      item.rsvpResponse === "Accepted"
                        ? styles.acceptedChip
                        : item.rsvpResponse === "Rejected"
                          ? styles.rejectedChip
                          : styles.maybeChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        item.rsvpResponse === "Accepted"
                          ? styles.acceptedChipText
                          : item.rsvpResponse === "Rejected"
                            ? styles.rejectedChipText
                            : styles.maybeChipText,
                      ]}
                    >
                      Cevabın:{" "}
                      {item.rsvpResponse === "Accepted"
                        ? "Katılıyorum"
                        : item.rsvpResponse === "Rejected"
                          ? "Katılmıyorum"
                          : "Bilmiyorum"}
                    </Text>
                  </View>
                )}

              <View style={styles.wishDayActionRow}>
                {(
                  [
                    {
                      choice: "Accepted",
                      label: "Katılırım",
                      color: "#16a34a",
                      icon: "checkmark-circle",
                    },
                    {
                      choice: "Maybe",
                      label: "Bilmiyorum",
                      color: "#d97706",
                      icon: "help-circle",
                    },
                    {
                      choice: "Rejected",
                      label: "Katılmam",
                      color: "#dc2626",
                      icon: "close-circle",
                    },
                  ] as const
                ).map((btn) => {
                  const isSelected = item.rsvpResponse === btn.choice;
                  const isBusy =
                    isProcessing && processingChoice === btn.choice;
                  return (
                    <TouchableOpacity
                      key={btn.choice}
                      activeOpacity={0.85}
                      disabled={isProcessing}
                      onPress={() => onWishDayRespond(item.id, btn.choice)}
                      style={[
                        styles.wishDayButton,
                        { borderColor: btn.color },
                        isSelected && {
                          backgroundColor: btn.color,
                        },
                      ]}
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={isSelected ? "#fff" : btn.color}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name={btn.icon as keyof typeof Ionicons.glyphMap}
                            size={14}
                            color={isSelected ? "#fff" : btn.color}
                          />
                          <Text
                            style={[
                              styles.wishDayButtonText,
                              { color: isSelected ? "#fff" : btn.color },
                            ]}
                          >
                            {btn.label}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text style={styles.normalMessage}>{item.message}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingChoice, setProcessingChoice] =
    useState<WishDayRsvpChoice | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("Bilgi");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "danger" | "info">(
    "info"
  );

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
        showAlert(
          "Hata",
          result.message || "Bildirimler yüklenemedi.",
          "danger"
        );
      }
    } catch {
      showAlert(
        "Hata",
        "Bildirimler yüklenirken bir hata oluştu.",
        "danger"
      );
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
      showAlert("Hata", "Bildirim okundu olarak işaretlenemedi.", "danger");
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

        showAlert(
          "Başarılı",
          "Davet kabul edildi.",
          "success"
        );
      } else {
        showAlert(
          "Hata",
          result.message || "Davet kabul edilemedi.",
          "danger"
        );
      }
    } catch {
      showAlert(
        "Hata",
        "Davet kabul edilirken bir hata oluştu.",
        "danger"
      );
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

        showAlert(
          "Başarılı",
          result.message || "Davet reddedildi.",
          "success"
        );
      } else {
        showAlert(
          "Hata",
          result.message || "Davet reddedilemedi.",
          "danger"
        );
      }
    } catch {
      showAlert(
        "Hata",
        "Davet reddedilirken bir hata oluştu.",
        "danger"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);

      if (result.success) {
        setNotifications((prev) =>
          prev.filter((item) => item.id !== notificationId)
        );
      } else {
        showAlert(
          "Hata",
          "Bildirim silinemedi.",
          "danger"
        );
        fetchNotifications(false);
      }
    } catch {
      showAlert(
        "Hata",
        "Bildirim silinirken bir hata oluştu.",
        "danger"
      );
      fetchNotifications(false);
    }
  };

  const handleOpenPlace = (placeId: string) => {
    (navigation as any).navigate("PlaceDetail", { placeId });
  };

  const handleWishDayRespond = async (
    notificationId: string,
    response: WishDayRsvpChoice
  ) => {
    try {
      setProcessingId(notificationId);
      setProcessingChoice(response);

      const result = await respondWishDayFromNotification(
        notificationId,
        response
      );

      if (result.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, isRead: true, rsvpResponse: response }
              : item
          )
        );

        showAlert(
          "Başarılı",
          response === "Accepted"
            ? "Katılımın kaydedildi."
            : response === "Maybe"
              ? "Cevabın 'Bilmiyorum' olarak kaydedildi."
              : "Cevabın 'Katılmam' olarak kaydedildi.",
          "success"
        );
      } else {
        showAlert(
          "Hata",
          result.message || "Yanıt kaydedilemedi.",
          "danger"
        );
      }
    } catch {
      showAlert("Hata", "Yanıt kaydedilirken bir hata oluştu.", "danger");
    } finally {
      setProcessingId(null);
      setProcessingChoice(null);
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

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <SwipeableNotificationCard
      item={item}
      processingId={processingId}
      processingChoice={processingChoice}
      onMarkAsRead={handleMarkAsRead}
      onAccept={handleAccept}
      onReject={handleReject}
      onDelete={handleDelete}
      onOpenPlace={handleOpenPlace}
      onWishDayRespond={handleWishDayRespond}
      renderInviteStatus={renderInviteStatus}
      formatDate={formatDate}
    />
  );

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

        <Text style={styles.headerTitle}>Bildirimler</Text>

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
      <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
      <Text style={styles.emptySubtitle}>
        Grup davetleri ve güncellemeler burada görünecek.
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
    marginTop: 30,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#74839B",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  swipeableWrapper: {
    marginBottom: 14,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },

  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 28,
    borderRadius: 24,
  },

  swipeableCard: {
    zIndex: 1,
    shadowColor: "#6F7D95",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 16,
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
    marginLeft: 0,
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

  maybeChip: {
    backgroundColor: "#FEF3C7",
  },

  maybeChipText: {
    color: "#B45309",
  },

  wishDayActionRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },

  wishDayButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
  },

  wishDayButtonText: {
    fontSize: 12,
    fontWeight: "800",
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