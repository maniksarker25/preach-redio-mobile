import { Lock, Mail } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import {
  useForgotPasswordMutation,
  useResendResetCodeMutation,
  useResendVerifyCodeMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useVerifyResetCodeMutation,
} from '@/store/api/authApi';
import { getErrorMessage } from '@/utils/apiError';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { isEmail, passwordError } from '../validation';

/** Codes expire after 5 minutes on the server; allow a resend after 60 s. */
const RESEND_AFTER = 60;

/**
 * 6-digit email code.
 * - purpose "signup": `/user/verify-code` → signed in.
 * - purpose "reset":  `/auth/verify-reset-otp` → set a new password.
 */
export function VerifyCodeScreen({ route, navigation }: AuthScreenProps<'VerifyCode'>) {
  const { email, purpose, resend: resendOnOpen } = route.params;
  const [verifyEmail, verifyEmailState] = useVerifyEmailMutation();
  const [verifyReset, verifyResetState] = useVerifyResetCodeMutation();
  const [resendVerify, resendVerifyState] = useResendVerifyCodeMutation();
  const [resendReset, resendResetState] = useResendResetCodeMutation();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_AFTER);
  const [localError, setLocalError] = useState<string>();
  const sentOnOpen = useRef(false);

  const busy = verifyEmailState.isLoading || verifyResetState.isLoading;
  const resending = resendVerifyState.isLoading || resendResetState.isLoading;

  const resend = async () => {
    setLocalError(undefined);
    try {
      await (purpose === 'signup' ? resendVerify({ email }) : resendReset({ email })).unwrap();
      setSeconds(RESEND_AFTER);
    } catch (e) {
      setLocalError(getErrorMessage(e));
    }
  };

  // Coming from login with an unverified account: send a fresh code once.
  useEffect(() => {
    if (resendOnOpen && !sentOnOpen.current) {
      sentOnOpen.current = true;
      void resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setLocalError(undefined);
    try {
      if (purpose === 'signup') {
        await verifyEmail({ email, code: value }).unwrap(); // session stored → navigator switches to the app
      } else {
        await verifyReset({ email, code: value }).unwrap();
        navigation.replace('ResetPassword', { email });
      }
    } catch (e) {
      setLocalError(getErrorMessage(e));
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
            <Touchable onPress={resend} disabled={resending}>
              <AppText variant="label" tone="brand">
                {resending ? 'Sending…' : 'Resend code'}
              </AppText>
            </Touchable>
          )}
        </View>
      }
    >
      <OtpInput
        value={code}
        error={Boolean(localError)}
        onChange={(v) => {
          setCode(v);
          setLocalError(undefined);
          if (v.length === 6) void verify(v);
        }}
      />
      {localError ? (
        <AppText variant="caption" tone="live">
          {localError}
        </AppText>
      ) : (
        <AppText variant="caption" tone="faint">
          The code expires in 5 minutes. Check your spam folder if you can’t find it.
        </AppText>
      )}
      <Button label="Verify" onPress={() => void verify()} loading={busy} disabled={code.length !== 6} size="lg" className="mt-2 rounded-[14px]" />
    </AuthLayout>
  );
}

/** `/auth/forget-password` — emails a reset code. */
export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [forgotPassword, { isLoading, error, reset }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  const submit = async () => {
    if (!isEmail(email)) {
      setFieldError('Enter a valid email');
      return;
    }
    try {
      await forgotPassword({ email }).unwrap();
      navigation.navigate('VerifyCode', { email: email.trim().toLowerCase(), purpose: 'reset' });
    } catch {
      /* shown from `error` */
    }
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we’ll send you a code to reset it.">
      <TextField variant="filled"
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setFieldError(undefined);
          reset();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
        error={fieldError ?? (error ? getErrorMessage(error) : undefined)}
        onSubmitEditing={submit}
      />
      <Button label="Send code" onPress={submit} loading={isLoading} size="lg" className="mt-2 rounded-[14px]" />
    </AuthLayout>
  );
}

/** `/auth/reset-password` — allowed only after the reset code was verified. */
export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const submit = async () => {
    const e = { password: passwordError(password), confirm: confirm === password ? undefined : 'Passwords don’t match' };
    setErrors(e);
    if (e.password || e.confirm) return;
    try {
      await resetPassword({ email: route.params.email, password }).unwrap();
      Alert.alert('Password reset', 'You can now log in with your new password.', [{ text: 'Log In', onPress: () => navigation.popToTop() }]);
    } catch {
      /* shown from `error` */
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you haven’t used before.">
      <TextField variant="filled" label="New password" icon={Lock} value={password} onChangeText={setPassword} password autoComplete="new-password" hint="At least 6 characters" error={errors.password ?? (error ? getErrorMessage(error) : undefined)} />
      <TextField variant="filled" label="Confirm password" icon={Lock} value={confirm} onChangeText={setConfirm} password error={errors.confirm} />
      <Button label="Reset password" onPress={submit} loading={isLoading} size="lg" className="mt-2 rounded-[14px]" />
    </AuthLayout>
  );
}
