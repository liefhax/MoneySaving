import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ScrollView, Switch, ActivityIndicator, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Icon bawaan Expo
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { 
  getTransactions, 
  deleteAllTransactions, 
  convertAllAmounts, 
  importTransactions 
} from '../../services/database'; 

// Pake gambar placeholder atau ilustrasi profile kalau ada
// const avatar = require('../../assets/images/user-avatar.png'); 

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [isDollar, setIsDollar] = useState(false); 

  // --- LOGIC FUNCTIONS (Sama kayak sebelumnya) ---
  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      if (data.length === 0) { Alert.alert("Kosong", "Belum ada transaksi."); return; }
      
      let csvContent = "id,title,amount,type,date,source,purpose\n";
      data.forEach((item: any) => {
        csvContent += `${item.id},"${item.title}",${item.amount},${item.type},${item.date},"${item.source}","${item.purpose}"\n`;
      });

      const fileUri = FileSystem.documentDirectory + 'transactions_backup.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) { Alert.alert("Error", "Gagal export data."); } 
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
      if (result.canceled) return;
      setLoading(true);
      
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const rows = fileContent.split('\n');
      const transactions = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.trim()) continue;
        const cols = row.split(',');
        if (cols.length >= 6) {
           const clean = (str: string) => str ? str.replace(/"/g, '') : '';
           transactions.push({
             title: clean(cols[1]), amount: parseFloat(cols[2]), type: clean(cols[3]),
             date: clean(cols[4]), source: clean(cols[5]), purpose: clean(cols[6] || '')
           });
        }
      }
      await importTransactions(transactions);
      Alert.alert("Sukses", `Import ${transactions.length} data berhasil!`);
    } catch (e) { Alert.alert("Gagal", "Format CSV salah."); } 
    finally { setLoading(false); }
  };

  const toggleCurrency = () => {
    const newIsDollar = !isDollar;
    Alert.alert(
      "Konversi Mata Uang",
      `Ubah ke ${newIsDollar ? 'Dollar ($)' : 'Rupiah (Rp)'}? Nilai akan dikonversi.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Gass", onPress: async () => {
            setLoading(true);
            try {
              const rate = newIsDollar ? (1 / 15000) : 15000;
              await convertAllAmounts(rate);
              setIsDollar(newIsDollar);
            } finally { setLoading(false); }
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert("⚠ Reset Database", "Semua data transaksi akan hilang permanen!", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          setLoading(true);
          await deleteAllTransactions();
          setLoading(false);
          Alert.alert("Bersih", "Database sudah di-reset.");
      }}
    ]);
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>A</Text> 
          </View>
          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.subtitle}>Manage your data & preferences</Text>
        </View>

        {/* DATA MANAGEMENT SECTION */}
        <Text style={styles.sectionHeader}>Data Management</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleExport} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-upload-outline" size={24} color="#6A5ACD" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.buttonTitle}>Export Data</Text>
            <Text style={styles.buttonDesc}>Backup to CSV Spreadsheet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleImport} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={24} color="#6A5ACD" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.buttonTitle}>Import Data</Text>
            <Text style={styles.buttonDesc}>Restore from CSV Spreadsheet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* PREFERENCES SECTION */}
        <Text style={styles.sectionHeader}>Preferences</Text>

        <View style={styles.actionButton}>
          <View style={styles.iconContainer}>
            <Ionicons name="cash-outline" size={24} color="#6A5ACD" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.buttonTitle}>Currency Mode</Text>
            <Text style={styles.buttonDesc}>{isDollar ? "USD ($)" : "IDR (Rp)"}</Text>
          </View>
          <Switch 
            value={isDollar} 
            onValueChange={toggleCurrency}
            trackColor={{ false: "#ddd", true: "#6A5ACD" }}
            thumbColor={"#fff"}
          />
        </View>

        {/* DANGER ZONE */}
        <Text style={[styles.sectionHeader, { color: '#FF6B6B', marginTop: 30 }]}>Danger Zone</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleReset} 
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFE5E5' }]}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </View>
          <View style={{flex: 1}}>
            <Text style={[styles.buttonTitle, { color: '#FF6B6B' }]}>Reset Database</Text>
            <Text style={styles.buttonDesc}>Delete all transactions permanently</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.versionText}>App Version 1.0.0</Text>

      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6A5ACD" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Putih bersih sesuai index.tsx
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0EEFA', // Warna ungu sangat muda
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#6A5ACD',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A5ACD',
  },
  title: {
    fontSize: 24, // Sedikit lebih kecil dari welcome screen biar muat
    fontWeight: '700',
    color: '#333333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#777777',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
    marginLeft: 5,
  },
  // Card Style ala Button di Welcome Screen tapi versi List
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 20, // Rounded besar
    marginBottom: 15,
    // Shadow ala Welcome Screen
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dangerButton: {
    borderColor: '#FFE5E5',
    backgroundColor: '#FFF5F5', // Merah sangat muda
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#F4F2FF', // Ungu pudar
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  buttonDesc: {
    fontSize: 12,
    color: '#888',
  },
  versionText: {
    textAlign: 'center',
    color: '#ccc',
    marginTop: 20,
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  }
});