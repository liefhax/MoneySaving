// app/(tabs)/overview.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const OverviewScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Overview Screen (WIP)</Text>
        <Text>Konten Overview akan ada di sini</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  }
});

export default OverviewScreen;