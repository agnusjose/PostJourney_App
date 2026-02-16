import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ImageBackground,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function ProviderBookingsScreen({ route, navigation }) {
  const { providerId } = route.params;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BASE_URL = "http://192.168.137.1:5000";

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/booking/provider/${providerId}`);
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [providerId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const res = await axios.put(`${BASE_URL}/booking/update-status/${bookingId}`, {
        status
      });

      if (res.data.success) {
        Alert.alert("Success", `Booking ${status} successfully`);
        fetchBookings();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update booking status");
    }
  };

  // Update payment status (for marking COD as paid after delivery)
  const updatePaymentStatus = async (bookingId, paymentStatus) => {
    try {
      const res = await axios.put(`${BASE_URL}/booking/update-payment-status/${bookingId}`, {
        paymentStatus
      });

      if (res.data.success) {
        Alert.alert("Success", `Payment marked as ${paymentStatus}`);
        fetchBookings();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update payment status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "#16a34a"; // Green
      case "pending": return "#f59e0b";   // Amber
      case "in-progress": return "#3b82f6"; // Blue
      case "completed": return "#10b981"; // Emerald
      case "cancelled": return "#ef4444"; // Red
      default: return "#6b7280";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid": return "#10b981";
      case "pending": return "#f59e0b";
      case "refunded": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProviderBookingDetailsScreen", { booking: item })}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.equipmentName}>{item.equipmentName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Payment Status Row */}
      <View style={styles.paymentRow}>
        <View style={styles.paymentMethodBadge}>
          <Text style={styles.paymentMethodText}>
            {item.paymentMethod === "cod" ? "💵 COD" : "💳 Online"}
          </Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
          <Text style={styles.paymentStatusText}>
            {item.paymentStatus === "paid" ? "✓ Paid" : item.paymentStatus === "pending" ? "⏳ Pending" : item.paymentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={16} color="#5C768D" style={styles.icon} />
        <Text style={styles.patient}>Patient: {item.patientName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color="#5C768D" style={styles.icon} />
        <Text style={styles.contact}>Phone: {item.contactPhone}</Text>
      </View>

      <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
        <Ionicons name="location-outline" size={16} color="#5C768D" style={[styles.icon, { marginTop: 2 }]} />
        <Text style={styles.address}>Address: {item.deliveryAddress}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.datesContainer}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={16} color="#5C768D" style={styles.icon} />
          <Text style={styles.dateText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.amount}>₹ {item.totalAmount}</Text>
      </View>

      {/* Action Buttons based on status */}
      <View style={styles.actionButtons}>
        {item.status === "pending" && (
          <>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => updateBookingStatus(item._id, "confirmed")}
            >
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => updateBookingStatus(item._id, "cancelled")}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === "confirmed" && (
          <TouchableOpacity
            style={styles.inProgressBtn}
            onPress={() => updateBookingStatus(item._id, "in-progress")}
          >
            <Text style={styles.btnText}>Mark as In Progress</Text>
          </TouchableOpacity>
        )}

        {item.status === "in-progress" && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => updateBookingStatus(item._id, "completed")}
          >
            <Text style={styles.btnText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {/* Mark as Paid button for COD orders after completion */}
        {item.status === "completed" &&
          item.paymentMethod === "cod" &&
          item.paymentStatus === "pending" && (
            <TouchableOpacity
              style={styles.paidBtn}
              onPress={() => {
                Alert.alert(
                  "Confirm Payment",
                  "Have you received the cash payment for this order?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Yes, Mark as Paid", onPress: () => updatePaymentStatus(item._id, "paid") }
                  ]
                );
              }}
            >
              <Text style={styles.btnText}>💰 Mark as Paid</Text>
            </TouchableOpacity>
          )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("../../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Requests</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        {bookings.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={60} color="#CFD8DC" />
            </View>
            <Text style={styles.emptyText}>No booking requests yet</Text>
            <Text style={styles.emptySubtext}>New bookings will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#1E88E5"]}
                tintColor="#1E88E5"
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
    letterSpacing: -0.5,
  },

  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: 'capitalize',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
    width: 20,
  },
  patient: {
    fontSize: 14,
    color: "#455A64",
    fontWeight: "500",
  },
  contact: {
    fontSize: 14,
    color: "#455A64",
  },
  address: {
    fontSize: 14,
    color: "#5C768D",
    flex: 1,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginVertical: 12,
  },

  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: "#5C768D",
    fontWeight: "500",
  },
  amount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16a34a",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rejectBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  inProgressBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  completeBtn: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  paidBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  paymentMethodBadge: {
    backgroundColor: "#F1F8E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCEDC8",
  },
  paymentMethodText: {
    fontSize: 12,
    color: "#33691E",
    fontWeight: "600",
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: "#2C3E50",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#5C768D",
  },
});