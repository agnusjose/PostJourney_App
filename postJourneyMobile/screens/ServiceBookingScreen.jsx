import React from "react";
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
import { Ionicons } from "@expo/vector-icons";

export default function ServiceBookingScreen({ navigation }) {
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Service Booking</Text>
              <Text style={styles.headerSubtitle}>Choose a service to continue</Text>
            </View>
          </View>

          {/* Service Cards */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("PatientEquipmentList")}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="medkit" size={40} color="#1E88E5" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Medical Equipment</Text>
                <Text style={styles.cardDescription}>Rent medical equipment for your needs.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CFD8DC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("CaregiverListScreen")}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people" size={40} color="#8E24AA" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Caregiver Services</Text>
                <Text style={styles.cardDescription}>Find professional caregivers for home support.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CFD8DC" />
            </TouchableOpacity>
          </View>
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

  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
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
    marginRight: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#2C3E50", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: "#5C768D", marginTop: 2 },

  cardsContainer: { gap: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  iconContainer: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#2C3E50", marginBottom: 4 },
  cardDescription: { fontSize: 13, color: "#5C768D", lineHeight: 18 },
});