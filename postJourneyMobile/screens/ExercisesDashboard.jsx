import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";

export default function ExercisesDashboard({ navigation }) {
  const exercises = [
    { label: "Cardiac Rehabilitation", value: "cardiac-rehabilitation" },
    { label: "Stroke Rehabilitation", value: "stroke-rehabilitation" },
    { label: "Post-Surgical Rehab", value: "post-surgical-rehabilitation" },
    { label: "ICU / General Deconditioning", value: "icu-general-deconditioning" },
    { label: "Pulmonary Rehabilitation", value: "pulmonary-rehabilitation" },
    { label: "Orthopedic Rehabilitation", value: "orthopedic-rehabilitation" },
    { label: "Elderly Care", value: "elderly-care" },
    { label: "Common Exercises", value: "common-exercises" },
  ];

  const handleNavigation = (exercise) => {
    const routeMap = {
      "cardiac-rehabilitation": "CardiacRehab",
      "stroke-rehabilitation": "StrokeRehab",
      "post-surgical-rehabilitation": "Post_SurgicalRehab",
      "icu-general-deconditioning": "Icu_General",
      "pulmonary-rehabilitation": "PulmonaryRehab",
      "orthopedic-rehabilitation": "Orthopedic",
      "elderly-care": "ElderlyCare",
      "common-exercises": "CommonExercises",
    };

    if (routeMap[exercise]) {
      navigation.navigate(routeMap[exercise]);
    } else {
      alert("This clinical module is currently being finalized.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            
            {/* Professional Header using your provided styles */}
            <View style={styles.header}>
              <View>
                <Text style={styles.userName}>Exercise Monitoring</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rehabilitation Programs</Text>
              
              {exercises.map((ex, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  style={styles.previewCard}
                  onPress={() => handleNavigation(ex.value)}
                >
                  {/* Blue Accent Bar from your design */}
                  <View style={styles.accentBar} />
                  
                  <View style={styles.cardInfo}>
                    <Text style={styles.previewTitle}>{ex.label}</Text>
                    <Text style={styles.previewText}>View specialized therapeutic protocols</Text>
                  </View>
                  
                  <View style={styles.chevronContainer}>
                    <View style={styles.chevron} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Background & Overlay
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(229, 248, 245, 0.85)' }, 

  container: {
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 40,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 35,
  },
  welcome: {
    fontSize: 12,
    color: "#5C768D", 
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2C3E50", 
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7CB342', 
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#388E3C',
    textTransform: 'uppercase',
  },

  // Section & List Styles
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2C3E50",
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#1E88E5', 
  },
  cardInfo: {
    flex: 1,
    paddingLeft: 5,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2C3E50",
  },
  previewText: {
    fontSize: 13,
    color: "#5C768D",
    marginTop: 2,
  },
  chevronContainer: {
    paddingLeft: 10,
  },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#BDC3C7',
    transform: [{ rotate: "45deg" }],
  },

  // Guidance/Tip Card
  tipCard: {
    backgroundColor: "rgba(124, 179, 66, 0.05)", 
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 179, 66, 0.15)',
    borderStyle: 'dashed',
    marginTop: 15,
  },
  tipHeader: {
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#388E3C",
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 13,
    color: "#4F6F52",
    lineHeight: 20,
    fontWeight: "500",
  },
});