// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// ✅ Pastikan file gambar ini benar-benar ada di path berikut:
const illustration = require('../assets/images/welcome-dino.png');

const WelcomeScreen = () => {
  const router = useRouter();

  const goToTabs = () => {
    // Gunakan 'replace' agar user tidak bisa kembali (swipe back) ke Welcome Screen
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Gambar ilustrasi */}
      <Image source={illustration} style={styles.illustration} />

      {/* Judul utama */}
      <Text style={styles.title}>
        Save your money with{'\n'}Expense Tracker
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Save money! The more your money works for you, the less you have to work for money.
      </Text>

      {/* Tombol Let's Start */}
      <TouchableOpacity style={styles.button} onPress={goToTabs} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Let's Start</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777777',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#6A5ACD', // Soft purple
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
