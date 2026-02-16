import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  Modal,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function EquipmentDashboardScreen({ route, navigation }) {
  // Get providerId from route params OR from auth context
  const routeProviderId = route.params?.providerId;
  const { user } = useAuth();
  const authProviderId = user?.userId;

  // FIXED: Use providerId from params or auth context
  const providerId = routeProviderId || authProviderId;

  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const BASE_URL = "http://172.16.230.150:5000";

  // Debug log
  console.log("🔍 EquipmentDashboardScreen - providerId:", providerId);

  // Fetch equipment function
  const fetchEquipment = async () => {
    try {
      if (!providerId) {
        Alert.alert("Error", "Provider ID not found. Please login again.");
        navigation.goBack();
        return;
      }

      console.log("🔍 Fetching equipment for provider:", providerId);

      // Fetch listed equipment (with paid fee)
      const listedRes = await axios.get(
        `${BASE_URL}/equipment/provider/${providerId}/listed`
      );

      // Fetch pending fee equipment
      const pendingRes = await axios.get(
        `${BASE_URL}/equipment/provider/${providerId}/pending-fee`
      );

      // Add full URL to image paths for listed equipment
      const listedWithFullUrls = (listedRes.data.equipment || []).map(item => ({
        ...item,
        imageUrl: item.imageUrl
          ? `${BASE_URL}${item.imageUrl}`
          : null,
        status: "listed"
      }));

      // Add full URL to image paths for pending equipment
      const pendingWithFullUrls = (pendingRes.data.equipment || []).map(item => ({
        ...item,
        imageUrl: item.imageUrl
          ? `${BASE_URL}${item.imageUrl}`
          : null,
        status: "pending",
        listingFee: item.listingFeeAmount || (item.pricePerDay * 0.05)
      }));

      // Combine lists: Pending first, then Listed
      setEquipmentList([...pendingWithFullUrls, ...listedWithFullUrls]);

    } catch (err) {
      console.error("❌ Error fetching equipment:", err);

      // Fallback logic if specific endpoints fail
      try {
        const fallbackRes = await axios.get(
          `${BASE_URL}/equipment/provider/${providerId}`
        );

        if (fallbackRes.data.success) {
          const allEquipment = (fallbackRes.data.equipment || []).map(item => ({
            ...item,
            imageUrl: item.imageUrl ? `${BASE_URL}${item.imageUrl}` : null,
            status: (item.listingFeePaid && item.isListed) ? "listed" : "pending",
            listingFee: item.listingFeeAmount || (item.pricePerDay * 0.05)
          }));
          // Sort pending first
          allEquipment.sort((a, b) => (a.status === 'pending' ? -1 : 1));
          setEquipmentList(allEquipment);
        }
      } catch (fallbackErr) {
        console.error("❌ Fallback fetch failed:", fallbackErr);
        Alert.alert("Error", "Failed to load equipment");
        setEquipmentList([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load equipment on focus
  useFocusEffect(
    useCallback(() => {
      if (providerId) {
        fetchEquipment();
      }
    }, [providerId])
  );

  // Manual refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchEquipment();
  };

  const handlePayFee = (equipment) => {
    Alert.alert(
      "Pay Listing Fee",
      `Pay 5% listing fee (₹${equipment.listingFee?.toFixed(2) || (equipment.pricePerDay * 0.05).toFixed(2)}) to list this equipment?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            navigation.navigate("PaymentScreen", {
              type: "listing_fee",
              amount: equipment.listingFee || (equipment.pricePerDay * 0.05),
              equipmentId: equipment._id,
              providerId: providerId,
            });
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProviderEquipmentDetailsScreen", { equipment: item })}
      activeOpacity={0.9}
    >
      {/* Image Section - Fixed Square with Corner Radius */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          if (item.imageUrl) {
            setSelectedImage(item.imageUrl);
            setImageModalVisible(true);
          }
        }}
        style={styles.imageContainer}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{item.equipmentName}</Text>
          {item.stock > 0 ? (
            <View style={[styles.stockBadge, item.status === 'pending' ? styles.pendingStockBadge : {}]}>
              <Text style={[styles.stockText, item.status === 'pending' ? styles.pendingStockText : {}]}>
                {item.status === 'pending' ? 'Pending' : `${item.stock} left`}
              </Text>
            </View>
          ) : (
            <View style={[styles.stockBadge, styles.outOfStockBadge]}>
              <Text style={[styles.stockText, styles.outOfStockText]}>Out</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <Text style={styles.price}>₹ {item.pricePerDay} <Text style={styles.perDay}>/ day</Text></Text>

        {/* Action Buttons or Rating */}
        <View style={styles.buttonRow}>
          {item.status === "pending" ? (
            <TouchableOpacity
              style={styles.payFeeBtn}
              onPress={(e) => {
                e.stopPropagation();
                handlePayFee(item);
              }}
            >
              <Text style={styles.payFeeText}>Pay Fee</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={18} color="#FFC107" />
              <Text style={styles.ratingText}>
                {item.averageRating ? item.averageRating.toFixed(1) : "0.0"}
                <Text style={styles.ratingCount}> ({item.totalReviews || 0})</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleDelete = async (id) => {
    // Kept for internal logic if needed, or remove if unused. 
    // Since buttons are gone, this might be dead code, but harmless to keep for now.
    Alert.alert(
      "Delete Equipment",
      "Are you sure you want to delete this equipment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // ...
          }
        }
      ]
    );
  };

  const handleBack = () => {
    console.log("Navigating back to ServiceProviderDashboard");
    const routeParams = route.params || {};

    if (routeParams.userId) {
      navigation.navigate("ServiceProviderDashboard", {
        userId: routeParams.userId,
        userName: routeParams.userName,
        userEmail: routeParams.userEmail,
      });
    } else if (authProviderId) {
      navigation.navigate("ServiceProviderDashboard", {
        userId: authProviderId,
        userName: user?.name || "User",
        userEmail: user?.email || "N/A",
      });
    } else {
      navigation.navigate("ServiceProviderDashboard");
    }
  };

  // Sort equipment: Pending fees first
  const sortedList = [...equipmentList].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  return (
    <ImageBackground
      source={require("../../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Header with back button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Icon name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.header}>My Equipment</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Show count */}
        {!loading && sortedList.length > 0 && (
          <Text style={styles.countText}>
            Total Items: {sortedList.length}
          </Text>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>Loading equipment...</Text>
          </View>
        ) : sortedList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No equipment found</Text>
            <Text style={styles.emptySubtext}>Add new equipment to get started</Text>
            <TouchableOpacity onPress={fetchEquipment} style={styles.retryBtn}>
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <FlatList
          data={sortedList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E88E5"]}
            />
          }
        />

        {/* ➕ ADD EQUIPMENT BUTTON */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate("AddEquipment", {
              providerId,
            })
          }
        >
          <Text style={styles.addText}>+ Add Equipment</Text>
        </TouchableOpacity>

        {/* Fullscreen Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

  headerContainer: {
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
    textAlign: "center",
    flex: 1,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },

  countText: {
    textAlign: "center",
    color: "#5C768D",
    marginBottom: 10,
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
  },

  // Updated Card Styles
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 22,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    padding: 12,
    alignItems: 'center', // FIXED ALIGNMENT: Centers image and text block vertically
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: "#F0F4F8",
    marginRight: 16,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  outOfStockBadge: {
    backgroundColor: '#FFEBEE',
  },
  outOfStockText: {
    color: '#D32F2F',
  },
  pendingStockBadge: {
    backgroundColor: '#FFF8E1',
  },
  pendingStockText: {
    color: '#F57C00',
  },

  description: {
    fontSize: 13,
    color: "#5C768D",
    marginBottom: 6,
    lineHeight: 18,
  },

  price: {
    fontWeight: "700",
    fontSize: 15,
    color: "#388E3C",
    marginBottom: 8,
  },
  perDay: {
    fontSize: 12,
    color: "#90A4AE",
    fontWeight: 'normal',
  },

  pendingBadge: {
    marginBottom: 8,
  },
  pendingText: {
    color: "#F57C00",
    fontSize: 12,
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  btnText: {
    color: "#1E88E5",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF5350",
  },
  deleteText: {
    color: "#EF5350",
    fontSize: 12,
    fontWeight: "600",
  },
  payFeeBtn: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#FFC107",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  payFeeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 120,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 16,
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: "#5C768D",
    marginBottom: 10,
    fontWeight: "600",
  },
  emptySubtext: {
    textAlign: "center",
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  addBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#1E88E5",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    color: "#5C768D",
    fontWeight: "500",
  },
  // Fullscreen Image Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbfaf8ff',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#F57C00',
    fontSize: 13,
  },
  ratingCount: {
    color: '#FFB74D',
    fontWeight: '500',
    fontSize: 12,
  },
});