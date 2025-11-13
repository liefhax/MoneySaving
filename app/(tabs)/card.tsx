// app/(tabs)/card.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { getBalancesBySource } from '../../services/database'; 
import SourceCard from '../../components/SourceCard'; // Pastikan path benar
import { SafeAreaView } from 'react-native-safe-area-context';

// Tipe data untuk Balances
interface SourceBalance {
  source: string;
  income: number;
  expense: number;
  balance: number;
}

const CardScreen = () => {
  const router = useRouter();
  const [balances, setBalances] = useState<SourceBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil data saldo
  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mengambil saldo dari semua sumber yang ada di database
      const data = await getBalancesBySource();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gunakan useFocusEffect agar data selalu ter-update saat kembali ke halaman ini
  useFocusEffect(
    useCallback(() => {
      fetchBalances();
      return () => {}; // Cleanup function
    }, [fetchBalances])
  );

  // Fungsi navigasi saat card diklik
  const handleCardPress = (sourceName: string) => {
    // Navigasi ke halaman card-detail dengan membawa parameter 'source'
    router.push({
      pathname: '/card-detail', // Menunjuk ke app/(tabs)/card-detail.tsx
      params: { source: sourceName },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
        <Text style={styles.loadingText}>Loading Sources...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Menyembunyikan header default jika diperlukan, namun untuk tab bar biasanya diatur di _layout */}
      <Stack.Screen options={{ title: 'My Wallets', headerTitleStyle: { fontWeight: 'bold' } }} />
      
      <Text style={styles.headerTitle}>My Wallets</Text>
      
      {balances.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sources found.</Text>
            <Text style={styles.emptySubText}>Please add your first transaction to see your wallets here.</Text>
        </View>
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(item) => item.source}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SourceCard
              sourceName={item.source}
              balance={item.balance}
              onPress={() => handleCardPress(item.source)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#6A5ACD',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  }
});

export default CardScreen;