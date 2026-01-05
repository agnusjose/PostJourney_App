import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView } from "react-native";

export default function ICUDeconditioningDashboard({ navigation }) {
  const exercises = [
    { label: "Ankle Pumps", key: "ANKLE_PUMPS" },
    { label: "Seated Trunk Flexion–Extension", key: "SEATED_TRUNK_FLEXION_EXTENSION" },
    { label: "Passive Shoulder ROM", key: "PASSIVE_SHOULDER_ROM" },
  ];

  const handleNavigation = (exerciseKey) => {
    navigation.navigate("ExercisesDemo", { exerciseKey });
  };

  return (
    <ImageBackground source={require("../../assets/pjlogo_bg.png")} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>ICU & Deconditioning</Text>
            <View style={styles.underline} />
            <Text style={styles.subtitle}>Gentle movements for recovery</Text>
          </View>

          <View style={styles.listContainer}>
            {exercises.map((ex, index) => (
              <TouchableOpacity key={index} style={styles.button} onPress={() => handleNavigation(ex.key)} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{ex.label}</Text>
                <View style={styles.arrowContainer}><Text style={styles.arrow}>→</Text></View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}><Text style={styles.tipTitle}>💡 Training Tip</Text></View>
            <Text style={styles.tipText}>Focus on smooth, controlled motions. Stop immediately if you feel any sharp pain or dizziness.</Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// ... Use the same styles object from Screen 1
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },
  container: { paddingHorizontal: 22, paddingTop: 80, paddingBottom: 40 },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: "#2C3E50", textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#5C768D", marginTop: 10, textAlign: "center" },
  underline: { width: 50, height: 4, backgroundColor: "#7CB342", borderRadius: 2, marginTop: 8 },
  listContainer: { width: "100%", marginBottom: 25 },
  button: { width: "100%", backgroundColor: "#1E88E5", paddingVertical: 20, paddingHorizontal: 20, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: "center", shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 },
  arrowContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  arrow: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tipCard: { backgroundColor: "rgba(124, 179, 66, 0.1)", borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: 'rgba(124, 179, 66, 0.2)', borderStyle: 'dashed' },
  tipHeader: { marginBottom: 8 },
  tipTitle: { fontSize: 16, fontWeight: "800", color: "#388E3C" },
  tipText: { fontSize: 14, color: "#4F6F52", lineHeight: 22, fontWeight: "500" },
});