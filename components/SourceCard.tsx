// components/SourceCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Tipe data untuk prop
interface SourceCardProps {
  sourceName: string;
  balance: number;
  onPress: () => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ sourceName, balance, onPress }) => {
  
  // Fungsi sederhana untuk menentukan ikon/warna berdasarkan nama sumber
  const getSourceStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('e-wallet') || lowerName.includes('gopay') || lowerName.includes('ovo')) {
        return { icon: '💰', color: '#1E90FF' }; // Biru
    } else if (lowerName.includes('bank') || lowerName.includes('bca') || lowerName.includes('mandiri')) {
        return { icon: '🏦', color: '#6A5ACD' }; // Ungu (sesuai warna tombol di index.tsx)
    } else if (lowerName.includes('cash') || lowerName.includes('tunai')) {
        return { icon: '💵', color: '#3CB371' }; // Hijau
    }
    return { icon: '💳', color: '#FF4500' }; // Oranye (Default)
  };

  const { icon, color } = getSourceStyle(sourceName);
  
  // Fungsi sederhana untuk format mata uang IDR
  const formatCurrency = (amount: number) => {
    return `IDR ${Math.abs(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
  
  const balanceColor = balance >= 0 ? '#3CB371' : '#FF4500'; // Hijau untuk positif, Merah untuk negatif

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={[styles.icon, { backgroundColor: color + '20' }]}>{icon}</Text>
        <Text style={styles.sourceName}>{sourceName}</Text>
      </View>
      <Text style={styles.balanceLabel}>Total Balance</Text>
      <Text style={[styles.balanceValue, { color: balanceColor }]}>
        {formatCurrency(balance)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginVertical: 8,
    borderLeftWidth: 5, // Garis warna di kiri
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  sourceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
});

export default SourceCard;