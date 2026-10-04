// Bileşen testleri için ortak hazırlık. Testler gerçek sunucuya hiç bağlanmaz.

// Supabase istemcisi .env okumadan ve ağa çıkmadan sahte bir nesneyle değiştirilir.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(async () => ({ data: [], error: null })),
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) },
    storage: {
      from: () => ({ getPublicUrl: (path) => ({ data: { publicUrl: `https://test.local/${path}` } }) }),
    },
  },
}));

// Titreşim testte sessizce geçilir.
jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));
