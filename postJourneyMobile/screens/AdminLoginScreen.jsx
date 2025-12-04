import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
} from "react-native";
import axios from "axios";

export default function AdminLoginScreen({ navigation }) {
  const [secretKey, setSecretKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = async () => {
    if (!secretKey || !email || !password) {
      return Alert.alert("Error", "All fields are required.");
    }

    try {
      const response = await axios.post(
        "http://172.16.229.212:5000/admin/login",
        { secretKey, email, password }
      );

      console.log("ADMIN LOGIN RESPONSE:", response.data);

      if (response.data.success === true) {
        Alert.alert("Success", "Admin Login Successful");
        return navigation.replace("HomeScreen", {
          userEmail: email,
          isAdmin: true,
        });
      }

      // ❗ERROR — do NOT navigate
      return Alert.alert("Login Failed", response.data.message);

    } catch (err) {
      console.log("ADMIN LOGIN ERROR:", err);
      return Alert.alert("Error", "Server error");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/pjlogo_bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/postjourney_logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Admin Login</Text>

        <TextInput
          placeholder="Secret Key"
          value={secretKey}
          onChangeText={setSecretKey}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#555"
        />

        <TextInput
          placeholder="Admin Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#555"
        />

        <TextInput
          placeholder="Admin Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#555"
        />

        <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    elevation: 2,
  },
  button: {
    width: "100%",
    backgroundColor: "#0066cc",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
