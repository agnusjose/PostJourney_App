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

const PaymentFailed = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { error, type, amount, onRetry } = route.params || {};

  const getTitle = () => {
    if (type === 'booking') return "Booking Failed";
    if (type === 'listing_fee') return "Listing Failed";
    return "Payment Failed";
  };

  const getMessage = () => {
    if (type === 'booking') {
      return "We couldn't process your booking payment. Please try again or use a different payment method.";
    }
    if (type === 'listing_fee') {
      return "We couldn't process your listing fee payment. Your equipment will not be listed until payment is successful.";
    }
    return "We couldn't process your payment. Please try again.";
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigation.goBack();
    }
  };

  const handleGoHome = () => {
    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
      return;
    }

    if (user.userType === "service-provider" || user.userType === "service provider") {
      navigation.reset({
        index: 0,
        routes: [{ name: "ServiceProviderDashboard", params: { userId: user.userId, userName: user.name, userEmail: user.email } }],
      });
    } else if (user.userType === "patient") {
      navigation.reset({
        index: 0,
        routes: [{ name: "PatientDashboard", params: { userId: user.userId, userName: user.name, userEmail: user.email } }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
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

          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-outline" size={60} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          {error && (
            <View style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Ionicons name="information-circle" size={20} color="#D32F2F" />
                <Text style={styles.errorTitle}>Error Details</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {amount && (
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Attempted Amount</Text>
              <Text style={styles.amountValue}>₹{amount}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            If the problem persists, please contact support.
          </Text>

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
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#EF5350',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#EF5350", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  title: { fontSize: 28, fontWeight: "800", color: "#B71C1C", marginBottom: 12, textAlign: "center", letterSpacing: -0.5 },
  message: { fontSize: 16, color: "#5C768D", textAlign: "center", marginBottom: 40, lineHeight: 24, paddingHorizontal: 20 },

  errorCard: {
    width: '100%',
    backgroundColor: "#FFEBEE",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  errorTitle: { fontSize: 15, fontWeight: "700", color: "#D32F2F" },
  errorText: { fontSize: 14, color: "#B71C1C", lineHeight: 20 },

  amountCard: {
    width: '100%',
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  amountLabel: { fontSize: 13, color: "#90A4AE", fontWeight: "600", textTransform: 'uppercase', marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: "800", color: "#2C3E50" },

  buttonContainer: { width: "100%", gap: 16, marginBottom: 24 },

  retryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#EF5350", padding: 18, borderRadius: 15, gap: 10,
    shadowColor: "#EF5350", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  retryButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },

  homeButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", padding: 18, borderRadius: 15, gap: 10,
    borderWidth: 1, borderColor: "#CFD8DC",
  },
  homeButtonText: { fontSize: 16, color: "#5C768D", fontWeight: "700" },

  helpText: { fontSize: 13, color: "#90A4AE", fontStyle: "italic" },
});

export default PaymentFailed;