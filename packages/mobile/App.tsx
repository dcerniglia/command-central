import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc, API_URL } from './src/lib/trpc';

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Command Central</Text>
      <Text style={styles.subtitle}>Mobile app coming soon</Text>
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888888',
    fontSize: 16,
    marginTop: 8,
  },
});
