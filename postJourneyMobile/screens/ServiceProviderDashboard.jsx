import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";

function ServiceProviderDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ADD PRODUCT STATE */
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", imageUrl: "" });

  /* EDIT PRODUCT STATE */
  const [editing, setEditing] = useState(null);
  const [editProduct, setEditProduct] = useState({ name: "", price: "", stock: "", imageUrl: "" });


  const fetchStores = async () => {
    try {
      console.log("📡 Fetching equipment stores...");
      const res = await axios.get("http://192.168.146.170:5000/equipment");
      console.log("✅ Equipment stores fetched:", res.data.data);
      setStores(res.data.data || []);
    } catch (error) {
      console.warn("❌ Failed to load equipment stores", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  /* ADD PRODUCT */
  const handleChange = (name, value) => {
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = async (storeId) => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`http://192.168.146.170:5000/equipment/${storeId}/add-equipment`, {
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        imageUrl: newProduct.imageUrl,
      });

      alert("Product added successfully");
      setNewProduct({ name: "", price: "", stock: "", imageUrl: "" });
      fetchStores();
    } catch (err) {
      console.warn(err);
      alert("Failed to add product");
    }
  };

  /* EDIT PRODUCT */
  const startEdit = (storeId, index, item) => {
    setEditing({ storeId, index });
    setEditProduct({ name: item.name, price: `${item.price}`, stock: `${item.stock}`, imageUrl: item.imageUrl || "" });
  };

  const handleEditChange = (name, value) => {
    setEditProduct({ ...editProduct, [name]: value });
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `http://192.168.146.170:5000/equipment/${editing.storeId}/update-equipment/${editing.index}`,
        {
          name: editProduct.name,
          price: Number(editProduct.price),
          stock: Number(editProduct.stock),
          imageUrl: editProduct.imageUrl,
        }
      );

      alert("Product updated successfully");
      setEditing(null);
      fetchStores();
    } catch (err) {
      console.warn(err);
      alert("Failed to update product");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Service Provider Dashboard</Text>

      {stores.map((store) => (
        <View key={store._id} style={styles.storeCard}>
          <Text style={styles.storeTitle}>{store.storeName} ({store.location})</Text>

          {/* PRODUCTS */}
          <View style={styles.productsList}>
            {store.equipments.map((item, index) => (
              <View key={index} style={styles.productRow}>
                <Image source={{ uri: item.imageUrl || "https://via.placeholder.com/80" }} style={styles.productImage} />

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productMeta}>₹{item.price} • Stock: {item.stock}</Text>
                </View>

                <TouchableOpacity onPress={() => startEdit(store._id, index, item)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ADD PRODUCT */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add New Product</Text>

            <View style={styles.inputsGrid}>
              <TextInput placeholder="Product name" value={newProduct.name} onChangeText={(t) => handleChange("name", t)} style={styles.input} />
              <TextInput placeholder="Price" value={newProduct.price} onChangeText={(t) => handleChange("price", t)} style={styles.input} keyboardType="numeric" />
              <TextInput placeholder="Stock" value={newProduct.stock} onChangeText={(t) => handleChange("stock", t)} style={styles.input} keyboardType="numeric" />
              <TextInput placeholder="Image URL" value={newProduct.imageUrl} onChangeText={(t) => handleChange("imageUrl", t)} style={styles.input} />
            </View>

            <TouchableOpacity onPress={() => handleAddProduct(store._id)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* EDIT MODAL */}
      <Modal visible={!!editing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <TextInput value={editProduct.name} onChangeText={(t) => handleEditChange("name", t)} style={styles.input} />
            <TextInput value={editProduct.price} onChangeText={(t) => handleEditChange("price", t)} style={styles.input} keyboardType="numeric" />
            <TextInput value={editProduct.stock} onChangeText={(t) => handleEditChange("stock", t)} style={styles.input} keyboardType="numeric" />
            <TextInput value={editProduct.imageUrl} onChangeText={(t) => handleEditChange("imageUrl", t)} style={styles.input} />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditing(null)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.modalButton, styles.saveButton]}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  storeCard: { marginBottom: 16, backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  storeTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  productsList: { marginBottom: 8 },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  productImage: { width: 64, height: 64, borderRadius: 8, marginRight: 8 },
  productInfo: { flex: 1 },
  productName: { fontWeight: "600" },
  productMeta: { color: "#555" },
  editButton: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#f59e0b", borderRadius: 6 },
  editButtonText: { color: "#fff" },
  addSection: { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  sectionTitle: { fontWeight: "600", marginBottom: 8 },
  inputsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 6, minWidth: 140, marginBottom: 8, flex: 1 },
  addButton: { marginTop: 6, backgroundColor: "#2563eb", padding: 10, borderRadius: 6, alignSelf: "flex-start" },
  addButtonText: { color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", backgroundColor: "#fff", padding: 16, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  modalButton: { padding: 10, borderRadius: 6, flex: 1, alignItems: "center", marginHorizontal: 4 },
  cancelButton: { backgroundColor: "#9ca3af" },
  saveButton: { backgroundColor: "#16a34a" },
  modalButtonText: { color: "#fff", fontWeight: "600" },
});

export default ServiceProviderDashboard;