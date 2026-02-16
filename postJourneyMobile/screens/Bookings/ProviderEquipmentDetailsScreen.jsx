import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    StatusBar,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function ProviderEquipmentDetailsScreen({ navigation, route }) {
    const { equipment: initialEquipment } = route.params;
    const [equipment, setEquipment] = useState(initialEquipment);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const BASE_URL = "http://192.168.137.1:5000";

    // Refresh equipment data on focus
    useFocusEffect(
        useCallback(() => {
            fetchEquipmentDetails();
            fetchReviews();
        }, [equipment._id])
    );

    const fetchEquipmentDetails = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/equipment/${equipment._id}`);
            if (res.data.success) {
                // Preserve the full image URL
                const updatedEquipment = {
                    ...res.data.equipment,
                    imageUrl: equipment.imageUrl, // Keep original image URL with BASE_URL
                };
                setEquipment(updatedEquipment);
            }
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/equipment/${equipment._id}/reviews`);
            if (res.data.success) {
                setReviews(res.data.reviews || []);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Equipment",
            "Are you sure you want to delete this equipment? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await axios.delete(`${BASE_URL}/equipment/delete/${equipment._id}`);
                            if (res.data.success) {
                                Alert.alert("Success", "Equipment deleted successfully");
                                navigation.goBack();
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete equipment");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = () => {
        navigation.navigate("EditEquipment", { equipment });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={14}
                    color="#fbbf24"
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    const renderReviewItem = ({ item }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{item.userName || "Anonymous"}</Text>
                <View style={styles.reviewStars}>{renderStars(item.rating)}</View>
            </View>
            {item.comment ? (
                <Text style={styles.reviewComment}>{item.comment}</Text>
            ) : (
                <Text style={styles.noComment}>No comment</Text>
            )}
            <Text style={styles.reviewDate}>
                {new Date(item.reviewDate || item.date).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <ImageBackground
            source={require("../../assets/pjlogo_bg.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Details</Text>
                    <TouchableOpacity style={styles.menuButton} onPress={handleEdit}>
                        <Ionicons name="create-outline" size={24} color="#1E88E5" />
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#1E88E5" />
                    </View>
                )}

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Image Card */}
                    <View style={styles.imageCard}>
                        {equipment.imageUrl ? (
                            <Image source={{ uri: equipment.imageUrl }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={60} color="#CFD8DC" />
                                <Text style={styles.placeholderText}>No Image</Text>
                            </View>
                        )}
                        <View style={styles.categoryBadgeOverlay}>
                            <Text style={styles.categoryBadgeText}>{equipment.category || "Other"}</Text>
                        </View>
                    </View>

                    {/* Equipment Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.equipmentName}>{equipment.equipmentName}</Text>

                        {/* Rating Summary */}
                        <View style={styles.ratingRow}>
                            <View style={styles.starsRow}>{renderStars(equipment.averageRating || 0)}</View>
                            <Text style={styles.ratingText}>
                                {(equipment.averageRating || 0).toFixed(1)} ({equipment.totalReviews || 0} reviews)
                            </Text>
                        </View>

                        <Text style={styles.description}>{equipment.description}</Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="pricetag-outline" size={24} color="#1E88E5" />
                            </View>
                            <Text style={styles.statValue}>₹{equipment.pricePerDay}</Text>
                            <Text style={styles.statLabel}>Per Day</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="layers-outline" size={24} color="#2E7D32" />
                            </View>
                            <Text style={styles.statValue}>{equipment.stock}</Text>
                            <Text style={styles.statLabel}>In Stock</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.iconCircle, { backgroundColor: equipment.isAvailable ? '#E3F2FD' : '#FFEBEE' }]}>
                                <Ionicons
                                    name={equipment.isAvailable ? "checkmark-circle-outline" : "close-circle-outline"}
                                    size={24}
                                    color={equipment.isAvailable ? "#1E88E5" : "#D32F2F"}
                                />
                            </View>
                            <Text style={[styles.statValue, { color: equipment.isAvailable ? "#1E88E5" : "#D32F2F" }]}>
                                {equipment.isAvailable ? "Yes" : "No"}
                            </Text>
                            <Text style={styles.statLabel}>Available</Text>
                        </View>
                    </View>

                    {/* Status Badges */}
                    <View style={styles.badgesContainer}>
                        <View style={styles.badgeRow}>
                            <Text style={styles.badgeLabel}>Listing Fee:</Text>
                            {equipment.listingFeePaid ? (
                                <View style={[styles.badge, styles.badgeSuccess]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                                    <Text style={styles.badgeSuccessText}>Paid</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, styles.badgeWarning]}>
                                    <Ionicons name="time-outline" size={16} color="#E65100" />
                                    <Text style={styles.badgeWarningText}>Pending</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.badgeRow}>
                            <Text style={styles.badgeLabel}>Visibility:</Text>
                            {equipment.isListed ? (
                                <View style={[styles.badge, styles.badgeSuccess]}>
                                    <Ionicons name="eye" size={16} color="#2E7D32" />
                                    <Text style={styles.badgeSuccessText}>Listed</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, styles.badgeWarning]}>
                                    <Ionicons name="eye-off" size={16} color="#E65100" />
                                    <Text style={styles.badgeWarningText}>Hidden</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Reviews Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Reviews</Text>
                        {reviews.length > 0 ? (
                            <View>
                                {reviews.map((item, index) => (
                                    <View key={index}>
                                        {renderReviewItem({ item })}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.noReviews}>
                                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CFD8DC" />
                                <Text style={styles.noReviewsText}>No reviews yet</Text>
                            </View>
                        )}
                        {reviews.length > 5 && (
                            <TouchableOpacity
                                style={styles.seeAllButton}
                                onPress={() => navigation.navigate("EquipmentReviews", { equipmentId: equipment._id })}
                            >
                                <Text style={styles.seeAllText}>See All Reviews</Text>
                                <Ionicons name="arrow-forward" size={16} color="#1E88E5" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={20} color="#EF5350" />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        paddingTop: 60,
        paddingBottom: 20,
    },
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
    },
    menuButton: {
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
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#2C3E50", letterSpacing: -0.5 },

    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.7)",
        zIndex: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    content: { flex: 1, paddingHorizontal: 22 },

    imageCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 20,
        height: 250,
        position: 'relative',
    },
    image: { width: "100%", height: "100%" },
    imagePlaceholder: {
        width: "100%", height: "100%",
        backgroundColor: "#F0F4F8",
        justifyContent: "center", alignItems: "center",
    },
    placeholderText: { color: "#90A4AE", marginTop: 8, fontWeight: '600' },

    categoryBadgeOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(44, 62, 80, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    categoryBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'capitalize'
    },

    infoSection: { marginBottom: 20 },
    equipmentName: { fontSize: 26, fontWeight: "800", color: "#2C3E50", marginBottom: 8, letterSpacing: -0.5 },

    ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    starsRow: { flexDirection: "row" },
    ratingText: { fontSize: 14, color: "#5C768D", fontWeight: '500' },

    description: { fontSize: 15, color: "#455A64", lineHeight: 24 },

    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 20,
        alignItems: "center",
        elevation: 3,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    statValue: { fontSize: 16, fontWeight: "700", color: "#2C3E50", marginBottom: 2 },
    statLabel: { fontSize: 11, color: "#5C768D", fontWeight: "600" },

    badgesContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    badgeLabel: { fontSize: 14, color: '#5C768D', fontWeight: '600' },

    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
    },
    badgeSuccess: { backgroundColor: "#E8F5E9", borderColor: '#C8E6C9' },
    badgeWarning: { backgroundColor: "#FFF3E0", borderColor: '#FFE0B2' },
    badgeSuccessText: { color: "#2E7D32", fontWeight: "700", fontSize: 12 },
    badgeWarningText: { color: "#E65100", fontWeight: "700", fontSize: 12 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2C3E50", marginBottom: 16 },

    reviewItem: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    reviewHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    reviewerName: { fontSize: 14, fontWeight: "700", color: "#2C3E50" },
    reviewStars: { flexDirection: "row" },
    reviewComment: { fontSize: 14, color: "#455A64", marginBottom: 8, lineHeight: 20 },
    noComment: { fontSize: 13, color: "#90A4AE", fontStyle: "italic", marginBottom: 6 },
    reviewDate: { fontSize: 11, color: "#90A4AE" },

    noReviews: { alignItems: "center", paddingVertical: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E1E8ED', borderStyle: 'dashed' },
    noReviewsText: { color: "#90A4AE", marginTop: 8, fontWeight: '500' },

    seeAllButton: { flexDirection: 'row', alignItems: "center", justifyContent: 'center', paddingVertical: 12, marginTop: 8 },
    seeAllText: { color: "#1E88E5", fontWeight: "700", marginRight: 4 },

    actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    editButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1E88E5",
        padding: 16,
        borderRadius: 15,
        gap: 8,
        shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    deleteButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 15,
        gap: 8,
        borderWidth: 1,
        borderColor: '#EF5350',
    },
    actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    deleteButtonText: { color: "#EF5350", fontSize: 16, fontWeight: "700" },
});
