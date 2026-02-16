import React from "react";
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

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const {
    transaction,
    type,
    amount,
    equipmentId,
    bookingId,
    patientId,
    providerId
  } = route.params || {};

  const successTransaction = transaction || route.params?.paymentResult?.transaction;

  const getTitle = () => {
    if (type === 'booking') return "Booking Confirmed!";
    if (type === 'listing_fee') return "Equipment Listed!";
    return "Payment Successful!";
  };

  const getMessage = () => {
    if (type === 'booking') {
      return "Your equipment booking has been confirmed. You can view your bookings in the bookings section.";
    }
    if (type === 'listing_fee') {
      return "Your equipment has been listed successfully and is now available for patients to book.";
    }
    return "Your payment was processed successfully.";
  };

  const handleDone = () => {
    if (user?.userType === "patient") {
      navigation.reset({
        index: 0,
        routes: [{
          name: "PatientEquipmentList",
          params: { userId: user.userId, userName: user.name || "User", userEmail: user.email || "N/A" }
        }],
      });
    } else if (user?.userType === "service-provider" || user?.userType === "service provider") {
      navigation.reset({
        index: 0,
        routes: [{
          name: "ServiceProviderDashboard",
          params: { userId: user.userId, userName: user.name || "User", userEmail: user.email || "N/A" }
        }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    }
  };

  const handleViewDetails = () => {
    if (type === 'booking') {
      if (user?.userType === "patient") {
        navigation.navigate("PatientBookingsScreen", { patientId: user.userId, refresh: true });
      } else if (user?.userType === "service-provider" || user?.userType === "service provider") {
        navigation.navigate("ProviderBookingsScreen", { providerId: user.userId, refresh: true });
      }
    } else if (type === 'listing_fee') {
      if (user?.userType === "service-provider" || user?.userType === "service provider") {
        navigation.navigate("EquipmentDashboardScreen", { providerId: user.userId, refresh: true });
      }
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

          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Transaction Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValueHighlight}>₹{amount}</Text>
            </View>
            <View style={styles.divider} />

            {successTransaction?.transactionId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue}>{successTransaction.transactionId}</Text>
              </View>
            )}

            {successTransaction?.paymentMethod && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <View style={styles.methodBadge}>
                  <Ionicons name="card-outline" size={14} color="#1E88E5" />
                  <Text style={styles.methodText}>{successTransaction.paymentMethod.toUpperCase()}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>SUCCESS</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails}>
              <Ionicons name="documents-outline" size={20} color="#1E88E5" />
              <Text style={styles.detailsButtonText}>
                {type === 'booking' ? 'View Details' : 'View My Equipment'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Back to Home</Text>
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
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981',
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
    marginBottom: 40,
    elevation: 4,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailLabel: { fontSize: 14, color: "#90A4AE", fontWeight: "600" },
  detailValueHighlight: { fontSize: 22, fontWeight: "800", color: "#2C3E50" },
  detailValue: { fontSize: 14, color: "#2C3E50", fontWeight: "600", maxWidth: '60%' },

  divider: { height: 1, backgroundColor: "#E1E8ED", marginBottom: 16 },

  methodBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  methodText: { fontSize: 12, fontWeight: "700", color: "#1E88E5" },

  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },

  buttonContainer: { width: "100%", gap: 16 },

  detailsButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", padding: 18, borderRadius: 15, gap: 10,
    borderWidth: 1, borderColor: "#1E88E5",
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  detailsButtonText: { fontSize: 16, color: "#1E88E5", fontWeight: "700" },

  doneButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#2C3E50", padding: 18, borderRadius: 15, gap: 10,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  doneButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});

export default PaymentSuccess;