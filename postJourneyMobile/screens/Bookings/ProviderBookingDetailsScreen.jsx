import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ImageBackground,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function ProviderBookingDetailsScreen({ navigation, route }) {
    const { booking: initialBooking } = route.params;
    const [booking, setBooking] = useState(initialBooking);
    const [loading, setLoading] = useState(false);

    const BASE_URL = "http://192.168.137.1:5000";

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "#10b981";
            case "in-progress": return "#3b82f6";
            case "completed": return "#10b981";
            case "cancelled": return "#ef4444";
            default: return "#f59e0b";
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case "paid": return "#10b981";
            case "pending": return "#f59e0b";
            case "refunded": return "#8b5cf6";
            default: return "#6b7280";
        }
    };

    const updateBookingStatus = async (status) => {
        setLoading(true);
        try {
            const res = await axios.put(
                `${BASE_URL}/booking/update-status/${booking._id}`,
                { status }
            );

            if (res.data.success) {
                setBooking({ ...booking, status });
                Alert.alert("Success", `Booking ${status} successfully`);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const updatePaymentStatus = async () => {
        Alert.alert(
            "Confirm Payment",
            "Have you received the cash payment for this order?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Mark as Paid",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await axios.put(
                                `${BASE_URL}/booking/update-payment-status/${booking._id}`,
                                { paymentStatus: "paid" }
                            );

                            if (res.data.success) {
                                setBooking({ ...booking, paymentStatus: "paid" });
                                Alert.alert("Success", "Payment marked as paid");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to update payment status");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={16}
                    color="#fbbf24"
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

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
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <View style={styles.placeholder} />
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#1E88E5" />
                    </View>
                )}

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Order ID & Status */}
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderId}>Order #{booking._id?.slice(-8).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>
                                {new Date(booking.createdAt || booking.startDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
                        </View>
                    </View>

                    {/* Payment Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.paymentCard}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Method</Text>
                                <View style={styles.paymentMethodBadge}>
                                    <Ionicons
                                        name={booking.paymentMethod === "cod" ? "cash-outline" : "card-outline"}
                                        size={16}
                                        color="#33691E"
                                    />
                                    <Text style={styles.paymentMethodText}>
                                        {booking.paymentMethod === "cod" ? "Cash on Delivery" : booking.paymentMethod?.toUpperCase() || "Pending"}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.paymentRow, { marginTop: 12 }]}>
                                <Text style={styles.paymentLabel}>Status</Text>
                                <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(booking.paymentStatus) }]}>
                                    <Text style={styles.paymentStatusText}>
                                        {booking.paymentStatus?.toUpperCase() || "PENDING"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Details</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={20} color="#5C768D" />
                                <Text style={styles.infoValue}>{booking.patientName || "N/A"}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={20} color="#5C768D" />
                                <Text style={styles.infoValue}>{booking.contactPhone || "N/A"}</Text>
                            </View>
                            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                                <Ionicons name="location-outline" size={20} color="#5C768D" style={{ marginTop: 2 }} />
                                <Text style={styles.infoValue}>{booking.deliveryAddress || "N/A"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Equipment Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Equipment</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.equipmentRow}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="medkit-outline" size={24} color="#1E88E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.equipmentName}>{booking.equipmentName}</Text>
                                    <Text style={styles.quantity}>Quantity: {booking.quantity || 1}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Rental Period */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rental Period</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color="#5C768D" />
                                <Text style={styles.infoLabel}>Start:</Text>
                                <Text style={styles.infoValue}>{new Date(booking.startDate).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar" size={20} color="#5C768D" />
                                <Text style={styles.infoLabel}>End:</Text>
                                <Text style={styles.infoValue}>{new Date(booking.endDate).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#5C768D" />
                                <Text style={styles.infoLabel}>Duration:</Text>
                                <Text style={styles.infoValue}>{booking.totalDays || 0} days</Text>
                            </View>
                        </View>
                    </View>

                    {/* Price Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price Summary</Text>
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Price Breakdown</Text>
                                <Text style={styles.priceLabel}>₹{booking.pricePerDay}/day × {booking.quantity || 1} × {booking.totalDays || 0} days</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>₹{booking.totalAmount?.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Customer Review - Use booking's embedded review */}
                    {booking.hasReview && booking.review && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Customer Review</Text>
                            <View style={styles.reviewCard}>
                                <View style={styles.starsRow}>{renderStars(booking.review.rating)}</View>
                                {booking.review.comment && (
                                    <Text style={styles.reviewComment}>"{booking.review.comment}"</Text>
                                )}
                                <Text style={styles.reviewDate}>
                                    Reviewed on {new Date(booking.review.reviewDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        {booking.status === "pending" && (
                            <>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => updateBookingStatus("confirmed")}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Confirm Booking</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.rejectButton}
                                    onPress={() => updateBookingStatus("cancelled")}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {booking.status === "confirmed" && (
                            <TouchableOpacity
                                style={styles.progressButton}
                                onPress={() => updateBookingStatus("in-progress")}
                            >
                                <Ionicons name="play-circle-outline" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Mark as In Progress</Text>
                            </TouchableOpacity>
                        )}

                        {booking.status === "in-progress" && (
                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={() => updateBookingStatus("completed")}
                            >
                                <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Mark as Completed</Text>
                            </TouchableOpacity>
                        )}

                        {booking.status === "completed" &&
                            booking.paymentMethod === "cod" &&
                            booking.paymentStatus === "pending" && (
                                <TouchableOpacity style={styles.paidButton} onPress={updatePaymentStatus}>
                                    <Ionicons name="cash-outline" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Mark as Paid</Text>
                                </TouchableOpacity>
                            )}
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
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#2C3E50", letterSpacing: -0.5 },
    placeholder: { width: 40 },

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

    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    orderId: { fontSize: 18, fontWeight: "700", color: "#2C3E50" },
    orderDate: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    statusText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2C3E50", marginBottom: 16, letterSpacing: 0.2 },

    infoCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
    infoLabel: { fontSize: 15, color: "#5C768D", marginLeft: 0 },
    infoValue: { fontSize: 15, color: "#2C3E50", fontWeight: "600", flex: 1 },

    equipmentRow: { flexDirection: "row", alignItems: "center" },
    iconContainer: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    equipmentName: { fontSize: 18, fontWeight: "700", color: "#2C3E50", marginBottom: 4 },
    quantity: { fontSize: 14, color: "#1E88E5", fontWeight: "600" },

    paymentCard: {
        backgroundColor: "#fff", padding: 20, borderRadius: 20, elevation: 4,
        shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
        borderWidth: 1, borderColor: '#E1E8ED',
    },
    paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    paymentLabel: { fontSize: 15, color: "#5C768D" },
    paymentMethodBadge: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#F1F8E9",
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6,
        borderWidth: 1, borderColor: "#DCEDC8",
    },
    paymentMethodText: { fontSize: 13, color: "#33691E", fontWeight: "600" },
    paymentStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    paymentStatusText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    priceCard: {
        backgroundColor: "#fff", padding: 20, borderRadius: 20, elevation: 4,
        shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
        borderWidth: 1, borderColor: '#E1E8ED',
    },
    priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    priceLabel: { fontSize: 14, color: "#5C768D" },
    divider: { height: 1, backgroundColor: "#E1E8ED", marginVertical: 12 },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#2C3E50" },
    totalValue: { fontSize: 20, fontWeight: "800", color: "#10b981" },

    reviewCard: {
        backgroundColor: "#fff", padding: 20, borderRadius: 20, elevation: 4,
        shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
        borderWidth: 1, borderColor: '#E1E8ED',
    },
    starsRow: { flexDirection: "row", marginBottom: 10 },
    reviewComment: { fontSize: 15, color: "#455A64", lineHeight: 22, marginBottom: 10, fontStyle: "italic" },
    reviewDate: { fontSize: 12, color: "#94a3b8" },

    actionsContainer: { marginTop: 10, gap: 12 },
    confirmButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#16a34a", padding: 18, borderRadius: 15, gap: 10,
        shadowColor: "#16a34a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    rejectButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#ef4444", padding: 18, borderRadius: 15, gap: 10,
        shadowColor: "#ef4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    progressButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#3b82f6", padding: 18, borderRadius: 15, gap: 10,
        shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    completeButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#8b5cf6", padding: 18, borderRadius: 15, gap: 10,
        shadowColor: "#8b5cf6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    paidButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#10b981", padding: 18, borderRadius: 15, gap: 10,
        shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
