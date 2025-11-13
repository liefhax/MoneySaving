// app/modal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { addTransaction } from '../services/database';
import { useRouter } from 'expo-router';

// --- DATA ---
const SOURCE_ACCOUNTS = ['Bank', 'Cash', 'E-Wallet', 'Lainnya'];
const INCOME_PURPOSES = ['Gaji', 'Bonus', 'Freelance', 'Lainnya'];
const EXPENSE_PURPOSES = ['Makanan', 'Transportasi', 'Tagihan', 'Hiburan', 'Lainnya'];
// ----------------------------

export default function ModalAddPage() {
  const router = useRouter();

  // --- State Utama ---
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');

  // --- State untuk "Titik Otomatis" ---
  const [amountValue, setAmountValue] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState('');

  // --- Fungsi Format Otomatis ---
  const handleAmountChange = (text: string) => {
    const numericString = text.replace(/[^0-9]/g, '');
    if (numericString === '') {
      setAmountValue(0);
      setFormattedAmount('');
      return;
    }
    const numericValue = parseInt(numericString, 10);
    setAmountValue(numericValue);
    setFormattedAmount(numericValue.toLocaleString('id-ID'));
  };

  const handleSave = async () => {
    // Validasi Dasar
    if (!title || amountValue <= 0) {
      Alert.alert('Validasi', 'Harap isi judul dan jumlah dengan benar.');
      return;
    }

    // --- LOGIKA 'SOURCE' (Saldo) ---
    let finalSource = '';
    if (source === 'Lainnya') {
      if (!customSource) {
        Alert.alert('Validasi', 'Harap isi "Sumber Saldo Lainnya"');
        return;
      }
      finalSource = customSource;
    } else if (!source) {
      Alert.alert(
        'Validasi',
        type === 'income' ? 'Harap pilih "Simpan ke Saldo"' : 'Harap pilih "Ambil dari Saldo"'
      );
      return;
    } else {
      finalSource = source;
    }

    // --- LOGIKA 'PURPOSE' (Kategori) ---
    let finalPurpose = '';
    if (purpose === 'Lainnya') {
      if (!customPurpose) {
        Alert.alert('Validasi', 'Harap isi "Kategori Lainnya"');
        return;
      }
      finalPurpose = customPurpose;
    } else if (!purpose) {
      Alert.alert(
        'Validasi',
        type === 'income' ? 'Harap pilih "Sumber Pemasukan"' : 'Harap pilih "Kategori Pengeluaran"'
      );
      return;
    } else {
      finalPurpose = purpose;
    }

    const date = new Date().toISOString().split('T')[0];

    try {
      await addTransaction(title, amountValue, type, date, finalSource, finalPurpose);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Gagal simpan dari modal:', error);
      Alert.alert('Database Error', 'Gagal menyimpan transaksi: ' + (error as Error).message);
    }
  };

  const handleClose = () => {
    router.replace('/(tabs)');
  };

  const renderButtons = (
    data: string[],
    state: string,
    setState: (val: string) => void
  ) => {
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
    setSource('');
    setCustomSource('');
    setPurpose('');
    setCustomPurpose('');
  };

  return (
    <View style={styles.overlay}>
      <ScrollView style={styles.modalBox} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Tambah Transaksi</Text>

        {/* Pilih Tipe */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.activeIncome]}
            onPress={() => handleTypeChange('income')}
          >
            <Text
              style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.activeExpense]}
            onPress={() => handleTypeChange('expense')}
          >
            <Text
              style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        {/* Judul */}
        <TextInput
          style={styles.input}
          placeholder="Judul Transaksi"
          value={title}
          onChangeText={setTitle}
        />

        {/* Jumlah */}
        <TextInput
          style={styles.input}
          placeholder="Jumlah"
          keyboardType="numeric"
          value={formattedAmount}
          onChangeText={handleAmountChange}
        />

        {/* Sumber Saldo */}
        <Text style={styles.sectionLabel}>
          {type === 'income' ? 'Simpan ke Saldo:' : 'Ambil dari Saldo:'}
        </Text>
        <View style={styles.buttonGroup}>
          {renderButtons(SOURCE_ACCOUNTS, source, setSource)}
        </View>
        {source === 'Lainnya' && (
          <TextInput
            style={styles.input}
            placeholder="Masukkan Sumber Lainnya"
            value={customSource}
            onChangeText={setCustomSource}
          />
        )}

        {/* Kategori */}
        <Text style={styles.sectionLabel}>
          {type === 'income' ? 'Sumber Pemasukan:' : 'Kategori Pengeluaran:'}
        </Text>
        <View style={styles.buttonGroup}>
          {renderButtons(
            type === 'income' ? INCOME_PURPOSES : EXPENSE_PURPOSES,
            purpose,
            setPurpose
          )}
        </View>
        {purpose === 'Lainnya' && (
          <TextInput
            style={styles.input}
            placeholder="Masukkan Kategori Lainnya"
            value={customPurpose}
            onChangeText={setCustomPurpose}
          />
        )}

        {/* Tombol Simpan & Batal */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={handleClose}>
            <Text style={styles.footerText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.saveBtn]} onPress={handleSave}>
            <Text style={styles.footerText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'center'
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    padding: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  typeButtonText: {
    fontSize: 16,
    color: '#555'
  },
  activeIncome: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50'
  },
  activeExpense: {
    backgroundColor: '#f44336',
    borderColor: '#f44336'
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  catButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    marginRight: 6,
    marginBottom: 6
  },
  catButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3'
  },
  catButtonText: {
    color: '#555'
  },
  catButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  footerBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  saveBtn: {
    backgroundColor: '#4caf50'
  },
  cancelBtn: {
    backgroundColor: '#f44336'
  },
  footerText: {
    color: '#fff',
    fontWeight: '600'
  }
});
