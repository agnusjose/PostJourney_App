import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const BASE_URL = "http://172.16.230.150:5000";

export default function CaregiverListScreen({ navigation }) {
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCaregivers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/caregivers`);
            if (res.data.success) {
                setCaregivers(res.data.caregivers);
            }
        } catch (err) {
            console.error("Error fetching caregivers:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCaregivers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCaregivers();
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarColors = [
        "#8E24AA", "#5C6BC0", "#26A69A", "#EF5350",
        "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC",
    ];

    const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

    const renderCaregiverCard = (caregiver, index) => (
        <TouchableOpacity
            key={caregiver._id}
            style={styles.card}
            onPress={() =>
                navigation.navigate("CaregiverDetailScreen", { caregiver })
            }
            activeOpacity={0.7}
        >
            <View
                style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}
            >
                <Text style={styles.avatarText}>{getInitials(caregiver.name)}</Text>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.caregiverName}>{caregiver.name}</Text>
                {caregiver.agencyName ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={14} color="#5C768D" />
                        <Text style={styles.infoText}>{caregiver.agencyName}</Text>
                    </View>
                ) : null}
                {caregiver.city ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={14} color="#5C768D" />
                        <Text style={styles.infoText}>{caregiver.city}</Text>
                    </View>
                ) : null}
                {caregiver.caregiverReviews && caregiver.caregiverReviews.length > 0 ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="star" size={14} color="#FFC107" />
                        <Text style={styles.ratingText}>
                            {(caregiver.caregiverReviews.reduce((s, r) => s + r.rating, 0) / caregiver.caregiverReviews.length).toFixed(1)}
                        </Text>
                        <Text style={styles.infoText}>
                            ({caregiver.caregiverReviews.length})
                        </Text>
                    </View>
                ) : null}
            </View>

            <Ionicons name="chevron-forward" size={22} color="#CFD8DC" />
        </TouchableOpacity>
    );

    return (
        <ImageBackground
            source={require("../assets/pjlogo_bg.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Caregiver Services</Text>
                        <Text style={styles.headerSubtitle}>
                            Find professional caregivers
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#8E24AA" />
                        <Text style={styles.loadingText}>Loading caregivers...</Text>
                    </View>
                ) : caregivers.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="people-outline" size={64} color="#CFD8DC" />
                        <Text style={styles.emptyTitle}>No Caregivers Available</Text>
                        <Text style={styles.emptySubtitle}>
                            Please check back later for caregiver service providers.
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#8E24AA"]}
                            />
                        }
                    >
                        <Text style={styles.resultCount}>
                            {caregivers.length} caregiver{caregivers.length !== 1 ? "s" : ""}{" "}
                            found
                        </Text>
                        {caregivers.map((c, i) => renderCaregiverCard(c, i))}
                    </ScrollView>
                )}
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(245, 250, 255, 0.85)" },

    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        paddingTop: 60,
        paddingBottom: 20,
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

    listContainer: {
        paddingHorizontal: 22,
        paddingBottom: 40,
    },
    resultCount: {
        fontSize: 13,
        color: "#5C768D",
        marginBottom: 16,
        fontWeight: "600",
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        elevation: 3,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: "#E8EDF2",
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    avatarText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },

    cardContent: { flex: 1 },
    caregiverName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    infoText: {
        fontSize: 13,
        color: "#5C768D",
        marginLeft: 5,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2C3E50",
        marginLeft: 4,
    },

    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loadingText: {
        fontSize: 15,
        color: "#5C768D",
        marginTop: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#5C768D",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
});
