// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; 

// Pastikan gambar ini ada di: assets/images/welcome-dino.png
const illustration = require('../assets/images/welcome-dino.png');

const WelcomeScreen = () => {
  const router = useRouter(); 

  const goToTabs = () => {
    router.replace('/(tabs)'); 
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Tampilkan gambar dinosaurus */}
      <Image source={illustration} style={styles.illustration} />
      
      {/* 2. Sembunyikan placeholder abu-abu */}
      {/* <View style={styles.placeholderImage} /> */}

      {/* 3. Title */}
      <Text style={styles.title}>Save your money with{"\n"}Expense Tracker</Text>

      {/* 4. Subtitle */}
      <Text style={styles.subtitle}>
        Save money! The more your money works for you, the less you have to work for money.
      </Text>

      {/* 5. Tombol Let's Start */}
      <TouchableOpacity
        style={styles.button}
        onPress={goToTabs} 
      >
        <Text style={styles.buttonText}>Lets Start</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- STYLES UNTUK WELCOME SCREEN ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  // Style untuk placeholder (disembunyikan)
  placeholderImage: {
    width: 250,
    height: 250,
    backgroundColor: '#E0E0E0', 
    borderRadius: 20,
    marginBottom: 40,
  },
  // Style untuk gambar dinosaurus
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
    backgroundColor: '#6A5ACD', 
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