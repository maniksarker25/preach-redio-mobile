import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { useLoginMutation } from '@/store/api/authApi';
import { getErrorMessage, getErrorStatus } from '@/utils/apiError';
import { AuthLayout } from '../components/AuthLayout';
import { FormError } from '../components/FormError';
import { isEmail } from '../validation';

/** `/auth/login` → profile → session stored (the navigator switches to the app). */
export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const e = { email: isEmail(email) ? undefined : 'Enter a valid email', password: password ? undefined : 'Enter your password' };
    setFieldErrors(e);
    if (e.email || e.password) return;
    try {
      await login({ email, password }).unwrap();
    } catch (err) {
      // Unverified accounts get a fresh code and go to verification, like the Flutter app.
      if (getErrorStatus(err) === 403 && /verif/i.test(getErrorMessage(err))) {
        navigation.navigate('VerifyCode', { email: email.trim().toLowerCase(), purpose: 'signup', resend: true });
      }
    }
  };

  return (
    <AuthLayout
      back={navigation.canGoBack()}
      title="Welcome back"
      subtitle="Log in to keep listening, watching and saving."
      footer={
        <View className="flex-row items-center">
          <AppText variant="bodySm" tone="muted">
            New to Preach Radio?{' '}
          </AppText>
          <Touchable onPress={() => navigation.navigate('SignUp')} accessibilityLabel="Create an account">
            <AppText variant="label" tone="brand">
              Create an account
            </AppText>
          </Touchable>
        </View>
      }
    >
      {error ? <FormError message={getErrorMessage(error)} /> : null}
      <TextField
        variant="filled"
        label="Email"
        placeholder="you@example.com"
        icon={Mail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setFieldErrors((x) => ({ ...x, email: undefined }));
          reset();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        error={fieldErrors.email}
      />
      <View>
        <TextField
          variant="filled"
          label="Password"
          placeholder="Your password"
          icon={Lock}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setFieldErrors((x) => ({ ...x, password: undefined }));
            reset();
          }}
          password
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          error={fieldErrors.password}
          onSubmitEditing={submit}
        />
        <Touchable onPress={() => navigation.navigate('ForgotPassword')} className="mt-3 self-end" accessibilityLabel="Forgot password">
          <AppText variant="label" tone="secondary">
            Forgot password?
          </AppText>
        </Touchable>
      </View>
      <Button label="Log In" onPress={submit} loading={isLoading} size="lg" className="mt-3 rounded-[14px]" />
    </AuthLayout>
  );
}
