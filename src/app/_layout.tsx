import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dish-detail" options={{ headerShown: false }} />
      <Stack.Screen name="dish-form" options={{ headerShown: false }} />
    </Stack>
  );
}