import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ImageBackground,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

export default function OrderDetailsScreen({ navigation, route }) {
    const { booking: initialBooking } = route.params;
    const [booking, setBooking] = useState(initialBooking);
    const [loading, setLoading] = useState(false);

    const BASE_URL = "http://192.168.137.1:5000";

    // Refresh booking data when screen is focused (e.g., after submitting a review)
    useFocusEffect(
        useCallback(() => {
            const fetchUpdatedBooking = async () => {
                try {
                    const res = await axios.get(`${BASE_URL}/booking/${initialBooking._id}`);
                    if (res.data.success && res.data.booking) {
                        setBooking(res.data.booking);
                    }
                } catch (error) {
                    console.log("Could not refresh booking:", error.message);
                }
            };

            fetchUpdatedBooking();
        }, [initialBooking._id])
    );

    // Order status steps
    const statusSteps = ["pending", "confirmed", "in-progress", "completed"];
    const currentStepIndex = statusSteps.indexOf(booking.status);
    const isCancelled = booking.status === "cancelled";

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "#10b981";
            case "in-progress": return "#3b82f6";
            case "completed": return "#8b5cf6";
            case "cancelled": return "#ef4444";
            default: return "#f59e0b";
        }
    };

    const getStepLabel = (step) => {
        switch (step) {
            case "pending": return "Order Placed";
            case "confirmed": return "Confirmed";
            case "in-progress": return "In Progress";
            case "completed": return "Completed";
            default: return step;
        }
    };

    const handleContactProvider = () => {
        // You could implement calling or messaging functionality here
        Alert.alert(
            "Contact Provider",
            `Provider: ${booking.providerName}`,
            [{ text: "OK" }]
        );
    };

    const handleCancelOrder = () => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement cancel order API call
                        Alert.alert("Info", "Order cancellation functionality will be implemented");
                    }
                }
            ]
        );
    };

    return (
        <ImageBackground
            source={require("../../assets/pjlogo_bg.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Order ID & Status */}
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderId}>Order #{booking._id?.slice(-8).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>
                                Placed on {new Date(booking.createdAt || booking.startDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>
                                {booking.status?.toUpperCase() || "PENDING"}
                            </Text>
                        </View>
                    </View>

                    {/* Order Tracking */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Tracking</Text>
                        <View style={styles.trackingContainer}>
                            {isCancelled ? (
                                <View style={styles.cancelledContainer}>
                                    <Ionicons name="close-circle" size={48} color="#ef4444" />
                                    <Text style={styles.cancelledText}>Order Cancelled</Text>
                                    {booking.cancellationReason && (
                                        <Text style={styles.cancelReason}>
                                            Reason: {booking.cancellationReason}
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                statusSteps.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const isLast = index === statusSteps.length - 1;

                                    return (
                                        <View key={step} style={styles.stepContainer}>
                                            <View style={styles.stepIndicatorContainer}>
                                                <View
                                                    style={[
                                                        styles.stepCircle,
                                                        isCompleted && styles.stepCircleCompleted,
                                                        isCurrent && styles.stepCircleCurrent,
                                                    ]}
                                                >
                                                    {isCompleted && (
                                                        <Ionicons
                                                            name={isCurrent ? "radio-button-on" : "checkmark"}
                                                            size={16}
                                                            color="#fff"
                                                        />
                                                    )}
                                                </View>
                                                {!isLast && (
                                                    <View
                                                        style={[
                                                            styles.stepLine,
                                                            index < currentStepIndex && styles.stepLineCompleted,
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.stepContent}>
                                                <Text
                                                    style={[
                                                        styles.stepLabel,
                                                        isCompleted && styles.stepLabelCompleted,
                                                        isCurrent && styles.stepLabelCurrent,
                                                    ]}
                                                >
                                                    {getStepLabel(step)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                    {/* Equipment Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Equipment Details</Text>
                        <View style={styles.equipmentCard}>
                            <View style={styles.equipmentInfo}>
                                <Text style={styles.equipmentName}>
                                    {booking.equipmentName || "Equipment"}
                                </Text>
                                <Text style={styles.providerName}>
                                    Provider: {booking.providerName || "N/A"}
                                </Text>
                                <Text style={styles.quantity}>
                                    Quantity: {booking.quantity || 1}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Rental Period */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rental Period</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color="#5C768D" />
                                <Text style={styles.infoLabel}>Start Date:</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(booking.startDate).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar" size={20} color="#5C768D" />
                                <Text style={styles.infoLabel}>End Date:</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(booking.endDate).toLocaleDateString()}
                                </Text>
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
                                <Text style={styles.priceLabel}>Price per day</Text>
                                <Text style={styles.priceValue}>₹{booking.pricePerDay?.toFixed(2) || "0.00"}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Quantity</Text>
                                <Text style={styles.priceValue}>× {booking.quantity || 1}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Duration</Text>
                                <Text style={styles.priceValue}>× {booking.totalDays || 0} days</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>₹{booking.totalAmount?.toFixed(2) || "0.00"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Delivery Address */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Information</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={20} color="#5C768D" />
                                <Text style={styles.addressText}>{booking.deliveryAddress || "Not provided"}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={20} color="#5C768D" />
                                <Text style={styles.phoneText}>{booking.contactPhone || "Not provided"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Payment Status */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.paymentCard}>
                            {/* Payment Method */}
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Method</Text>
                                <View style={styles.paymentMethodBadge}>
                                    <Ionicons
                                        name={
                                            booking.paymentMethod === "cod" ? "cash-outline" :
                                                booking.paymentMethod === "upi" ? "phone-portrait-outline" :
                                                    booking.paymentMethod === "card" ? "card-outline" :
                                                        booking.paymentMethod === "netbanking" ? "globe-outline" :
                                                            booking.paymentMethod === "wallet" ? "wallet-outline" :
                                                                "help-circle-outline"
                                        }
                                        size={16}
                                        color="#5C768D"
                                    />
                                    <Text style={styles.paymentMethodText}>
                                        {booking.paymentMethod === "cod" ? "Cash on Delivery" :
                                            booking.paymentMethod === "upi" ? "UPI" :
                                                booking.paymentMethod === "card" ? "Card" :
                                                    booking.paymentMethod === "netbanking" ? "Net Banking" :
                                                        booking.paymentMethod === "wallet" ? "Wallet" :
                                                            "Pending"}
                                    </Text>
                                </View>
                            </View>

                            {/* Payment Status */}
                            <View style={[styles.paymentRow, { marginTop: 12 }]}>
                                <Text style={styles.paymentLabel}>Status</Text>
                                <View
                                    style={[
                                        styles.paymentBadge,
                                        {
                                            backgroundColor:
                                                booking.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.paymentBadgeText,
                                            {
                                                color:
                                                    booking.paymentStatus === "paid" ? "#10b981" : "#f59e0b",
                                            },
                                        ]}
                                    >
                                        {booking.paymentStatus?.toUpperCase() || "PENDING"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Notes */}
                    {booking.notes && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes</Text>
                            <View style={styles.notesCard}>
                                <Text style={styles.notesText}>{booking.notes}</Text>
                            </View>
                        </View>
                    )}

                    {/* Your Review Section */}
                    {booking.status === "completed" && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Your Review</Text>
                            {booking.hasReview && booking.review ? (
                                <View style={styles.reviewCard}>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= booking.review.rating ? "star" : "star-outline"}
                                                size={20}
                                                color={star <= booking.review.rating ? "#fbbf24" : "#d1d5db"}
                                            />
                                        ))}
                                        <Text style={styles.reviewRatingText}>
                                            {booking.review.rating}/5
                                        </Text>
                                    </View>
                                    {booking.review.comment ? (
                                        <Text style={styles.reviewComment}>
                                            "{booking.review.comment}"
                                        </Text>
                                    ) : null}
                                    <Text style={styles.reviewDate}>
                                        Reviewed on {new Date(booking.review.reviewDate).toLocaleDateString()}
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.writeReviewCard}
                                    onPress={() =>
                                        navigation.navigate("WriteReviewScreen", {
                                            booking: booking,
                                        })
                                    }
                                >
                                    <Ionicons name="star-outline" size={24} color="#8b5cf6" />
                                    <View style={styles.writeReviewText}>
                                        <Text style={styles.writeReviewTitle}>Rate this equipment</Text>
                                        <Text style={styles.writeReviewSub}>Share your experience with others</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        {booking.status === "pending" && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelOrder}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                            </TouchableOpacity>
                        )}

                    </View>

                    <View style={styles.bottomPadding} />
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
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#2C3E50",
        letterSpacing: -0.5,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 22,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    orderId: {
        fontSize: 18,
        fontWeight: "800",
        color: "#2C3E50",
    },
    orderDate: {
        fontSize: 14,
        color: "#5C768D",
        marginTop: 4,
        fontWeight: "500",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    trackingContainer: {
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
    cancelledContainer: {
        alignItems: "center",
        padding: 20,
    },
    cancelledText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#DC2626",
        marginTop: 12,
    },
    cancelReason: {
        fontSize: 14,
        color: "#5C768D",
        marginTop: 4,
        textAlign: "center",
    },
    stepContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    stepIndicatorContainer: {
        alignItems: "center",
        width: 40,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F0F4F8",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#CFD8DC",
    },
    stepCircleCompleted: {
        backgroundColor: "#10b981",
        borderColor: "#10b981",
    },
    stepCircleCurrent: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    stepLine: {
        width: 2,
        height: 30,
        backgroundColor: "#CFD8DC",
        marginVertical: 4,
    },
    stepLineCompleted: {
        backgroundColor: "#10b981",
    },
    stepContent: {
        flex: 1,
        paddingLeft: 12,
        paddingTop: 4,
    },
    stepLabel: {
        fontSize: 14,
        color: "#94a3b8",
        fontWeight: "500",
    },
    stepLabelCompleted: {
        color: "#10b981",
        fontWeight: "600",
    },
    stepLabelCurrent: {
        color: "#3b82f6",
        fontWeight: "700",
    },
    equipmentCard: {
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
    equipmentInfo: {
        flex: 1,
    },
    equipmentName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 6,
    },
    providerName: {
        fontSize: 14,
        color: "#5C768D",
        marginBottom: 6,
        fontWeight: "500",
    },
    quantity: {
        fontSize: 14,
        color: "#1E88E5",
        fontWeight: "600",
    },
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
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: "#5C768D",
        marginLeft: 12,
        flex: 1,
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 15,
        color: "#2C3E50",
        fontWeight: "600",
    },
    addressText: {
        fontSize: 14,
        color: "#2C3E50",
        marginLeft: 12,
        flex: 1,
        fontWeight: "500",
        lineHeight: 20,
    },
    phoneText: {
        fontSize: 14,
        color: "#2C3E50",
        marginLeft: 12,
        flex: 1,
        fontWeight: "600",
    },
    priceCard: {
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
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: "#5C768D",
        fontWeight: "500",
    },
    priceValue: {
        fontSize: 14,
        color: "#2C3E50",
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F4F8",
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C3E50",
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#10b981",
    },
    paymentCard: {
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
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    paymentLabel: {
        fontSize: 14,
        color: "#5C768D",
        fontWeight: "500",
    },
    paymentBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paymentBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    paymentMethodBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0F4F8",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    paymentMethodText: {
        fontSize: 13,
        color: "#5C768D",
        fontWeight: "600",
    },
    notesCard: {
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
    notesText: {
        fontSize: 14,
        color: "#5C768D",
        lineHeight: 22,
    },
    actionsContainer: {
        marginTop: 8,
        gap: 12,
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEF2F2",
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#FECACA",
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cancelButtonText: {
        color: "#DC2626",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#1E88E5",
        shadowColor: "#1E88E5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    contactButtonText: {
        color: "#1E88E5",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },
    reviewCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E1E8ED",
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    reviewStars: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    reviewRatingText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2C3E50",
        marginLeft: 8,
    },
    reviewComment: {
        fontSize: 14,
        color: "#5C768D",
        fontStyle: "italic",
        marginBottom: 8,
        lineHeight: 20,
    },
    reviewDate: {
        fontSize: 12,
        color: "#94A3B8",
        textAlign: "right",
    },
    writeReviewCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E1E8ED",
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    writeReviewText: {
        flex: 1,
        marginLeft: 16,
    },
    writeReviewTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C3E50",
    },
    writeReviewSub: {
        fontSize: 13,
        color: "#5C768D",
        marginTop: 2,
    },
    bottomPadding: {
        height: 40,
    },
});
