// components/SuccessConfetti.tsx
import React from 'react';
// --- MODIFIKASI: Tambahkan View dan StyleSheet ---
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type Props = {
  onComplete: () => void;
};

const SuccessConfetti = ({ onComplete }: Props) => {
  // --- MODIFIKASI: Ambil 'height' juga ---
  const { width, height } = useWindowDimensions();

  return (
    // --- MODIFIKASI: Tambahkan View pembungkus ini ---
    // Ini akan membuat layer baru di atas seluruh layar
    <View style={[styles.overlay, { width, height }]}>
      {/* Tembakan dari kiri */}
      <ConfettiCannon
        count={100}
        origin={{ x: -10, y: 0 }}
        autoStart={true}
        duration={3000}
        fallSpeed={3500}
        explosionSpeed={400}
        fadeOut={true}
        onAnimationEnd={onComplete} // Cukup satu cannon yang panggil onComplete
      />
      {/* Tembakan dari kanan */}
      <ConfettiCannon
        count={100}
        origin={{ x: width + 10, y: 0 }}
        autoStart={true}
        duration={3000}
        fallSpeed={3500}
        explosionSpeed={400}
        fadeOut={true}
      />
    </View>
  );
};

// --- MODIFIKASI: Tambahkan StyleSheet ini ---
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', // Ini kuncinya!
    top: 0,
    left: 0,
    zIndex: 1000, // Pastikan layer ini di paling atas
    pointerEvents: 'none', // Penting! Agar layer-nya tidak menghalangi klik
  },
});

export default SuccessConfetti;