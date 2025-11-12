// app/edit-transaction.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform // Untuk cek OS (Android/iOS)
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTransactionById, updateTransaction } from '../services/database';
// --- IMPORT DATE PICKER ---
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Data Dummy (harus sama dengan modal.tsx)
const SOURCE_ACCOUNTS = ['Bank', 'Cash', 'E-Wallet', 'Lainnya'];
const INCOME_PURPOSES = ['Gaji', 'Bonus', 'Freelance', 'Lainnya'];
const EXPENSE_PURPOSES = ['Makanan', 'Transportasi', 'Tagihan', 'Hiburan', 'Lainnya'];

export default function EditTransactionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const transactionId = parseInt(id as string);

  // State Utama
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [isLoading, setIsLoading] = useState(true);

  // State Kategori
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');

  // --- STATE BARU UNTUK TANGGAL ---
  const [date, setDate] = useState(new Date()); // Simpan sebagai objek Date
  const [showDatePicker, setShowDatePicker] = useState(false);
  // ---------------------------------

  const setCategoryState = (
    data: string, dummyArray: string[], setDummy: (val: string) => void, setCustom: (val: string) => void
  ) => {
    if (dummyArray.includes(data)) {
      setDummy(data);
    } else {
      setDummy('Lainnya');
      setCustom(data);
    }
  };

  // Load data
  useEffect(() => {
    if (!transactionId) return;
    const loadData = async () => {
      try {
        const data = await getTransactionById(transactionId);
        if (data) {
          setTitle(data.title);
          setAmount(data.amount.toString());
          setType(data.type);
          setDate(new Date(data.date)); // <-- Ubah string jadi objek Date
          
          setCategoryState(data.source, SOURCE_ACCOUNTS, setSource, setCustomSource);
          if (data.type === 'income') {
            setCategoryState(data.purpose, INCOME_PURPOSES, setPurpose, setCustomPurpose);
          } else {
            setCategoryState(data.purpose, EXPENSE_PURPOSES, setPurpose, setCustomPurpose);
          }
        } else {
          Alert.alert("Error", "Data tidak ditemukan.");
          router.back();
        }
      } catch (error) {
        Alert.alert("Error", "Gagal memuat data.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [transactionId]);

  // Simpan Perubahan
  const handleUpdate = async () => {
    const numericAmount = parseFloat(amount);
    if (!title || !amount || isNaN(numericAmount) || numericAmount <= 0) {
      alert('Harap isi semua field dengan benar.');
      return;
    }

    let finalSource = (source === 'Lainnya') ? customSource : source;
    let finalPurpose = (purpose === 'Lainnya') ? customPurpose : purpose;

    if (!finalSource || !finalPurpose) {
      alert('Harap lengkapi kategori sumber dan tujuan.');
      return;
    }
    
    // Format tanggal baru ke string ISO (YYYY-MM-DD)
    const newISODate = date.toISOString().split('T')[0];

    try {
      await updateTransaction(
        transactionId, title, numericAmount, type,
        newISODate, // <-- Kirim tanggal yang sudah diupdate
        finalSource, finalPurpose
      );
      
      router.back(); // Kembali ke halaman Detail
    } catch (error) {
      console.error("Gagal update:", error);
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    }
  };

  // Fungsi untuk handle Date Picker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // Tutup otomatis di Android
    setDate(currentDate);
  };
  
  // Helper render tombol
  const renderButtons = (data: string[], state: string, setState: (val: string) => void) => {
    return data.map((item) => (
      <TouchableOpacity
        key={item}
        style={[styles.catButton, state === item && styles.catButtonActive]}
        onPress={() => setState(item)}
      >
        <Text style={[styles.catButtonText, state === item && styles.catButtonTextActive]}>
          {item}
        </Text>
      </TouchableOpacity>
    ));
  };
  
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setPurpose('');
    setCustomPurpose('');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.overlay}>
      <ScrollView style={styles.modalBox} contentContainerStyle={{ padding: 20 }}>
        
        {/* --- TOMBOL DATE PICKER --- */}
        <View style={styles.categorySection}>
          <Text style={styles.label}>Tanggal Transaksi</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text style={{fontSize: 16}}>
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Munculkan Date Picker jika 'showDatePicker' true */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}
        {/* ------------------------- */}

        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'income' && styles.activeIncome]}
            onPress={() => handleTypeChange('income')}
          >
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>Pemasukan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'expense' && styles.activeExpense]}
            onPress={() => handleTypeChange('expense')}
          >
            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>Pengeluaran</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Judul"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Jumlah (IDR)"
          keyboardType="numeric"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
        />

        {/* UI KONDISIONAL (Sama kayak modal) */}
        {type === 'income' && (
          <>
            <View style={styles.categorySection}>
              <Text style={styles.label}>Sumber Pemasukan (Dari mana)</Text>
              <View style={styles.categoryRow}>
                {renderButtons(INCOME_PURPOSES, purpose, setPurpose)}
              </View>
              {purpose === 'Lainnya' && (
                <TextInput
                  placeholder="Tulis Sumber Lainnya..."
                  style={styles.input}
                  value={customPurpose}
                  onChangeText={setCustomPurpose}
                />
              )}
            </View>
            <View style={styles.categorySection}>
              <Text style={styles.label}>Simpan ke Saldo (Ke mana)</Text>
              <View style={styles.categoryRow}>
                {renderButtons(SOURCE_ACCOUNTS, source, setSource)}
              </View>
              {source === 'Lainnya' && (
                <TextInput
                  placeholder="Tulis Saldo Lainnya..."
                  style={styles.input}
                  value={customSource}
                  onChangeText={setCustomSource}
                />
              )}
            </View>
          </>
        )}
        {type === 'expense' && (
          <>
            <View style={styles.categorySection}>
              <Text style={styles.label}>Ambil dari Saldo (Dari mana)</Text>
              <View style={styles.categoryRow}>
                {renderButtons(SOURCE_ACCOUNTS, source, setSource)}
              </View>
              {source === 'Lainnya' && (
                <TextInput
                  placeholder="Tulis Saldo Lainnya..."
                  style={styles.input}
                  value={customSource}
                  onChangeText={setCustomSource}
                />
              )}
            </View>
            <View style={styles.categorySection}>
              <Text style={styles.label}>Kategori Pengeluaran (Untuk apa)</Text>
              <View style={styles.categoryRow}>
                {renderButtons(EXPENSE_PURPOSES, purpose, setPurpose)}
              </View>
              {purpose === 'Lainnya' && (
                <TextInput
                  placeholder="Tulis Kategori Lainnya..."
                  style={styles.input}
                  value={customPurpose}
                  onChangeText={setCustomPurpose}
                />
              )}
            </View>
          </>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonBatal]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonBatalText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSimpan]}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonSimpanText}>Simpan Perubahan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES (Sama seperti sebelumnya) ---
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modalBox: {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    fontSize: 16,
    justifyContent: 'center', // Biar teks di tombol tanggal pas di tengah
    minHeight: 45, // Samain tinggi
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  typeButtonText: {
    fontWeight: '600',
    color: '#555'
  },
  typeButtonTextActive: {
    color: '#fff'
  },
  activeIncome: {
    backgroundColor: '#28B463',
  },
  activeExpense: {
    backgroundColor: '#E74C3C',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  catButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  catButtonActive: {
    backgroundColor: '#6A5ACD',
  },
  catButtonText: {
    color: '#333',
  },
  catButtonTextActive: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonSimpan: {
    backgroundColor: '#6A5ACD',
  },
  buttonSimpanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonBatal: {
    backgroundColor: '#f0f0f0',
  },
  buttonBatalText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  }
});