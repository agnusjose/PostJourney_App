import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function WriteReviewScreen({ navigation, route }) {
    const { booking } = route.params;
    const { user } = useAuth();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const BASE_URL = "http://192.168.137.1:5000";

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a star rating");
            return;
        }

        setSubmitting(true);

        try {
            const equipmentId = booking.equipmentId?._id || booking.equipmentId;

            const response = await axios.post(
                `${BASE_URL}/equipment/${equipmentId}/review`,
                {
                    userId: user.userId,
                    userName: user.name,
                    rating,
                    comment: comment.trim(),
                    bookingId: booking._id,
                }
            );

            if (response.data.success) {
                Alert.alert(
                    "Thank You!",
                    "Your review has been submitted successfully",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            } else {
                Alert.alert("Error", response.data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            Alert.alert("Error", "Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i)}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={40}
                        color={i <= rating ? "#fbbf24" : "#CFD8DC"}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    const getRatingText = () => {
        switch (rating) {
            case 1: return "Poor";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Very Good";
            case 5: return "Excellent";
            default: return "Tap to rate";
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/pjlogo_bg.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="dark-content" />

                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Write Review</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Equipment Info */}
                        <View style={styles.equipmentCard}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="medkit-outline" size={32} color="#1E88E5" />
                            </View>
                            <View style={styles.equipmentInfo}>
                                <Text style={styles.equipmentName}>
                                    {booking.equipmentName || "Equipment"}
                                </Text>
                                <Text style={styles.providerName}>
                                    Provider: {booking.providerName || "N/A"}
                                </Text>
                            </View>
                        </View>

                        {/* Rating Section */}
                        <View style={styles.ratingSection}>
                            <Text style={styles.sectionTitle}>Rate your experience</Text>
                            <View style={styles.starsContainer}>{renderStars()}</View>
                            <Text
                                style={[
                                    styles.ratingText,
                                    rating > 0 && styles.ratingTextActive,
                                ]}
                            >
                                {getRatingText()}
                            </Text>
                        </View>

                        {/* Comment Section */}
                        <View style={styles.commentSection}>
                            <Text style={styles.sectionTitle}>Write your review (optional)</Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Share your experience with this equipment..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={comment}
                                onChangeText={setComment}
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{comment.length}/500</Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                rating === 0 && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Review</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.bottomPadding} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

    container: {
        flex: 1,
    },
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
    equipmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    equipmentInfo: {
        flex: 1,
    },
    equipmentName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 4,
    },
    providerName: {
        fontSize: 14,
        color: "#5C768D",
        fontWeight: "500",
    },
    ratingSection: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        alignItems: "center",
        elevation: 4,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2C3E50",
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
        gap: 8,
    },
    starButton: {
        paddingHorizontal: 4,
    },
    ratingText: {
        fontSize: 18,
        color: "#94a3b8",
        fontWeight: "600",
        marginTop: 8,
    },
    ratingTextActive: {
        color: "#1E88E5",
        fontWeight: "700",
    },
    commentSection: {
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
    commentInput: {
        borderWidth: 1,
        borderColor: "#E1E8ED",
        borderRadius: 15,
        padding: 16,
        fontSize: 15,
        color: "#2C3E50",
        minHeight: 120,
        backgroundColor: "#F8FAFC",
        textAlignVertical: "top",
    },
    charCount: {
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "right",
        marginTop: 8,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1E88E5",
        padding: 18,
        borderRadius: 15,
        gap: 10,
        elevation: 4,
        shadowColor: "#1E88E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonDisabled: {
        backgroundColor: "#94a3b8",
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    bottomPadding: {
        height: 40,
    },
});
