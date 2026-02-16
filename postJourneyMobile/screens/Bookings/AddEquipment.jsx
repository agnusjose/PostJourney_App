import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function AddEquipment({ route, navigation }) {
  const { providerId } = route.params;
  const BASE_URL = "http://192.168.137.1:5000";

  const { user } = useAuth();

  const [form, setForm] = useState({
    equipmentName: "",
    description: "",
    pricePerDay: "",
    stock: "1",
    category: "other",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { label: "Mobility Aids", value: "mobility", icon: "body-outline" },
    { label: "Respiratory", value: "respiratory", icon: "fitness-outline" },
    { label: "Daily Living", value: "daily-living", icon: "home-outline" },
    { label: "Therapeutic", value: "therapeutic", icon: "medkit-outline" },
    { label: "Monitoring", value: "monitoring", icon: "pulse-outline" },
    { label: "Beds", value: "beds", icon: "bed-outline" },
    { label: "Other", value: "other", icon: "ellipsis-horizontal-outline" },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.equipmentName.trim()) {
      Alert.alert("Error", "Please enter equipment name");
      return;
    }
    if (!form.description.trim()) {
      Alert.alert("Error", "Please enter description");
      return;
    }
    if (!form.pricePerDay || parseFloat(form.pricePerDay) <= 0) {
      Alert.alert("Error", "Please enter valid price per day");
      return;
    }
    if (!form.stock || parseInt(form.stock) < 1) {
      Alert.alert("Error", "Please enter valid stock quantity");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("equipmentName", form.equipmentName);
      formData.append("description", form.description);
      formData.append("pricePerDay", form.pricePerDay);
      formData.append("stock", form.stock);
      formData.append("providerId", user?.userId || providerId);
      formData.append("providerName", user?.name || "Provider");
      formData.append("category", form.category);

      if (image) {
        formData.append("image", {
          uri: image.uri,
          type: "image/jpeg",
          name: `equipment_${Date.now()}.jpg`,
        });
      }

      const response = await axios.post(`${BASE_URL}/equipment/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        if (response.data.requiresPayment) {
          Alert.alert(
            "Equipment Created",
            "Your equipment has been created. Please pay the 5% listing fee to list it for booking.",
            [
              {
                text: "Pay Now",
                onPress: () => {
                  navigation.navigate("PaymentScreen", {
                    type: "listing_fee",
                    amount: response.data.listingFee,
                    equipmentId: response.data.equipmentId,
                    providerId: user?.userId || providerId,
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert("Success", "Equipment added successfully");
          navigation.goBack();
        }
      } else {
        Alert.alert("Error", response.data.message || "Failed to add equipment");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to connect to server");
    } finally {
      setLoading(false);
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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Equipment</Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="camera-outline" size={32} color="#1E88E5" />
                  </View>
                  <Text style={styles.placeholderText}>Add Photo</Text>
                  <Text style={styles.placeholderSubtext}>Tap to select from gallery</Text>
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.formCard}>
              {/* Equipment Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipment Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Wheelchair, Oxygen Concentrator"
                  placeholderTextColor="#90A4AE"
                  value={form.equipmentName}
                  onChangeText={(text) => setForm({ ...form, equipmentName: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe features, condition, specifications..."
                  placeholderTextColor="#90A4AE"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Price & Stock Row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Price / Day (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#90A4AE"
                    value={form.pricePerDay}
                    onChangeText={(text) => setForm({ ...form, pricePerDay: text })}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Stock Qty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#90A4AE"
                    value={form.stock}
                    onChangeText={(text) => setForm({ ...form, stock: text })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryBtn,
                        form.category === cat.value && styles.categoryBtnActive,
                      ]}
                      onPress={() => setForm({ ...form, category: cat.value })}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={18}
                        color={form.category === cat.value ? "#fff" : "#5C768D"}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          form.category === cat.value && styles.categoryTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Listing Fee Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" size={20} color="#0277BD" style={{ marginRight: 6 }} />
                <Text style={styles.infoTitle}>Listing Fee Information</Text>
              </View>
              <Text style={styles.infoText}>• A 5% listing fee applies based on daily price.</Text>
              <Text style={styles.infoText}>• Equipment listed after payment confirmation.</Text>
              <View style={styles.divider} />
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Estimated Fee:</Text>
                <Text style={styles.feeValue}>₹{(parseFloat(form.pricePerDay || 0) * 0.05).toFixed(2)}</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Add Equipment</Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
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

  content: { paddingHorizontal: 22 },

  imagePicker: {
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderStyle: "dashed",
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: { width: "100%", height: "100%" },
  placeholderContainer: { alignItems: "center" },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  placeholderText: { fontSize: 16, color: "#2C3E50", fontWeight: "700" },
  placeholderSubtext: { fontSize: 12, color: "#5C768D", marginTop: 4 },

  editIconContainer: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20,
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#2C3E50", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    borderWidth: 1, borderColor: '#E1E8ED',
    marginBottom: 20,
  },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#2C3E50" },
  input: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFD8DC",
    fontSize: 15,
    color: "#2C3E50",
  },
  textArea: { minHeight: 120, paddingTop: 16 },

  row: { flexDirection: "row", justifyContent: "space-between" },

  categoryContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E8ED",
  },
  categoryBtnActive: { backgroundColor: "#2C3E50", borderColor: "#2C3E50" },
  categoryText: { fontSize: 13, color: "#5C768D", fontWeight: "600" },
  categoryTextActive: { color: "#fff" },

  submitBtn: {
    backgroundColor: "#1E88E5",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: "#90A4AE" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  infoCard: {
    backgroundColor: "#E1F5FE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#0277BD" },
  infoText: { fontSize: 13, color: "#01579B", marginBottom: 4, paddingLeft: 6 },
  divider: { height: 1, backgroundColor: "#B3E5FC", marginVertical: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 14, fontWeight: "600", color: "#0277BD" },
  feeValue: { fontSize: 16, fontWeight: "800", color: "#01579B" },
});