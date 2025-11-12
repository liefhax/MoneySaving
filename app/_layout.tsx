// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'transparentModal',
          headerShown: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen
        name="all-transactions"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Semua Transaksi',
        }}
      />
      <Stack.Screen
        name="edit-transaction"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Edit Transaksi',
        }}
      />
      
      {/* --- TAMBAHKAN INI --- */}
      <Stack.Screen
        name="transaction-detail" // Merujuk ke app/transaction-detail.tsx
        options={{
          presentation: 'modal', // Muncul dari bawah
          headerShown: true,
          title: 'Detail Transaksi',
        }}
      />
      {/* ------------------- */}

    </Stack>
  );
}