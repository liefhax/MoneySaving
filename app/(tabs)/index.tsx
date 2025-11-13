// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants'; 
import { getTransactions, getTotals } from '../../services/database';

// --- Komponen Item Transaksi Sederhana ---
// Ini untuk menampilkan item di daftar transaksi Anda
const SimpleTransactionItem: React.FC<any> = ({ title, purpose, date, amount, type }) => {
    const isIncome = type === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountColor = isIncome ? '#3CB371' : '#FF4500';
    const formatCurrency = (val: number) => `IDR ${Math.abs(val).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    return (
        <View style={itemStyles.container}>
            <View style={itemStyles.icon}>
                <Ionicons name={isIncome ? "arrow-down-circle" : "arrow-up-circle"} size={24} color={amountColor} />
            </View>
            <View style={itemStyles.textContainer}>
                <Text style={itemStyles.title}>{title}</Text>
                <Text style={itemStyles.subtitle}>{purpose} • {new Date(date).toLocaleDateString('id-ID')}</Text>
            </View>
            <Text style={[itemStyles.amount, { color: amountColor }]}>
                {amountSign}{formatCurrency(amount)}
            </Text>
        </View>
    );
};
const itemStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    icon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    textContainer: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 13, color: '#888' },
    amount: { fontSize: 16, fontWeight: 'bold' }
});
// ---------------------------------------------

// --- Komponen Utama Halaman Home ---
const HomeScreen = () => {
  const router = useRouter();
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [totalsData, transactionsData] = await Promise.all([
        getTotals(),
        getTransactions(undefined, 5) // Ambil 5 transaksi terbaru
      ]);
      setTotals(totalsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [loadData])
  );
  
  const formatIDR = (value: number) => {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* === HEADER === */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="grid" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        {/* === KARTU BALANCE === */}
        <LinearGradient
          colors={['#8E2DE2', '#4A00E0']}
          style={styles.balanceCard}
        >
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

        {/* === TRANSACTIONS === */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/card')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* List Transaksi */}
        <FlatList
          data={transactions} // Tampilkan data yang sudah di-limit dari database
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SimpleTransactionItem
              title={item.title}
              purpose={item.purpose}
              date={item.date}
              amount={item.amount}
              type={item.type}
            />
          )}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada transaksi</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

// --- STYLES UNTUK HOME SCREEN ---
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: Constants.statusBarHeight + 5
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  balanceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
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
  ieLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  ieAmount: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionsTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  seeAll: { fontSize: 14, color: '#6A5ACD', fontWeight: 'bold' },
  list: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16,
  }
});

export default HomeScreen;