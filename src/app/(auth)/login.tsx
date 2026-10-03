import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { signIn, toAuthMessage } from '@/features/auth/api';
import { AuthScreen, FormError } from '@/features/auth/components/auth-screen';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('E-posta adresini ve şifreni gir.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Giriş başarılı olunca yönlendirme kendiliğinden olur (src/app/_layout.tsx).
      await signIn(email, password);
    } catch (signInError) {
      setError(toAuthMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen title="Tekrar hoş geldin" subtitle="Tahminlerine kaldığın yerden devam et.">
      <TextField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@mail.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="Şifren"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
      />

      {error ? <FormError message={error} /> : null}

      <Button label={submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'} onPress={submit} disabled={submitting} />

      <Link href="/register" replace>
        <Text className="text-center text-sm text-muted">
          Hesabın yok mu? <Text className="font-semibold text-primary">Kayıt ol</Text>
        </Text>
      </Link>
    </AuthScreen>
  );
}
