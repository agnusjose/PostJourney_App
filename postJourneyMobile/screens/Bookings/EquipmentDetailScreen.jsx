// EquipmentDetailScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from "react-native";
import { useCart } from "../../context/CartContext";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function EquipmentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { equipmentId } = route.params;
  const {
    addToCart,
    prepareForImmediateBooking,
    isItemInCart,
    getCartItemQuantity,
    loading: cartLoading
  } = useCart();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const BASE_URL = "http://172.16.230.150:5000";

  useEffect(() => {
    fetchEquipmentDetails();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (equipment) {
      // Calculate max available quantity
      const cartQty = getCartItemQuantity(equipment._id);
      const maxAvailable = Math.max(0, equipment.stock - cartQty);
      setQuantity(Math.min(1, maxAvailable));
    }
  }, [equipment]);

  const fetchEquipmentDetails = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/equipment/${equipmentId}`);
      if (res.data.success) {
        setEquipment(res.data.equipment);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load equipment details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/equipment/${equipmentId}/reviews`);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setAverageRating(res.data.averageRating || 0);
        setTotalReviews(res.data.totalReviews || 0);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!equipment || equipment.stock === 0) {
      Alert.alert("Out of Stock", "This equipment is currently unavailable");
      return;
    }

    const cartQty = getCartItemQuantity(equipment._id);
    const available = equipment.stock - cartQty;

    if (quantity > available) {
      Alert.alert("Insufficient Stock", `Only ${available} unit(s) available`);
      return;
    }

    setIsProcessing(true);

    const cartItem = {
      _id: equipment._id,
      equipmentName: equipment.equipmentName,
      pricePerDay: equipment.pricePerDay,
      imageUrl: equipment.imageUrl,
      providerName: equipment.providerName,
      providerId: equipment.providerId,
      category: equipment.category,
      quantity: quantity
    };

    const result = await addToCart(cartItem);

    if (result.success) {
      Alert.alert(
        "Added to Cart",
        `${quantity}x ${equipment.equipmentName} added to cart`,
        [
          { text: "Continue Shopping", style: "cancel" },
          {
            text: "View Cart",
            onPress: () => navigation.navigate("PatientCart")
          }
        ]
      );
    } else {
      Alert.alert("Cannot Add to Cart", result.message || "Failed to add to cart");
    }

    setIsProcessing(false);
  };

  const handleBookNow = async () => {
    if (!equipment || equipment.stock === 0) {
      Alert.alert("Out of Stock", "This equipment is currently unavailable");
      return;
    }

    const cartQty = getCartItemQuantity(equipment._id);
    const available = equipment.stock - cartQty;

    if (quantity > available) {
      Alert.alert("Insufficient Stock", `Only ${available} unit(s) available`);
      return;
    }

    setIsProcessing(true);

    const result = await prepareForImmediateBooking(equipment._id, quantity);
    if (result.success) {
      navigation.navigate("CheckoutScreen", {
        immediateBookingItem: result.bookingItem
      });
    } else {
      Alert.alert("Cannot Proceed", result.message || "Failed to proceed to booking");
    }

    setIsProcessing(false);
  };

  const handleIncreaseQuantity = () => {
    if (!equipment) return;

    const cartQty = getCartItemQuantity(equipment._id);
    const maxAvailable = equipment.stock - cartQty;

    if (quantity < maxAvailable) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert(
        "Maximum Quantity",
        `Only ${maxAvailable} unit(s) available (${cartQty} already in cart)`
      );
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#fbbf24" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#fbbf24" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#CFD8DC" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/pjlogo_bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.overlay, styles.centerContainer]}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ImageBackground>
    );
  }

  if (!equipment) {
    return (
      <ImageBackground
        source={require("../../assets/pjlogo_bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.overlay, styles.errorContainer]}>
          <Text style={styles.errorText}>Equipment not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  const imageUrl = equipment.imageUrl
    ? `${BASE_URL}${equipment.imageUrl}`
    : "https://via.placeholder.com/300";

  const categoryColors = {
    "mobility": "#1E88E5",
    "respiratory": "#10b981",
    "daily-living": "#8b5cf6",
    "therapeutic": "#f59e0b",
    "monitoring": "#ef4444",
    "other": "#5C768D"
  };

  const cartQty = getCartItemQuantity(equipment._id);
  const availableForAdd = Math.max(0, equipment.stock - cartQty);
  const canAdd = availableForAdd > 0 && quantity <= availableForAdd;

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
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipment Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Product Images */}
          <TouchableOpacity onPress={() => setShowFullImage(true)}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColors[equipment.category] || "#5C768D" }]}>
              <Text style={styles.categoryText}>
                {equipment.category?.replace("-", " ").toUpperCase() || "OTHER"}
              </Text>
            </View>

            {/* Product Name */}
            <Text style={styles.equipmentName}>{equipment.equipmentName}</Text>

            {/* Provider Info */}
            <View style={styles.providerContainer}>
              <Ionicons name="business" size={16} color="#5C768D" />
              <Text style={styles.providerText}>Sold by: {equipment.providerName}</Text>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {renderStars(averageRating)}
                <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.ratingCount}>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</Text>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹ {equipment.pricePerDay}</Text>
              <Text style={styles.priceUnit}> / day</Text>
            </View>

            {/* Stock Status */}
            <View style={styles.stockContainer}>
              {equipment.stock > 0 ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.inStock}>
                    In Stock ({equipment.stock})
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <Text style={styles.outOfStock}>Out of Stock</Text>
                </>
              )}
            </View>

            {/* Quantity Selector */}
            {equipment.stock > 0 && availableForAdd > 0 && (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityBtn, quantity <= 1 && styles.disabledQuantityBtn]}
                    onPress={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Ionicons name="remove" size={20} color={quantity <= 1 ? "#CFD8DC" : "#2C3E50"} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityBtn, quantity >= availableForAdd && styles.disabledQuantityBtn]}
                    onPress={handleIncreaseQuantity}
                    disabled={quantity >= availableForAdd}
                  >
                    <Ionicons name="add" size={20} color={quantity >= availableForAdd ? "#CFD8DC" : "#2C3E50"} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityHint}>
                  Max: {availableForAdd} unit(s) available. {cartQty > 0 && ` (${cartQty} in cart)`}
                </Text>
              </View>
            )}

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{equipment.description}</Text>
            </View>

            {/* Specifications */}
            <View style={styles.specsContainer}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category:</Text>
                <Text style={styles.specValue}>{equipment.category?.replace("-", " ") || "Other"}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Daily Price:</Text>
                <Text style={styles.specValue}>₹ {equipment.pricePerDay}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Available Stock:</Text>
                <Text style={styles.specValue}>{equipment.stock} units</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Condition:</Text>
                <Text style={styles.specValue}>Sanitized & Certified</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.addToCartBtn, (!canAdd || isProcessing || cartLoading) && styles.disabledBtn]}
                onPress={handleAddToCart}
                disabled={!canAdd || isProcessing || cartLoading}
              >
                {isProcessing || cartLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.addToCartText}>
                      {cartQty > 0 ? 'Add More' : 'Add to Cart'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buyNowBtn, (!canAdd || isProcessing || cartLoading) && styles.disabledBtn]}
                onPress={handleBookNow}
                disabled={!canAdd || isProcessing || cartLoading}
              >
                {isProcessing || cartLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color="#fff" />
                    <Text style={styles.buyNowText}>Book Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Delivery Info */}
            <View style={styles.deliveryInfo}>
              <Ionicons name="time" size={18} color="#1E88E5" />
              <Text style={styles.deliveryText}>Same-day delivery available in metro cities</Text>
            </View>

            <View style={styles.deliveryInfo}>
              <Ionicons name="shield-checkmark" size={18} color="#10b981" />
              <Text style={styles.deliveryText}>Fully sanitized and certified equipment</Text>
            </View>

            {/* Customer Reviews Section */}
            {reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>Customer Reviews ({totalReviews})</Text>
                {reviews.slice(0, 5).map((review, index) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <Ionicons name="person-circle" size={32} color="#94a3b8" />
                        <View>
                          <Text style={styles.reviewerName}>{review.userName}</Text>
                          <View style={styles.reviewStarsRow}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <Ionicons
                                key={i}
                                name={i < review.rating ? "star" : "star-outline"}
                                size={14}
                                color="#fbbf24"
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.date).toLocaleDateString()}
                      </Text>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>"{review.comment}"</Text>
                    )}
                  </View>
                ))}
                {reviews.length > 5 && (
                  <Text style={styles.moreReviewsText}>
                    +{reviews.length - 5} more reviews
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Full Screen Image Modal */}
          <Modal
            visible={showFullImage}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.fullImageModal}>
              <TouchableOpacity
                style={styles.closeFullImage}
                onPress={() => setShowFullImage(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
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
    // backgroundColor: 'transparent'
  },
  headerBackButton: {
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

  scrollContainer: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#5C768D",
    fontWeight: "500",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#2C3E50",
    fontWeight: "700",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  mainImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f1f5f9",
  },

  infoContainer: {
    padding: 22,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, // Overlap image slightly
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 500,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  equipmentName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  providerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  providerText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
    marginLeft: 6,
  },
  ratingCount: {
    fontSize: 14,
    color: "#5C768D",
    marginLeft: 8,
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2C3E50",
  },
  priceUnit: {
    fontSize: 16,
    color: "#5C768D",
    marginLeft: 4,
    fontWeight: "500",
  },

  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  inStock: {
    marginLeft: 6,
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  outOfStock: {
    marginLeft: 6,
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },

  quantityContainer: {
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F4F8",
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F4F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFD8DC",
  },
  disabledQuantityBtn: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
    color: "#2C3E50",
  },
  quantityHint: {
    fontSize: 12,
    color: "#5C768D",
    textAlign: "center",
    marginTop: 8,
  },

  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5C768D",
  },

  specsContainer: {
    marginBottom: 24,
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E8ED",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  specLabel: {
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "600",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1E88E5",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#388E3C",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#388E3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buyNowText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  deliveryText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },

  reviewsSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E1E8ED",
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 2,
  },
  reviewStarsRow: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  reviewComment: {
    fontSize: 14,
    color: "#5C768D",
    fontStyle: "italic",
    lineHeight: 22,
    marginTop: 6,
  },
  moreReviewsText: {
    fontSize: 14,
    color: "#1E88E5",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  fullImageModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeFullImage: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
  },
});