import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  ScrollView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const CashOnDeliverySuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmError, setConfirmError] = useState(null);

  const BASE_URL = "http://192.168.137.1:5000";

  const {
    bookingId,
    bookingIds,
    amount,
    bookingData
  } = route.params || {};

  useEffect(() => {
    const confirmCODBookings = async () => {
      try {
        const allBookingIds = bookingIds && bookingIds.length > 0
          ? bookingIds
          : (bookingId ? [bookingId] : []);

        if (allBookingIds.length === 0) {
          setIsConfirming(false);
          return;
        }

        for (const id of allBookingIds) {
          await axios.put(`${BASE_URL}/booking/confirm-cod/${id}`);
        }

        setIsConfirming(false);
      } catch (error) {
        console.error("Error confirming COD booking:", error);
        setConfirmError("Booking placed but confirmation pending. Check My Orders.");
        setIsConfirming(false);
      }
    };

    confirmCODBookings();
  }, [bookingId, bookingIds]);

  const handleGoHome = () => {
    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
      return;
    }

    if (user.userType === "patient") {
      navigation.reset({
        index: 0,
        routes: [{ name: "PatientEquipmentList", params: { userId: user.userId, userName: user.name || "User", userEmail: user.email || "N/A" } }],
      });
    } else if (user.userType === "service-provider" || user.userType === "service provider") {
      navigation.reset({
        index: 0,
        routes: [{ name: "ServiceProviderDashboard", params: { userId: user.userId, userName: user.name || "User", userEmail: user.email || "N/A" } }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    }
  };

  const handleViewBooking = () => {
    if (user?.userType === "patient") {
      navigation.navigate("PatientBookingsScreen", { patientId: user.userId, refresh: true });
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-sharp" size={60} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.message}>
            Your order has been placed successfully. Please pay the driver upon delivery.
          </Text>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount to Pay</Text>
              <Text style={styles.detailValueHighlight}>₹{amount}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>{bookingId?.substring(0, 8).toUpperCase() || 'N/A'}...</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={styles.methodBadge}>
                <Ionicons name="cash-outline" size={14} color="#388E3C" />
                <Text style={styles.methodText}>CASH ON DELIVERY</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#0277BD" />
              <Text style={styles.instructionsTitle}>Important Instructions</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>Keep cash ready when equipment arrives.</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.instructionText}>Verify equipment condition before payment.</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.viewButton} onPress={handleViewBooking}>
              <Ionicons name="documents-outline" size={20} color="#1E88E5" />
              <Text style={styles.viewButtonText}>View My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
              <Text style={styles.homeButtonText}>Back to Home</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.9)' },

  content: {
    flexGrow: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: { marginBottom: 30, alignItems: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#43A047',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#10b981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  title: { fontSize: 28, fontWeight: "800", color: "#2C3E50", marginBottom: 12, textAlign: "center", letterSpacing: -0.5 },
  message: { fontSize: 16, color: "#5C768D", textAlign: "center", marginBottom: 40, lineHeight: 24, paddingHorizontal: 20 },

  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailLabel: { fontSize: 14, color: "#90A4AE", fontWeight: "600" },
  detailValueHighlight: { fontSize: 22, fontWeight: "800", color: "#2C3E50" },
  detailValue: { fontSize: 14, color: "#2C3E50", fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#E1E8ED", marginBottom: 16 },

  methodBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  methodText: { fontSize: 12, fontWeight: "700", color: "#388E3C" },

  instructionsCard: {
    width: '100%',
    backgroundColor: "#E1F5FE",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  instructionsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  instructionsTitle: { fontSize: 15, fontWeight: "700", color: "#0277BD" },
  instructionItem: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  bulletPoint: { fontSize: 16, color: "#01579B", marginRight: 8, lineHeight: 20 },
  instructionText: { fontSize: 14, color: "#01579B", lineHeight: 20, flex: 1 },

  buttonContainer: { width: "100%", gap: 16 },

  viewButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", padding: 18, borderRadius: 15, gap: 10,
    borderWidth: 1, borderColor: "#1E88E5",
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  viewButtonText: { fontSize: 16, color: "#1E88E5", fontWeight: "700" },

  homeButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#2C3E50", padding: 18, borderRadius: 15, gap: 10,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  homeButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});

export default CashOnDeliverySuccess;