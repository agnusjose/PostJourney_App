import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ImageBackground,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function PatientBookingsScreen({ navigation }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BASE_URL = "http://192.168.137.1:5000";

  const fetchBookings = async () => {
    try {
      console.log("📡 Fetching bookings for user:", user?.userId);
      const response = await axios.get(`${BASE_URL}/booking/patient/${user?.userId}`);

      if (response.data.success) {
        setBookings(response.data.bookings || []);
      } else {
        Alert.alert("Error", response.data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("❌ Fetch bookings error:", error);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchBookings();
    }
  }, [user?.userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate("OrderDetailsScreen", {
        booking: item
      })}
      activeOpacity={0.9}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.equipmentName}>
          {item.equipmentName || item.equipmentId?.equipmentName || "Equipment"}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {item.status?.toUpperCase() || "PENDING"}
          </Text>
        </View>
      </View>

      <Text style={styles.providerText}>
        Provider: {item.providerName || "N/A"}
      </Text>

      <View style={styles.divider} />

      <View style={styles.datesContainer}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color="#5C768D" />
          <Text style={styles.dateText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.daysText}>{item.totalDays || 0} days</Text>
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.amountLabel}>Total</Text>
        <Text style={styles.amountText}>
          ₹{item.totalAmount?.toFixed(2) || "0.00"}
        </Text>
      </View>

      <View style={styles.paymentRow}>
        <Ionicons name={item.paymentStatus === 'paid' ? "checkmark-circle" : "time-outline"} size={14} color={item.paymentStatus === 'paid' ? "#388E3C" : "#F59E0B"} />
        <Text style={[styles.paymentStatus, { color: item.paymentStatus === 'paid' ? "#388E3C" : "#F59E0B" }]}>
          Payment: {item.paymentStatus || "pending"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "#10b981";
      case "in-progress": return "#3b82f6";
      case "completed": return "#8b5cf6";
      case "cancelled": return "#ef4444";
      default: return "#f59e0b";
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/pjlogo_bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.overlay, styles.centerContainer]}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </ImageBackground>
    );
  }

  if (bookings.length === 0) {
    return (
      <ImageBackground
        source={require("../../assets/pjlogo_bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.overlay, styles.centerContainer]}>
          <Ionicons name="calendar-outline" size={80} color="#CFD8DC" />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            You haven't booked any equipment yet
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("PatientEquipmentList")}
          >
            <Text style={styles.browseButtonText}>Browse Equipment</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.header}>My Bookings</Text>
          <View style={{ width: 40 }} />
        </View>


        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E88E5"]}
            />
          }
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

  headerContainer: {
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
  header: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
    letterSpacing: -0.5,
  },

  listContainer: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },

  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  providerText: {
    fontSize: 14,
    color: "#5C768D",
    marginBottom: 12,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F4F8",
    marginBottom: 12,
  },

  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dateText: {
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },

  daysText: {
    fontSize: 13,
    color: "#1E88E5",
    fontWeight: "600",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  amountLabel: {
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },

  amountText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },

  paymentStatus: {
    fontSize: 13,
    fontWeight: "600",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5C768D",
    fontWeight: "500",
  },

  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: 20,
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 16,
    color: "#5C768D",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },

  browseButton: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});