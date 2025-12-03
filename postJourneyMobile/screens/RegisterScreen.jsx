import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('patient');

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://192.168.137.1:5000/register', {
        name, email, password, userType
      });

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        navigation.navigate('LoginScreen');
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register</Text>

      <TextInput 
        placeholder="Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />

      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none" 
        style={styles.input} 
      />

      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />

      <Text style={{ marginBottom: 5 }}>User Type:</Text>
      <Picker 
        selectedValue={userType} 
        onValueChange={(itemValue) => setUserType(itemValue)} 
        style={styles.picker}
      >
        <Picker.Item label="Patient" value="patient" />
        <Picker.Item label="Service Provider" value="service provider" />
      </Picker>

      <Button title="Register" onPress={handleRegister} />

      <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
  picker: { height: 50, width: '100%', marginBottom: 20 }
});
