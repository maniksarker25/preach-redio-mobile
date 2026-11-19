import { Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { repositories } from '@/services/repositories';
import { useSessionStore } from '@/store/sessionStore';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { isEmail, useAuthAction } from '../hooks/useAuthAction';

const RESEND_AFTER = 45;

/** Email OTP for both sign-up (`/user/verify-code`) and password reset (`/auth/verify-reset-otp`). */
export function VerifyCodeScreen({ route, navigation }: AuthScreenProps<'VerifyCode'>) {
  const { email, purpose, role } = route.params;
  const signIn = useSessionStore((s) => s.signIn);
  const setRole = useSessionStore((s) => s.setRole);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_AFTER);
  const { busy, error, setError, run } = useAuthAction();

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    if (purpose === 'signup') {
      const session = await run(() => repositories.auth.verifyCode(email, value));
      if (session) {
        signIn(session);
        if (role === 'creator') setRole('creator');
      }
    } else {
      const ok = await run(async () => {
        await repositories.auth.verifyResetCode(email, value);
        return true;
      });
      if (ok) navigation.replace('ResetPassword', { email });
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}.`}
      footer={
        <View className="flex-row items-center">
          <AppText variant="bodySm" tone="muted">
            Didn’t get it?{' '}
          </AppText>
          {seconds > 0 ? (
            <AppText variant="label" tone="muted">
              Resend in {seconds}s
            </AppText>
          ) : (
            <Touchable onPress={() => setSeconds(RESEND_AFTER)}>
              <AppText variant="label" tone="brand">
                Resend code
              </AppText>
            </Touchable>
          )}
        </View>
      }
    >
      <OtpInput
        value={code}
        error={Boolean(error)}
        onChange={(v) => {
          setCode(v);
          setError(undefined);
          if (v.length === 6) void verify(v);
        }}
      />
      {error ? (
        <AppText variant="caption" tone="live">
          {error}
        </AppText>
      ) : (
        <AppText variant="caption" tone="faint">
          Demo: any 6 digits except 000000.
        </AppText>
      )}
      <Button label="Verify" onPress={() => void verify()} loading={busy} disabled={code.length !== 6} size="lg" className="mt-2" />
    </AuthLayout>
  );
}

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const { busy, error, run } = useAuthAction();

  const submit = async () => {
    if (!isEmail(email)) {
      setFieldError('Enter a valid email');
      return;
    }
    const ok = await run(async () => {
      await repositories.auth.forgotPassword(email.trim());
      return true;
    });
    if (ok) navigation.navigate('VerifyCode', { email: email.trim(), purpose: 'reset' });
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we’ll send you a code to reset it.">
      <TextField label="Email" icon={Mail} value={email} onChangeText={(t) => { setEmail(t); setFieldError(undefined); }} keyboardType="email-address" autoCapitalize="none" autoFocus error={fieldError ?? error} onSubmitEditing={submit} />
      <Button label="Send code" onPress={submit} loading={busy} size="lg" className="mt-2" />
    </AuthLayout>
  );
}

export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const { busy, error, run } = useAuthAction();

  const submit = async () => {
    const e = { password: password.length >= 8 ? undefined : 'Use at least 8 characters', confirm: confirm === password ? undefined : 'Passwords don’t match' };
    setErrors(e);
    if (e.password || e.confirm) return;
    const ok = await run(async () => {
      await repositories.auth.resetPassword(route.params.email, password);
      return true;
    });
    if (ok) Alert.alert('Password reset', 'Sign in with your new password.', [{ text: 'Sign in', onPress: () => navigation.popToTop() }]);
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you haven’t used before.">
      <TextField label="New password" icon={Lock} value={password} onChangeText={setPassword} password autoComplete="new-password" error={errors.password ?? error} />
      <TextField label="Confirm password" icon={Lock} value={confirm} onChangeText={setConfirm} password error={errors.confirm} />
      <Button label="Reset password" onPress={submit} loading={busy} size="lg" className="mt-2" />
    </AuthLayout>
  );
}
