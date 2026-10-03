import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextField } from '@/components/ui/text-field';
import {
  isUsernameAvailable,
  MIN_PASSWORD_LENGTH,
  signUp,
  toAuthMessage,
  USERNAME_PATTERN,
} from '@/features/auth/api';
import { AuthScreen, FormError } from '@/features/auth/components/auth-screen';

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  terms?: string;
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!USERNAME_PATTERN.test(username)) {
      errors.username = 'Kullanıcı adı 3-20 karakter olmalı: küçük harf, rakam ya da alt çizgi.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Geçerli bir e-posta adresi gir.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
    }
    if (!acceptedTerms) {
      errors.terms = 'Devam etmek için koşulları kabul etmelisin.';
    }
    return errors;
  };

  const submit = async () => {
    setFormError(null);
    setNotice(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (!(await isUsernameAvailable(username))) {
        setFieldErrors({ username: 'Bu kullanıcı adı alınmış.' });
        return;
      }

      // Hesap açılınca oturum açılır ve ana sayfaya geçilir (src/app/_layout.tsx).
      const { needsEmailConfirmation } = await signUp({ email, password, username, displayName });
      if (needsEmailConfirmation) {
        setNotice('Hesabın açıldı. E-postana gelen bağlantıyla doğruladıktan sonra giriş yap.');
      }
    } catch (signUpError) {
      setFormError(toAuthMessage(signUpError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen title="Hesap oluştur" subtitle="Arkadaşlarınla skor tahmininde yarışmaya başla.">
      <TextField
        label="Kullanıcı adı"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
        placeholder="ornek_kullanici"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        maxLength={20}
        error={fieldErrors.username}
        hint="Arkadaşların seni bu adla görür. Sonradan değiştirilemez."
      />
      <TextField
        label="Görünen ad (isteğe bağlı)"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Melih"
        autoComplete="name"
        textContentType="name"
        maxLength={30}
      />
      <TextField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@mail.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={fieldErrors.email}
      />
      <TextField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder={`En az ${MIN_PASSWORD_LENGTH} karakter`}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={fieldErrors.password}
      />

      <Checkbox
        checked={acceptedTerms}
        onChange={setAcceptedTerms}
        accessibilityLabel="Kullanım koşullarını ve gizlilik politikasını kabul ediyorum">
        <Text className="text-sm text-ink">
          Kullanım koşullarını ve gizlilik politikasını okudum, kabul ediyorum.
        </Text>
        {fieldErrors.terms ? (
          <Text className="mt-1 text-xs text-danger">{fieldErrors.terms}</Text>
        ) : null}
      </Checkbox>

      {formError ? <FormError message={formError} /> : null}
      {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

      <Button label={submitting ? 'Hesap açılıyor…' : 'Kayıt Ol'} onPress={submit} disabled={submitting} />

      <Link href="/login" replace>
        <Text className="text-center text-sm text-muted">
          Zaten hesabın var mı? <Text className="font-semibold text-primary">Giriş yap</Text>
        </Text>
      </Link>
    </AuthScreen>
  );
}
