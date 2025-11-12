// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter

// Gambar ilustrasi (pastikan path-nya benar)
// Kamu bisa pakai gambar default dulu kalau belum ada
// const illustration = require('../assets/images/wallet_illustration.png');

const WelcomeScreen = () => {
  const router = useRouter(); // Ini adalah React Hook untuk navigasi

  const goToTabs = () => {
    // Gunakan 'replace' agar user tidak bisa kembali (swipe back) ke Welcome Screen
    router.replace('/(tabs)'); 
  };

  return (
    <View style={styles.container}>
      {/* Gambar Ilustrasi */}
      {/* <Image source={illustration} style={styles.illustration} /> */}
      <View style={styles.placeholderImage} /> 

      {/* Title */}
      <Text style={styles.title}>Save your money with{"\n"}Expense Tracker</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Save money! The more your money works for you, the less you have to work for money.
      </Text>

      {/* Tombol Let's Start */}
      <TouchableOpacity
        style={styles.button}
        onPress={goToTabs} // Panggil fungsi navigasi
      >
        <Text style={styles.buttonText}>Lets Start</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  // Hapus ini jika kamu sudah punya gambar asli
  placeholderImage: {
    width: 250,
    height: 250,
    backgroundColor: '#E0E0E0', // Warna placeholder
    borderRadius: 20,
    marginBottom: 40,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#6A5ACD', // Warna ungu dari mockup
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;