// app/(tabs)/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator, // <-- MODIFIKASI: Import ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

import TransactionItem from '../../components/TransactionItem';
import { getTransactions, getTotals } from '../../services/database';
import SuccessConfetti from '../../components/SuccessConfetti';

const HomeScreen = () => {
  const router = useRouter();
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);

  const params = useLocalSearchParams();
  const [displayConfetti, setDisplayConfetti] = useState(false);

  // --- MODIFIKASI: Tambahkan isLoading state ---
  // Mulai dengan 'true' agar render pertama adalah loading
  const [isLoading, setIsLoading] = useState(true);
  // ---------------------------------------------

  const loadData = useCallback(async () => {
    try {
      const [totalsData, transactionsData] = await Promise.all([
        getTotals(),
        getTransactions(),
      ]);
      setTotals(totalsData || { income: 0, expense: 0, balance: 0 });
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    }
  }, []);

  // --- MODIFIKASI: Logika useFocusEffect diubah ---
  useFocusEffect(
    useCallback(() => {
      const runOnFocus = async () => {
        // 1. Tampilkan loading spinner
        setIsLoading(true);

        // 2. TUNGGU data selesai di-load
        await loadData();

        // 3. Hentikan loading, tampilkan data
        setIsLoading(false);

        // 4. SETELAH data tampil, baru cek sinyal confetti
        if (params.showConfetti === 'true') {
          setDisplayConfetti(true);
          router.setParams({ showConfetti: undefined });
        }
      };

      runOnFocus();

      return () => {};
    }, [loadData, params.showConfetti, router])
  );
  // -----------------------------------------------

  const handleConfettiComplete = () => {
    setDisplayConfetti(false);
  };

  const formatIDR = (value: number) => {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* === HEADER === */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
            <Ionicons name="grid" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
            <Ionicons name="notifications" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        {/* === KARTU BALANCE (MODIFIKASI) === */}
        {isLoading ? (
          // Selama loading, tampilkan placeholder ini
          <View style={[styles.balanceCard, styles.loadingPlaceholder]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : (
          // Setelah loading selesai, tampilkan kartu balance
          <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>IDR {formatIDR(totals.balance)}</Text>
            <View style={styles.incomeExpenseContainer}>
              <View style={styles.incomeExpenseBox}>
                <Ionicons name="arrow-down" size={20} color="#28B463" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.ieLabel}>Income</Text>
                  <Text style={styles.ieAmount}>IDR {formatIDR(totals.income)}</Text>
                </View>
              </View>
              <View style={styles.incomeExpenseBox}>
                <Ionicons name="arrow-up" size={20} color="#E74C3C" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.ieLabel}>Expenses</Text>
                  <Text style={styles.ieAmount}>IDR {formatIDR(totals.expense)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* === TRANSACTIONS === */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/all-transactions')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* === DAFTAR TRANSAKSI (MODIFIKASI) === */}
        {isLoading ? (
          // Selama loading, tampilkan spinner di area list
          <View style={styles.listLoading}>
            <ActivityIndicator size="large" color="#6A5ACD" />
          </View>
        ) : (
          // Setelah loading, tampilkan list
          <FlatList
            data={transactions.slice(0, 5)}
            keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
            renderItem={({ item }) => (
              <TransactionItem
                title={item.title}
                purpose={item.purpose}
                date={new Date(item.date).toLocaleDateString('id-ID')}
                amount={item.amount}
                type={item.type}
              />
            )}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada transaksi</Text>}
          />
        )}
      </View>

      {/* Render komponen confetti */}
      {displayConfetti && <SuccessConfetti onComplete={handleConfettiComplete} />}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Constants.statusBarHeight + 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  // --- MODIFIKASI: Tambahkan style ini ---
  loadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A06CD5', // Warna 'abu-abu' dari gradien
    height: 175, // Samakan tinggi estimasi kartu
  },
  // ------------------------------------
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  incomeExpenseBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ieLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  ieAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#6A5ACD',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingBottom: 80,
  },
  // --- MODIFIKASI: Tambahkan style ini ---
  listLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  // ------------------------------------
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16,
  },
});

export default HomeScreen;