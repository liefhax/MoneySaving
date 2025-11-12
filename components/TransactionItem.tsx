// components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definisikan Props
type TransactionItemProps = {
  title: string;
  purpose: string; // Kategori (Gaji, Makanan, dll)
  date: string;    // Tanggal
  amount: number;
  type: 'income' | 'expense';
};

const TransactionItem: React.FC<TransactionItemProps> = ({ title, purpose, date, amount, type }) => {
  const amountColor = type === 'income' ? '#28B463' : '#E74C3C';
  const amountSign = type === 'income' ? '+' : '-';
  
  const formattedAmount = amount.toLocaleString('id-ID');
  const iconName = type === 'income' ? 'cash' : 'card';

  return (
    <View style={styles.container}>
      <View style={styles.iconBg}>
        <Ionicons name={iconName} size={24} color="#6A5ACD" />
      </View>
      
      {/* --- INI PERBAIKANNYA --- */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {/* Kita tampilkan kategori (purpose) DAN tanggal (date) */}
        <Text style={styles.date}>{purpose} • {date}</Text>
      </View>
      {/* ------------------------- */}
      
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountSign}IDR {formattedAmount}
      </Text>
    </View>
  );
};

// --- STYLES (Tetap sama) ---
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionItem;