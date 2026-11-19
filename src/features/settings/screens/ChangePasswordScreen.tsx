import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { repositories } from '@/services/repositories';
import { GUTTER } from '@/theme';
import { ApiError } from '@/types/api';

export function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Enter your current password';
    if (next.length < 8) e.next = 'Use at least 8 characters';
    if (confirm !== next) e.confirm = 'Passwords don’t match';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await repositories.auth.changePassword(current, next);
      Alert.alert('Password updated', undefined, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      setErrors({ current: err instanceof ApiError ? err.message : 'Something went wrong' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Change password" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 18 }} keyboardShouldPersistTaps="handled">
          <TextField label="Current password" icon={Lock} password value={current} onChangeText={setCurrent} error={errors.current} />
          <TextField label="New password" icon={Lock} password value={next} onChangeText={setNext} error={errors.next} hint="At least 8 characters" />
          <TextField label="Confirm new password" icon={Lock} password value={confirm} onChangeText={setConfirm} error={errors.confirm} />
          <Button label="Update password" onPress={submit} loading={busy} size="lg" className="mt-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
