// app/(tabs)/card-detail.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { getTransactions } from '../services/database'; 
import { SafeAreaView } from 'react-native-safe-area-context';

// Tipe data Transaksi (sesuai database.ts)
interface Transaction {
    id: number;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    source: string;
    purpose: string;
}

// --- Komponen Sederhana untuk Item Transaksi (Simulasi TransactionItem) ---
// Biasanya ini diletakkan di components/TransactionItem.tsx
const SimpleTransactionItem: React.FC<{ item: Transaction }> = ({ item }) => {
    const isIncome = item.type === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountColor = isIncome ? '#3CB371' : '#FF4500'; // Hijau/Merah
    
    // Format tanggal: 2025-11-13 -> 13 Nov 2025
    const datePart = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Fungsi sederhana untuk format mata uang IDR
    const formatCurrency = (amount: number) => {
        return `IDR ${Math.abs(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    const transactionImage = isIncome 
        ? require('../assets/images/stonks.png') 
        : require('../assets/images/loss.png'); 

    return (
        <TouchableOpacity style={transactionStyles.itemContainer}>
            <View style={transactionStyles.imageWrapper}>
                <Image source={transactionImage} style={transactionStyles.transactionImage} />
            </View>
            <View style={transactionStyles.textContainer}>
                <Text style={transactionStyles.titleText}>{item.title}</Text>
                <Text style={transactionStyles.subtitleText}>{item.purpose} • {datePart}</Text>
            </View>
            <Text style={[transactionStyles.amountText, { color: amountColor }]}>
                {amountSign}{formatCurrency(item.amount)}
            </Text>
        </TouchableOpacity>
    );
};

const transactionStyles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        backgroundColor: '#fff', // Tambah background untuk card item
        borderRadius: 10,
        marginVertical: 4, // Tambah margin agar ada jarak antar item
        paddingRight: 15,
        paddingLeft: 15,
        shadowColor: '#000', // Tambah shadow untuk tampilan card
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    imageWrapper: {
        width: 70, // Lebar area gambar
        height: 70, // Tinggi area gambar
        borderRadius: 10,
        backgroundColor: 'transparent', // Background jika gambar belum load / default
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Penting untuk memastikan gambar tidak keluar area
    },
    transactionImage: {
        width: '100%', // Gambar mengisi penuh wrapper
        height: '100%', // Gambar mengisi penuh wrapper
        resizeMode: 'contain', // Menyesuaikan gambar agar terlihat utuh
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitleText: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
// -----------------------------------------------------------

const CardDetailScreen = () => {
  // Ambil parameter 'source' dari URL
  const { source } = useLocalSearchParams<{ source: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil nama sumber untuk ditampilkan
  const sourceName = source || 'Detail Transaction'; 

  const fetchTransactions = useCallback(async () => {
    if (!source) return;

    setIsLoading(true);
    try {
      // Panggil fungsi getTransactions dengan filter source yang berasal dari URL parameter
      const data: Transaction[] = await getTransactions(source);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch filtered transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [source]);

  // Gunakan useFocusEffect agar data selalu ter-update
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      return () => {};
    }, [fetchTransactions])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
        <Text style={styles.loadingText}>Loading History...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Konfigurasi Header untuk Expo Router Stack */}
      <Stack.Screen 
        options={{ 
          title: sourceName, // Gunakan nama sumber sebagai judul
          headerStyle: { backgroundColor: '#f5f5f5' },
          headerTintColor: '#333',
          headerBackTitleVisible: false, // Hilangkan teks di tombol back
        }} 
      />
      
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Activity History for "{sourceName}"</Text>
        <Text style={styles.listSubtitle}>Total {transactions.length} transactions recorded.</Text>
      </View>

      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <SimpleTransactionItem item={item} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity recorded for this source.</Text>
          <Text style={styles.emptySubText}>Add a new transaction with "{sourceName}" as the source.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
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

export default CardDetailScreen;