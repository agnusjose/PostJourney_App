import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const BASE_URL = "http://172.16.230.150:5000";

export default function CaregiverEditProfile({ route, navigation }) {
    const { userId, email } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        agencyName: "",
        phoneNumber: "",
        city: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Use the admin user details endpoint to get all fields
            const res = await axios.get(`${BASE_URL}/admin/users/${userId}/details`);
            if (res.data.success) {
                const u = res.data.user;
                setFormData({
                    agencyName: u.agencyName || "",
                    phoneNumber: u.phoneNumber || "",
                    city: u.city || "",
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.agencyName || !formData.phoneNumber || !formData.city) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        if (formData.phoneNumber.length !== 10) {
            Alert.alert("Error", "Please enter a valid 10-digit phone number");
            return;
        }

        setSaving(true);
        try {
            const res = await axios.post(
                `${BASE_URL}/api/service-provider/complete-profile`,
                {
                    email,
                    agencyName: formData.agencyName,
                    serviceType: "caregiver",
                    phoneNumber: formData.phoneNumber,
                    city: formData.city,
                }
            );
            if (res.data.success) {
                Alert.alert("Success", "Profile updated successfully", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert("Error", res.data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            Alert.alert("Error", "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ImageBackground
                source={require("../assets/pjlogo_bg.png")}
                style={styles.bg}
                resizeMode="cover"
            >
                <View style={[styles.overlay, styles.centered]}>
                    <ActivityIndicator size="large" color="#8E24AA" />
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require("../assets/pjlogo_bg.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="dark-content" />

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Edit Profile</Text>
                            <Text style={styles.headerSubtitle}>
                                Update your caregiver details
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.label}>Agency / Company Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your agency name"
                            value={formData.agencyName}
                            onChangeText={(text) =>
                                setFormData({ ...formData, agencyName: text })
                            }
                        />

                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit phone number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={formData.phoneNumber}
                            onChangeText={(text) =>
                                setFormData({ ...formData, phoneNumber: text })
                            }
                        />

                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your city"
                            value={formData.city}
                            onChangeText={(text) =>
                                setFormData({ ...formData, city: text })
                            }
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="#fff"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.saveButtonText}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(245, 250, 255, 0.85)" },
    centered: { justifyContent: "center", alignItems: "center" },

    content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },

    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#2C3E50",
        letterSpacing: -0.5,
    },
    headerSubtitle: { fontSize: 14, color: "#5C768D", marginTop: 2 },

    formCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 22,
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: "#E8EDF2",
    },
    label: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E1E8ED",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#2C3E50",
        backgroundColor: "#F8FAFC",
    },

    saveButton: {
        flexDirection: "row",
        backgroundColor: "#8E24AA",
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#8E24AA",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveButtonDisabled: { backgroundColor: "#94a3b8" },
    saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
