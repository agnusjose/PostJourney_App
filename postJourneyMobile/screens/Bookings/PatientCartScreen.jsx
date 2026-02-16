// PatientCartScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

export default function PatientCartScreen() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    validateSelectedStock,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    getSelectedItems,
    getSelectedTotal,
    getSelectedCount,
    loading: cartLoading
  } = useCart();

  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [checkingStock, setCheckingStock] = useState({});
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  const BASE_URL = "http://172.16.230.150:5000";

  // Update allSelected state
  useEffect(() => {
    if (cart.length > 0) {
      const allSelected = cart.every(item => item.selected);
      setAllSelected(allSelected);
    } else {
      setAllSelected(false);
    }
  }, [cart]);

  // Check for out of stock items
  useEffect(() => {
    const checkStock = async () => {
      if (cart.length === 0) {
        setOutOfStockItems([]);
        return;
      }

      const stockValidation = await validateSelectedStock();
      if (stockValidation && Array.isArray(stockValidation)) {
        const unavailableItems = stockValidation.filter(item => !item.available);
        setOutOfStockItems(unavailableItems.map(item => item.itemId));
      } else {
        // Handle case where stockValidation is undefined or failed
        console.warn("Stock validation returned unexpected result");
      }
    };

    checkStock();
  }, [cart]);

  const handleToggleSelectAll = () => {
    if (allSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };

  const handleQuantityChange = async (itemId, change) => {
    const item = cart.find(item => item._id === itemId);
    if (!item) return;

    const currentQty = item.quantity || 1;
    const newQty = Math.max(1, currentQty + change);

    if (newQty === currentQty) return;

    setCheckingStock(prev => ({ ...prev, [itemId]: true }));

    try {
      const success = await updateQuantity(itemId, newQty);
      if (!success) {
        Alert.alert("Error", "Failed to update quantity");
      }
    } catch (error) {
      Alert.alert("Stock Limit", error.message);
    } finally {
      setCheckingStock(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromCart(itemId)
        }
      ]
    );
  };

  const handleCheckout = async () => {
    const selectedItems = getSelectedItems();

    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select items to checkout");
      return;
    }

    // Check for out of stock items
    const selectedOutOfStock = selectedItems.filter(item =>
      outOfStockItems.includes(item._id)
    );

    if (selectedOutOfStock.length > 0) {
      const itemNames = selectedOutOfStock.map(item => `• ${item.equipmentName}`).join('\n');
      Alert.alert(
        "Stock Issue",
        `Some selected items are no longer available:\n\n${itemNames}\n\nPlease remove them before checkout.`,
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    try {
      // Validate stock with fresh data
      const stockValidation = await validateSelectedStock();
      const unavailableItems = stockValidation.filter(item => !item.available);

      if (unavailableItems.length > 0) {
        const itemNames = unavailableItems.map(item =>
          `• ${item.itemName}: Only ${item.currentStock} available, requested ${item.requested}`
        ).join('\n');

        Alert.alert(
          "Stock Issue",
          `Some items are no longer available:\n\n${itemNames}\n\nPlease update your cart.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Navigate to checkout with selected items
      navigation.navigate("CheckoutScreen", {
        selectedCartItems: selectedItems
      });
    } catch (error) {
      Alert.alert("Error", "Failed to validate cart items");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate("PatientEquipmentList");
  };

  const renderItem = ({ item }) => {
    const quantity = item.quantity || 1;
    const currentStock = item.currentStock || 0;
    const imageUrl = item.imageUrl
      ? `${BASE_URL}${item.imageUrl}`
      : "https://via.placeholder.com/100";

    const isCheckingStock = checkingStock[item._id];
    const isOutOfStock = currentStock < quantity;
    const canIncrease = currentStock > quantity;

    return (
      <View style={[styles.cartItem, isOutOfStock && styles.outOfStockItem]}>
        {/* Selection checkbox */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleItemSelection(item._id)}
        >
          {item.selected ? (
            <Ionicons name="checkbox" size={24} color="#1E88E5" />
          ) : (
            <Ionicons name="square-outline" size={24} color="#94a3b8" />
          )}
        </TouchableOpacity>

        <Image source={{ uri: imageUrl }} style={styles.itemImage} />

        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, isOutOfStock && styles.outOfStockText]}>
            {item.equipmentName}
          </Text>
          <Text style={styles.itemProvider}>Provider: {item.providerName}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.itemPrice, isOutOfStock && styles.outOfStockText]}>
              ₹ {item.pricePerDay} / day
            </Text>
            <Text style={[styles.itemTotal, isOutOfStock && styles.outOfStockText]}>
              ₹ {item.pricePerDay * quantity} total/day
            </Text>
          </View>

          <View style={styles.stockRow}>
            <Text style={[
              styles.stockText,
              isOutOfStock && styles.outOfStockText
            ]}>
              {isOutOfStock
                ? `Currently unavailable (${currentStock} in stock)`
                : `Available: ${currentStock} units`
              }
            </Text>
          </View>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.qtyBtn, (quantity <= 1 || isOutOfStock || isCheckingStock) && styles.disabledQtyBtn]}
              onPress={() => handleQuantityChange(item._id, -1)}
              disabled={quantity <= 1 || isOutOfStock || isCheckingStock}
            >
              <Ionicons name="remove" size={20} color={
                quantity <= 1 || isOutOfStock || isCheckingStock ? "#CFD8DC" : "#2C3E50"
              } />
            </TouchableOpacity>

            {isCheckingStock ? (
              <ActivityIndicator size="small" color="#1E88E5" style={styles.qtyLoader} />
            ) : (
              <Text style={[
                styles.qtyText,
                isOutOfStock && styles.outOfStockText
              ]}>
                {quantity}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.qtyBtn, (!canIncrease || isOutOfStock || isCheckingStock) && styles.disabledQtyBtn]}
              onPress={() => handleQuantityChange(item._id, 1)}
              disabled={!canIncrease || isOutOfStock || isCheckingStock}
            >
              <Ionicons name="add" size={20} color={
                !canIncrease || isOutOfStock || isCheckingStock ? "#CFD8DC" : "#2C3E50"
              } />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveItem(item._id)}
              disabled={isCheckingStock}
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const selectedItems = getSelectedItems();
  const selectedTotal = getSelectedTotal();
  const selectedCount = getSelectedCount();
  const hasSelectedItems = selectedItems.length > 0;
  const hasOutOfStockSelected = selectedItems.some(item =>
    outOfStockItems.includes(item._id)
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("PatientEquipmentList")}
          >
            <Ionicons name="add" size={24} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="cart-outline" size={60} color="#CFD8DC" />
            </View>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Add equipment to get started
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={handleContinueShopping}
            >
              <Text style={styles.shopBtnText}>Browse Equipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Selection Header */}
            <View style={styles.selectionHeader}>
              <TouchableOpacity
                style={styles.selectAllBtn}
                onPress={handleToggleSelectAll}
              >
                {allSelected ? (
                  <Ionicons name="checkbox" size={24} color="#1E88E5" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#94a3b8" />
                )}
                <Text style={styles.selectAllText}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selectedCount}>
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </Text>
            </View>

            {hasOutOfStockSelected && (
              <View style={styles.outOfStockBanner}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.outOfStockBannerText}>
                  Some selected items are unavailable
                </Text>
              </View>
            )}

            <FlatList
              data={cart}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.cartList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({selectedCount} items)</Text>
                <Text style={styles.summaryValue}>₹ {selectedTotal.toFixed(2)}/day</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Free</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount/Day</Text>
                <Text style={styles.totalAmount}>₹ {selectedTotal.toFixed(2)}</Text>
              </View>

              {hasOutOfStockSelected && (
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={18} color="#FFD166" />
                  <Text style={styles.warningText}>
                    Remove unavailable items before checkout
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  (loading || !hasSelectedItems || hasOutOfStockSelected) && styles.disabledBtn
                ]}
                onPress={handleCheckout}
                disabled={loading || !hasSelectedItems || hasOutOfStockSelected}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.checkoutText}>
                      {!hasSelectedItems ? 'Select Items to Checkout' :
                        hasOutOfStockSelected ? 'Fix Items First' : 'Proceed to Checkout'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinueShopping}
                disabled={loading}
              >
                <Text style={styles.continueText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(245, 250, 255, 0.75)' },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  addButton: {
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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: "#2C3E50",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#5C768D",
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  shopBtn: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 30,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cartList: {
    padding: 22,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  outOfStockItem: {
    backgroundColor: "#FFF8F8",
    borderColor: "#FECACA",
  },

  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: "#F0F4F8",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  outOfStockText: {
    color: "#ef4444",
  },
  itemProvider: {
    fontSize: 12,
    color: "#5C768D",
    marginBottom: 8,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C3E50",
  },
  itemTotal: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  stockRow: {
    marginBottom: 12,
  },
  stockText: {
    fontSize: 12,
    color: "#94a3b8",
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F4F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFD8DC",
  },
  disabledQtyBtn: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.5,
  },
  qtyLoader: {
    marginHorizontal: 16,
    minWidth: 30,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
    color: "#2C3E50",
  },
  removeBtn: {
    marginLeft: "auto",
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },

  summaryContainer: {
    backgroundColor: "#fff",
    padding: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F4F8",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16a34a",
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFECB3",
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#FF8F00",
    flex: 1,
    fontWeight: "500",
  },

  checkoutBtn: {
    flexDirection: "row",
    backgroundColor: "#1E88E5",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: "#CFD8DC",
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  continueBtn: {
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E88E5",
  },
  continueText: {
    color: "#1E88E5",
    fontSize: 16,
    fontWeight: "700",
  },

  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: "#5C768D",
    fontWeight: "600",
  },
  selectedCount: {
    fontSize: 14,
    color: "#1E88E5",
    fontWeight: "600",
  },
  checkbox: {
    marginRight: 10,
  },

  outOfStockBanner: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
    marginHorizontal: 22,
    borderRadius: 12,
    marginBottom: 10,
  },
  outOfStockBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});