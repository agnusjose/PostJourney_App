import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminUsersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin – User Management</Text>
      <Text style={styles.subtitle}>This is where admin sees all users.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { marginTop: 10, fontSize: 16 },
});
