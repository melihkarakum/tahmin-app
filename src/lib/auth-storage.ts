import 'expo-sqlite/localStorage/install';

// Oturumun telefonda saklandığı yer: expo-sqlite'ın localStorage uyarlaması (Supabase'in Expo önerisi).
// Web'de bu dosyanın yerine auth-storage.web.ts kullanılır.
export const authStorage: Storage | undefined = globalThis.localStorage;
