// app/all-transactions.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ScrollView // <-- Tambah ScrollView
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
// --- Import fungsi baru ---
import { getTransactions, getUniqueSources } from '../services/database';

export default function AllTransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Fungsi untuk memuat data
  const loadData = useCallback(async (filter?: string) => {
    try {
      // Ambil transaksi berdasarkan filter (atau semua jika filter undefined)
      const transactionsData = await getTransactions(filter);
      setTransactions(transactionsData);
      
      // Ambil juga daftar filter-nya
      const sourcesData = await getUniqueSources();
      setSources(sourcesData);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
  }, []);

  // useFocusEffect akan menjalankan loadData setiap layar ini aktif
  useFocusEffect(
    useCallback(() => {
      // Saat pertama load, panggil dengan filter yang aktif
      loadData(activeFilter);
      return () => {};
    }, [loadData, activeFilter]) // <-- Tambah activeFilter di sini
  );

  // Fungsi untuk ganti filter
  const handleFilterPress = (source?: string) => {
    setActiveFilter(source);
    // Kita tidak perlu panggil loadData(source) di sini
    // karena useFocusEffect akan otomatis ke-trigger oleh perubahan 'activeFilter'
    // Tapi jika useFocusEffect tidak ke-trigger, panggil manual di sini:
    // loadData(source);
  };

  // Navigasi ke Halaman Detail
  const handleViewDetail = (id: number) => {
    router.push(`/transaction-detail?id=${id}`);
  };

  // Render item untuk FlatList (DIGANTI)
  const renderItem = ({ item }: { item: any }) => {
    const amountColor = item.type === 'income' ? '#28B463' : '#E74C3C';
    const amountSign = item.type === 'income' ? '+' : '-';
    const iconName = item.type === 'income' ? 'cash' : 'card';

    return (
      // Kita bungkus pakai TouchableOpacity biar bisa diklik
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => handleViewDetail(item.id)} // <-- Panggil detail
      >
        <View style={styles.iconBg}>
          <Ionicons name={iconName} size={24} color="#6A5ACD" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDate}>{item.purpose} (dari {item.source})</Text> 
        </View>

        <View style={styles.actionsContainer}>
          <Text style={[styles.itemAmount, { color: amountColor }]}>
            {amountSign}IDR {item.amount.toLocaleString('id-ID')}
          </Text>
          {/* Ganti ikon edit/hapus jadi ikon "lihat" */}
          <Ionicons name="chevron-forward" size={22} color="#888" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* --- AREA FILTER BARU --- */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, !activeFilter && styles.filterButtonActive]}
            onPress={() => handleFilterPress(undefined)}
          >
            <Text style={[styles.filterText, !activeFilter && styles.filterTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          
          {sources.map(source => (
            <TouchableOpacity
              key={source}
              style={[
                styles.filterButton,
                activeFilter === source && styles.filterButtonActive
              ]}
              onPress={() => handleFilterPress(source)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === source && styles.filterTextActive
              ]}>
                {source}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* ------------------------ */}
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada transaksi</Text>}
      />
    </SafeAreaView>
  );
}

// --- STYLES BARU & LAMA ---
const styles =StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- Style Filter Baru ---
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#6A5ACD',
  },
  filterText: {
    color: '#333',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  // ------------------------
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconBg: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginRight: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16,
  }
});