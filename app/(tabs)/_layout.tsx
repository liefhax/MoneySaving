// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native'; // <-- TouchableOpacity dihapus

// KOMPONEN CustomTabButton YANG DI ATAS TADI, HAPUS SEMUA

export default function TabLayout() {
  const router = useRouter(); 

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6A5ACD', // Warna ikon aktif (ungu)
        tabBarInactiveTintColor: 'gray', // Warna ikon non-aktif
        tabBarShowLabel: false, // Sembunyikan label
        tabBarStyle: {
          position: 'absolute', 
          bottom: 20, 
          left: 15,
          right: 15,
          elevation: 0,
          backgroundColor: '#ffffff', 
          borderRadius: 15, 
          height: 70, // Tinggi navbar
          ...styles.shadow, 
        },
      }}
    >
      {/* Tab 1: Home (Wallet) */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={28} color={color} />
          ),
        }}
      />
      
      {/* Tab 2: Overview (Stats) */}
      <Tabs.Screen
        name="overview"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={28} color={color} />
          ),
        }}
      />

      {/* Tab 3: Tombol ADD (+) -- INI YANG DIUBAH */}
      <Tabs.Screen
        name="add" 
        options={{
          headerShown: false,
          // Kita styling ikonnya jadi buletan ungu
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 50, // Ukuran buletan
                height: 50,
                borderRadius: 25, // Bikin bulet
                backgroundColor: '#6A5ACD', // Warna ungu
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
          // HAPUS prop 'tabBarButton'
        }}
        listeners={{
          tabPress: (e) => {
            // Tetap cegah navigasi & buka modal
            e.preventDefault();
            router.push('/modal'); 
          },
        }}
      />

      {/* Tab 4: Card */}
      <Tabs.Screen
        name="card"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={28} color={color} />
          ),
        }}
      />
      
      {/* Tab 5: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Helper untuk bayangan (shadow)
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1, // Bayangannya kita bikin tipis
    shadowRadius: 3.5,
    elevation: 5,
  },
});