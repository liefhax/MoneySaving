// app/transaction-detail.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionById, deleteTransaction } from '../services/database';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const transactionId = parseInt(id as string);

  const [transaction, setTransaction] = useState<any>(null);

  // --- INI PERBAIKANNYA ---
  useFocusEffect(
    useCallback(() => {
      // Buat fungsi async di DALAM callback
      const fetchData = async () => {
        if (!transactionId) return;
        try {
          const data = await getTransactionById(transactionId);
          if (data) {
            setTransaction(data);
          } else {
            Alert.alert("Error", "Data tidak ditemukan.", [{ text: "OK", onPress: () => router.back() }]);
          }
        } catch (error) {
          Alert.alert("Error", "Gagal memuat data.", [{ text: "OK", onPress: () => router.back() }]);
        }
      };

      // Panggil fungsi itu di sini
      fetchData();

      // Return fungsi cleanup (kosong)
      return () => {
        // Kamu bisa reset state di sini kalo perlu
        // setTransaction(null); 
      };
    }, [transactionId, router]) // <-- Dependencies tetap sama
  );
  // -------------------------

  // Fungsi Hapus
  const handleDelete = () => {
    Alert.alert(
      "Hapus Transaksi",
      "Yakin mau hapus data ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              Alert.alert("Sukses", "Data berhasil dihapus.");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus data.");
            }
          }
        }
      ]
    );
  };

  // Fungsi Edit
  const handleEdit = () => {
    router.push(`/edit-transaction?id=${transactionId}`);
  };

  // Tampilan Loading...
  if (!transaction) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </SafeAreaView>
    );
  }
  
  // Format data
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#28B463' : '#E74C3C';
  const amountSign = isIncome ? '+' : '-';
  const formattedAmount = transaction.amount.toLocaleString('id-ID');
  const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        {/* Header (Tipe & Judul) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{transaction.title}</Text>
          <Text style={[styles.headerType, { color: amountColor }]}>
            {isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
          </Text>
        </View>

        {/* Info Uang */}
        <View style={styles.amountBox}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {amountSign}IDR {formattedAmount}
          </Text>
        </View>

        {/* Detail */}
        <View style={styles.detailContainer}>
          <DetailRow 
            label={isIncome ? "Sumber Pemasukan" : "Kategori Pengeluaran"} 
            value={transaction.purpose} 
            icon="pricetag"
          />
          <DetailRow 
            label={isIncome ? "Disimpan ke" : "Diambil dari"} 
            value={transaction.source} 
            icon="wallet"
          />
          <DetailRow 
            label="Tanggal Transaksi" 
            value={formattedDate} 
            icon="calendar"
          />
        </View>
      </ScrollView>

      {/* Tombol Aksi di Bawah */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonBatal]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="#E74C3C" />
          <Text style={styles.buttonBatalText}>Hapus</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSimpan]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.buttonSimpanText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Komponen helper untuk nampilin detail
const DetailRow = ({ label, value, icon }: { label: string, value: string, icon: any }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={20} color="#888" style={styles.detailIcon} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

// --- STYLES (Tetap sama) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  amountBox: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    margin: 20,
    borderRadius: 10,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  detailContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
  },
  buttonSimpan: {
    backgroundColor: '#6A5ACD',
  },
  buttonSimpanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonBatal: {
    backgroundColor: '#fde0e0',
  },
  buttonBatalText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  }
});