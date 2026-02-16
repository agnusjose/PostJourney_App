import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  StatusBar,
  ScrollView
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function ServiceProviderDashboard({ route, navigation }) {
  const { userId, userName, userEmail } = route.params || {};
  const { logout } = useAuth();
  // Ensure we have user data even if route params are missing
  const { user } = useAuth();
  const displayUser = userId ? { userId, userName, userEmail } : user;


  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("LoginScreen");
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!displayUser?.userId) {
      // If still no user, try to get from context or redirect
      if (!user) {
        Alert.alert("Error", "User ID not found. Please login again.");
        navigation.replace("LoginScreen");
        return;
      }
    }
    console.log("Dashboard loaded with:", displayUser);
  }, [displayUser]);

  return (
    <ImageBackground
      source={require("../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Provider Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your services and orders</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(displayUser?.userName || "U").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayUser?.userName || "Service Provider"}</Text>
                <Text style={styles.email}>{displayUser?.userEmail || "No Email"}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.approvedText}>Account Verified</Text>
            </View>
          </View>

          {/* Action Buttons Grid */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("EquipmentDashboardScreen", {
                  providerId: displayUser?.userId,
                })
              }
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="medkit-outline" size={32} color="#1E88E5" />
              </View>
              <Text style={styles.actionTitle}>Equipment</Text>
              <Text style={styles.actionSubtitle}>Manage Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("ProviderBookingsScreen", {
                  providerId: displayUser?.userId,
                })
              }
            >
              <View style={[styles.iconContainer, { backgroundColor: '#EDE7F6' }]}>
                <Ionicons name="calendar-outline" size={32} color="#7E57C2" />
              </View>
              <Text style={styles.actionTitle}>Bookings</Text>
              <Text style={styles.actionSubtitle}>View Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("ServiceProviderProfileCompletion", {
                email: displayUser?.userEmail,
              })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="person-outline" size={32} color="#2E7D32" />
              </View>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF5350" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.85)' },

  content: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
  },

  headerContainer: { marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#2C3E50", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, color: "#5C768D", marginTop: 4 },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#2C3E50',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: "700", color: "#2C3E50", marginBottom: 2 },
  email: { fontSize: 14, color: "#5C768D" },

  divider: { height: 1, backgroundColor: "#E1E8ED", marginBottom: 12 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedText: { color: "#10b981", fontWeight: "600", fontSize: 14 },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 30
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionTitle: { fontSize: 16, fontWeight: "700", color: "#2C3E50", marginBottom: 2 },
  actionSubtitle: { fontSize: 12, color: "#90A4AE" },

  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: 'center',
    shadowColor: "#EF5350", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  logoutText: { color: "#EF5350", fontWeight: "700", fontSize: 16 },
});