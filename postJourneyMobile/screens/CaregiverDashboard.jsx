import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "http://172.16.230.150:5000";

export default function CaregiverDashboard({ route, navigation }) {
    const { userId, userName, userEmail } = route.params || {};
    const { logout, user } = useAuth();
    const displayUser = userId ? { userId, userName, userEmail } : user;

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/caregiver/${displayUser?.userId}/reviews`
            );
            if (res.data.success) {
                setReviews(res.data.reviews);
                setAverageRating(res.data.averageRating);
                setTotalReviews(res.data.totalReviews);
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (displayUser?.userId) {
                fetchReviews();
            }
        }, [displayUser?.userId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchReviews();
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    navigation.replace("LoginScreen");
                },
            },
        ]);
    };

    useEffect(() => {
        if (!displayUser?.userId) {
            if (!user) {
                Alert.alert("Error", "User ID not found. Please login again.");
                navigation.replace("LoginScreen");
            }
        }
    }, [displayUser]);

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : i - 0.5 <= rating ? "star-half" : "star-outline"}
                    size={16}
                    color="#FFC107"
                />
            );
        }
        return stars;
    };

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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#8E24AA"]}
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>Caregiver Dashboard</Text>
                        <Text style={styles.headerSubtitle}>
                            Manage your profile & reviews
                        </Text>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>
                                    {(displayUser?.userName || "U").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>
                                    {displayUser?.userName || "Caregiver"}
                                </Text>
                                <Text style={styles.email}>
                                    {displayUser?.userEmail || "No Email"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={20} color="#FFC107" />
                                    <Text style={styles.statValue}>
                                        {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                                    </Text>
                                </View>
                                <Text style={styles.statLabel}>Avg Rating</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalReviews}</Text>
                                <Text style={styles.statLabel}>Total Reviews</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={styles.ratingRow}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color="#10b981"
                                    />
                                </View>
                                <Text style={styles.statLabel}>Verified</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() =>
                                navigation.navigate("CaregiverEditProfile", {
                                    userId: displayUser?.userId,
                                    email: displayUser?.userEmail,
                                })
                            }
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: "#E8F5E9" },
                                ]}
                            >
                                <Ionicons name="person-outline" size={32} color="#2E7D32" />
                            </View>
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionSubtitle}>Edit Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => {
                                // Scroll down to reviews section (already shown below)
                            }}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: "#FFF3E0" },
                                ]}
                            >
                                <Ionicons name="star-outline" size={32} color="#EF6C00" />
                            </View>
                            <Text style={styles.actionTitle}>Reviews</Text>
                            <Text style={styles.actionSubtitle}>
                                {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reviews Section */}
                    <View style={styles.reviewsSection}>
                        <Text style={styles.sectionTitle}>Patient Reviews</Text>

                        {loading ? (
                            <ActivityIndicator
                                size="small"
                                color="#8E24AA"
                                style={{ marginTop: 20 }}
                            />
                        ) : reviews.length === 0 ? (
                            <View style={styles.emptyReviews}>
                                <Ionicons
                                    name="chatbubble-ellipses-outline"
                                    size={48}
                                    color="#CFD8DC"
                                />
                                <Text style={styles.emptyText}>No reviews yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Reviews from patients will appear here
                                </Text>
                            </View>
                        ) : (
                            reviews.map((review, index) => (
                                <View key={index} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewAvatar}>
                                            <Text style={styles.reviewAvatarText}>
                                                {(review.userName || "?").charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewUserName}>
                                                {review.userName}
                                            </Text>
                                            <View style={styles.starsRow}>
                                                {renderStars(review.rating)}
                                            </View>
                                        </View>
                                        <Text style={styles.reviewDate}>
                                            {new Date(review.date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    {review.comment ? (
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons
                            name="log-out-outline"
                            size={20}
                            color="#EF5350"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(245, 250, 255, 0.85)" },

    content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },

    headerContainer: { marginBottom: 30 },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#2C3E50",
        letterSpacing: -0.5,
    },
    headerSubtitle: { fontSize: 16, color: "#5C768D", marginTop: 4 },

    profileCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E8ED",
    },
    profileHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#8E24AA",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
    name: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 2,
    },
    email: { fontSize: 14, color: "#5C768D" },

    divider: { height: 1, backgroundColor: "#E1E8ED", marginBottom: 14 },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: { alignItems: "center" },
    statValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#2C3E50",
    },
    statLabel: { fontSize: 12, color: "#5C768D", marginTop: 2 },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#E1E8ED",
    },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },

    actionsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 18,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 2,
    },
    actionSubtitle: { fontSize: 12, color: "#90A4AE" },

    reviewsSection: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        elevation: 3,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: "#E8EDF2",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 16,
    },

    emptyReviews: { alignItems: "center", paddingVertical: 30 },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#5C768D",
        marginTop: 12,
    },
    emptySubtext: { fontSize: 13, color: "#90A4AE", marginTop: 4 },

    reviewCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E8EDF2",
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#5C6BC0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    reviewAvatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    reviewUserName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2C3E50",
    },
    starsRow: { flexDirection: "row", marginTop: 2 },
    reviewDate: { fontSize: 11, color: "#90A4AE" },
    reviewComment: {
        fontSize: 13,
        color: "#5C768D",
        marginTop: 10,
        lineHeight: 19,
    },

    logoutBtn: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#EF5350",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutText: { color: "#EF5350", fontWeight: "700", fontSize: 16 },
});
