import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function EditEquipment({ route, navigation }) {
  const { equipment } = route.params;
  const BASE_URL = "http://192.168.137.1:5000";

  const [form, setForm] = useState({
    equipmentName: equipment.equipmentName || "",
    description: equipment.description || "",
    pricePerDay: equipment.pricePerDay?.toString() || "",
    stock: equipment.stock?.toString() || "1",
    category: equipment.category || "other",
  });

  const [image, setImage] = useState(equipment.imageUrl ? { uri: equipment.imageUrl } : null);
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
      formData.append("category", form.category);

      // Only append image if new one is selected
      if (image && image.uri !== equipment.imageUrl) {
        formData.append("image", {
          uri: image.uri,
          type: "image/jpeg",
          name: `equipment_${Date.now()}.jpg`,
        });
      }

      console.log("📤 Updating equipment:", equipment._id);

      const response = await axios.put(
        `${BASE_URL}/equipment/update/${equipment._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Equipment updated successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.data.message || "Failed to update equipment");
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
          <Text style={styles.headerTitle}>Edit Equipment</Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

            {/* Equipment Image */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="camera-outline" size={32} color="#1E88E5" />
                  </View>
                  <Text style={styles.placeholderText}>Change Photo</Text>
                  <Text style={styles.placeholderSubtext}>Tap to select image</Text>
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
                  placeholder="e.g., Wheelchair, Oxygen Concentrator"
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
                  placeholder="Describe the equipment features, condition, specifications..."
                  placeholderTextColor="#90A4AE"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Price & Stock */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
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

              {/* Category */}
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Update Equipment</Text>
              )}
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert(
                  "Delete Equipment",
                  "Are you sure you want to delete this equipment?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          const response = await axios.delete(
                            `${BASE_URL}/equipment/delete/${equipment._id}`
                          );
                          if (response.data.success) {
                            Alert.alert("Success", "Equipment deleted successfully");
                            navigation.goBack();
                          }
                        } catch (error) {
                          Alert.alert("Error", "Failed to delete equipment");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.deleteText}>Delete Equipment</Text>
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
    marginBottom: 12,
    shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: "#94a3b8" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  deleteBtn: {
    flexDirection: 'row',
    backgroundColor: "#EF5350",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: 'center',
    shadowColor: "#EF5350", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  deleteText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});