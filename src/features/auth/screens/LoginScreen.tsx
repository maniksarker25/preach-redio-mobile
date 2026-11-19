import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { repositories } from '@/services/repositories';
import { useSessionStore } from '@/store/sessionStore';
import { AuthLayout } from '../components/AuthLayout';
import { isEmail, useAuthAction } from '../hooks/useAuthAction';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const signIn = useSessionStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { busy, error, run } = useAuthAction();

  const submit = async () => {
    const e = { email: isEmail(email) ? undefined : 'Enter a valid email', password: password ? undefined : 'Enter your password' };
    setFieldErrors(e);
    if (e.email || e.password) return;
    const session = await run(() => repositories.auth.login(email.trim(), password));
    if (session) signIn(session);
  };


  return (
    <AuthLayout
      back={navigation.canGoBack()}
      title="Log In"
      footer={
        <View className="flex-row items-center">
          <AppText variant="bodySm" tone="muted">
            Don’t have an account?{' '}
          </AppText>
          <Touchable onPress={() => navigation.navigate('SignUp')}>
            <AppText variant="label" tone="brand">
              Sign Up
            </AppText>
          </Touchable>
        </View>
      }
    >
      <TextField label="Email" placeholder="Enter Your Email" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" error={fieldErrors.email} />
      <TextField label="Password" placeholder="Enter Your Password" icon={Lock} value={password} onChangeText={setPassword} password autoComplete="password" textContentType="password" error={fieldErrors.password ?? error} onSubmitEditing={submit} />
      <Touchable onPress={() => navigation.navigate('ForgotPassword')} className="self-end">
        <AppText variant="label" tone="secondary">
          Forgot password?
        </AppText>
      </Touchable>
      <Button label="Log In" onPress={submit} loading={busy} size="lg" className="mt-2" />
      <AppText variant="caption" tone="faint" className="text-center">
        Demo: any email + 6-character password. Emails starting with “creator” sign in as a creator.
      </AppText>
    </AuthLayout>
  );
}
