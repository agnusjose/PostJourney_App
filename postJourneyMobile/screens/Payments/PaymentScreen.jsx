import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ImageBackground,
  StatusBar
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const BASE_URL = "http://172.16.230.150:5000";

  const {
    type,
    amount,
    bookingId,
    bookingIds,
    equipmentId,
    providerId,
    bookingData
  } = route.params || {};

  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentTitle = type === 'booking' ? 'Booking Payment' : 'Listing Fee Payment';
  const description = type === 'booking'
    ? 'Complete payment to confirm your booking'
    : 'Pay 5% listing fee to list your equipment';

  const paymentOptions = type === 'listing_fee'
    ? [
      {
        id: "upi",
        name: "UPI",
        icon: "phone-portrait-outline",
        color: "#4CAF50",
        subtypes: [
          { id: "google_pay", name: "Google Pay", icon: "logo-google" },
          { id: "phonepe", name: "PhonePe", icon: "phone-portrait-outline" },
          { id: "paytm", name: "Paytm", icon: "wallet-outline" },
          { id: "other_upi", name: "Other UPI", icon: "qr-code-outline" }
        ]
      },
      {
        id: "card",
        name: "Debit/Credit Card",
        icon: "card-outline",
        color: "#2196F3",
        subtypes: [
          { id: "visa", name: "Visa", icon: "card-outline" },
          { id: "mastercard", name: "MasterCard", icon: "card-outline" },
          { id: "amex", name: "American Express", icon: "card-outline" },
          { id: "razorpay", name: "Razorpay Card", icon: "card-outline" }
        ]
      },
      {
        id: "netbanking",
        name: "Net Banking",
        icon: "business-outline",
        color: "#9C27B0",
        subtypes: [
          { id: "hdfc", name: "HDFC Bank", icon: "business-outline" },
          { id: "icici", name: "ICICI Bank", icon: "business-outline" },
          { id: "sbi", name: "SBI", icon: "business-outline" }
        ]
      }
    ]
    : [
      {
        id: "upi",
        name: "UPI",
        icon: "phone-portrait-outline",
        color: "#4CAF50",
        subtypes: [
          { id: "google_pay", name: "Google Pay", icon: "logo-google" },
          { id: "phonepe", name: "PhonePe", icon: "phone-portrait-outline" },
          { id: "paytm", name: "Paytm", icon: "wallet-outline" },
          { id: "other_upi", name: "Other UPI", icon: "qr-code-outline" }
        ]
      },
      {
        id: "card",
        name: "Debit/Credit Card",
        icon: "card-outline",
        color: "#2196F3",
        subtypes: [
          { id: "visa", name: "Visa", icon: "card-outline" },
          { id: "mastercard", name: "MasterCard", icon: "card-outline" },
          { id: "amex", name: "American Express", icon: "card-outline" },
          { id: "razorpay", name: "Razorpay Card", icon: "card-outline" }
        ]
      },
      {
        id: "netbanking",
        name: "Net Banking",
        icon: "business-outline",
        color: "#9C27B0",
        subtypes: [
          { id: "hdfc", name: "HDFC Bank", icon: "business-outline" },
          { id: "icici", name: "ICICI Bank", icon: "business-outline" },
          { id: "sbi", name: "SBI", icon: "business-outline" }
        ]
      },

      {
        id: "cod",
        name: "Cash on Delivery",
        icon: "cash-outline",
        color: "#795548",
        subtypes: []
      }
    ];

  const prefillTestCard = (cardType) => {
    const testCards = {
      visa: { number: "4242 4242 4242 4242", expiry: "12/30", cvv: "123", name: "User" },
      mastercard: { number: "5555 5555 5555 4444", expiry: "12/30", cvv: "123", name: "User" },
      amex: { number: "3782 8224 1000 1112", expiry: "12/30", cvv: "1234", name: "User" }
    };
    setCardDetails(testCards[cardType] || testCards.visa);
  };

  const generateMockUPI = () => {
    const upiHandles = ['@okicici', '@axisbank', '@ybl', '@paytm'];
    const handle = upiHandles[Math.floor(Math.random() * upiHandles.length)];
    const mockUPI = `${user?.phoneNumber?.slice(-10) || '9876543210'}${handle}`;
    setUpiId(mockUPI);
    return mockUPI;
  };

  const markEquipmentAsListed = async (equipId, transactionId) => {
    try {
      const response = await fetch(`${BASE_URL}/equipment/${equipId}/mark-listed`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, paymentMethod: selectedMethod }),
      });
      const result = await response.json();
      if (!result.success) console.warn("Failed to mark listed:", result.message);
    } catch (error) {
      console.error("Error marking listed:", error);
    }
  };

  const renderSubtypes = (method) => {
    if (selectedMethod !== method.id || !method.subtypes || method.subtypes.length === 0) return null;

    return (
      <View style={styles.subtypesContainer}>
        <Text style={styles.subtypeLabel}>Select Option:</Text>
        <View style={styles.subtypeButtons}>
          {method.subtypes.map((subtype) => (
            <TouchableOpacity
              key={subtype.id}
              style={[styles.subtypeButton, selectedSubtype === subtype.id && styles.subtypeButtonActive]}
              onPress={() => {
                setSelectedSubtype(subtype.id);
                if (method.id === 'card' && subtype.id !== 'razorpay') prefillTestCard(subtype.id);
                if (method.id === 'upi' && subtype.id === 'other_upi') generateMockUPI();
              }}
            >
              <Ionicons name={subtype.icon} size={18} color={selectedSubtype === subtype.id ? "#1E88E5" : "#666"} />
              <Text style={[styles.subtypeButtonText, selectedSubtype === subtype.id && styles.subtypeButtonTextActive]}>
                {subtype.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPaymentDetailsInputs = () => {
    if (selectedMethod === 'upi' && selectedSubtype === 'other_upi') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter UPI ID:</Text>
          <TextInput
            style={styles.inputField}
            placeholder="example@upi"
            placeholderTextColor="#90A4AE"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.inputNote}>Example: 9876543210@okicici</Text>
          <TouchableOpacity style={styles.testDataButton} onPress={generateMockUPI}>
            <Text style={styles.testDataButtonText}>Generate Test UPI ID</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedMethod === 'card' && selectedSubtype !== 'razorpay') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Card Details:</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Card Number"
            placeholderTextColor="#90A4AE"
            value={cardDetails.number}
            onChangeText={(text) => setCardDetails({ ...cardDetails, number: text })}
            keyboardType="numeric"
            maxLength={19}
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.inputField, { flex: 1, marginRight: 8 }]}
              placeholder="MM/YY"
              placeholderTextColor="#90A4AE"
              value={cardDetails.expiry}
              onChangeText={(text) => setCardDetails({ ...cardDetails, expiry: text })}
              maxLength={5}
            />
            <TextInput
              style={[styles.inputField, { flex: 1, marginLeft: 8 }]}
              placeholder="CVV"
              placeholderTextColor="#90A4AE"
              value={cardDetails.cvv}
              onChangeText={(text) => setCardDetails({ ...cardDetails, cvv: text })}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <TextInput
            style={styles.inputField}
            placeholder="Cardholder Name"
            placeholderTextColor="#90A4AE"
            value={cardDetails.name}
            onChangeText={(text) => setCardDetails({ ...cardDetails, name: text })}
          />
          <TouchableOpacity style={styles.testDataButton} onPress={() => prefillTestCard(selectedSubtype || 'visa')}>
            <Text style={styles.testDataButtonText}>Fill Test Card Data</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedMethod === 'netbanking') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Net Banking Details:</Text>
          <Text style={styles.infoText}>You will be redirected to your bank's secure portal for payment.</Text>
          {selectedSubtype && (
            <Text style={styles.bankSelected}>
              Selected Bank: {paymentOptions.find(m => m.id === 'netbanking')?.subtypes?.find(s => s.id === selectedSubtype)?.name || 'Bank'}
            </Text>
          )}
        </View>
      );
    }



    if (selectedMethod === 'cod') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Cash on Delivery:</Text>
          <Text style={styles.infoText}>Pay in cash when the equipment is delivered to you.</Text>
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="#E65100" />
            <Text style={styles.warningText}>Note: A small convenience fee may apply.</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const processPayment = async () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }
    const selectedMethodObj = paymentOptions.find(m => m.id === selectedMethod);
    if (selectedMethodObj?.subtypes && selectedMethodObj.subtypes.length > 0 && !selectedSubtype) {
      Alert.alert("Error", `Please select a ${selectedMethodObj.name} option`);
      return;
    }
    if (selectedMethod === 'upi' && selectedSubtype === 'other_upi' && !upiId.trim()) {
      Alert.alert("Error", "Please enter your UPI ID");
      return;
    }
    if (selectedMethod === 'card' && selectedSubtype !== 'razorpay') {
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16) return Alert.alert("Error", "Valid card number required");
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) return Alert.alert("Error", "Valid expiry required (MM/YY)");
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) return Alert.alert("Error", "Valid CVV required");
      if (!cardDetails.name || cardDetails.name.trim() === '') return Alert.alert("Error", "Cardholder name required");
    }

    if ((selectedMethod === 'cod' || bookingData?.paymentMethod === 'cod') && type === 'booking') {
      navigation.navigate("CashOnDeliverySuccess", {
        bookingId,
        bookingIds: bookingIds || [bookingId],  // FIX: Pass all booking IDs for multi-item orders
        amount,
        bookingData: { ...bookingData, paymentMethod: 'cod' }
      });
      return;
    }

    setIsProcessing(true);

    try {
      let paymentDetails = {};
      if (selectedMethod === 'upi') {
        paymentDetails = selectedSubtype === 'other_upi' ? { upiId: upiId.trim() } : { upiApp: selectedSubtype };
      } else if (selectedMethod === 'card') {
        paymentDetails = { ...cardDetails, number: cardDetails.number.replace(/\s/g, '') };
      } else if (selectedMethod === 'netbanking') {
        paymentDetails = { bank: selectedSubtype };
      }

      let endpoint = "", payload = {};

      if (type === 'booking') {
        endpoint = "/payment/process";
        payload = {
          bookingId,
          bookingIds: bookingIds || [bookingId],
          paymentMethod: selectedMethod,
          simulate: "success",
          paymentDetails
        };
      } else if (type === 'listing_fee') {
        endpoint = "/payment/listing-fee";
        payload = {
          equipmentId,
          providerId: providerId || user?.userId,
          paymentMethod: selectedMethod,
          simulate: "success",
          paymentDetails
        };
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setIsProcessing(false);

      if (result.success) {
        if (type === 'listing_fee') await markEquipmentAsListed(equipmentId, result.transaction?.transactionId);
        navigation.navigate("PaymentSuccess", {
          transaction: result.transaction,
          type,
          amount,
          equipmentId,
          bookingId,
          patientId: user?.userId,
          providerId: user?.userId
        });
      } else {
        navigation.navigate("PaymentFailed", {
          error: result.message,
          type,
          amount,
          onRetry: () => navigation.goBack()
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Processing Payment...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{paymentTitle}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Payable</Text>
            <Text style={styles.amountValue}>₹{amount}</Text>
            <View style={styles.divider} />
            <Text style={styles.amountDescription}>{description}</Text>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            {paymentOptions.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    selectedMethod === method.id && styles.methodButtonActive
                  ]}
                  onPress={() => {
                    setSelectedMethod(method.id);
                    setSelectedSubtype("");
                    if (method.id === 'upi') generateMockUPI();
                  }}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                    <Ionicons name={method.icon} size={22} color="#FFF" />
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <View style={[styles.radioCircle, selectedMethod === method.id && styles.radioCircleActive]}>
                    {selectedMethod === method.id && <View style={styles.selectedRb} />}
                  </View>
                </TouchableOpacity>

                {renderSubtypes(method)}
              </View>
            ))}
          </View>

          {/* Payment Inputs */}
          {renderPaymentDetailsInputs()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedMethod ||
                (selectedMethod !== 'cod' && paymentOptions.find(m => m.id === selectedMethod)?.subtypes?.length > 0 && !selectedSubtype) ||
                (selectedMethod === 'upi' && selectedSubtype === 'other_upi' && !upiId.trim())
              ) && styles.payButtonDisabled
            ]}
            onPress={processPayment}
            disabled={!selectedMethod || isProcessing}
          >
            <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

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

  content: { flex: 1, paddingHorizontal: 22 },

  amountCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E3F2FD',
  },
  amountLabel: { fontSize: 14, color: "#5C768D", fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1 },
  amountValue: { fontSize: 36, fontWeight: "800", color: "#1E88E5", marginVertical: 8, letterSpacing: -1 },
  divider: { width: '100%', height: 1, backgroundColor: '#E1E8ED', marginVertical: 12 },
  amountDescription: { fontSize: 14, color: "#5C768D", textAlign: "center", paddingHorizontal: 20 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2C3E50", marginBottom: 16 },

  methodCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  methodButtonActive: { backgroundColor: "#F0F9FF" },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16,
  },
  methodName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#2C3E50" },

  radioCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#CFD8DC",
    alignItems: "center", justifyContent: "center",
  },
  radioCircleActive: { borderColor: "#1E88E5" },
  selectedRb: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#1E88E5" },

  subtypesContainer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, backgroundColor: "#FAFAFA", borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  subtypeLabel: { fontSize: 13, color: "#90A4AE", marginBottom: 10, fontWeight: '600' },
  subtypeButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subtypeButton: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0E0E0",
  },
  subtypeButtonActive: { borderColor: "#1E88E5", backgroundColor: "#E3F2FD" },
  subtypeButtonText: { fontSize: 13, color: "#666", marginLeft: 6, fontWeight: '500' },
  subtypeButtonTextActive: { color: "#1E88E5", fontWeight: '700' },

  inputContainer: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 24,
    elevation: 4, shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
  },
  inputLabel: { fontSize: 16, fontWeight: "700", color: "#2C3E50", marginBottom: 12 },
  inputField: {
    backgroundColor: "#F8FAFC", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#CFD8DC",
    fontSize: 15, color: "#2C3E50", marginBottom: 12,
  },
  inputNote: { fontSize: 12, color: "#90A4AE", marginBottom: 12 },
  rowInputs: { flexDirection: "row" },

  testDataButton: { alignItems: 'center', padding: 10 },
  testDataButtonText: { color: '#1E88E5', fontWeight: '600', fontSize: 13 },

  infoText: { fontSize: 14, color: "#5C768D", lineHeight: 20 },
  warningContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, backgroundColor: '#FFF3E0', borderRadius: 8, gap: 8 },
  warningText: { color: '#EF6C00', fontSize: 13, fontWeight: '600' },
  bankSelected: { marginTop: 10, fontSize: 14, fontWeight: '600', color: '#1E88E5' },

  footer: {
    padding: 22, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E1E8ED',
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 10,
  },
  payButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#1E88E5", paddingVertical: 18, borderRadius: 15, gap: 10,
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  payButtonDisabled: { backgroundColor: "#B0BEC5", shadowOpacity: 0 },
  payButtonText: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: 16, color: "#5C768D", fontWeight: '600' },
});

export default PaymentScreen;