import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { passwordError } from '@/features/auth/validation';
import { useChangePasswordMutation } from '@/store/api/authApi';
import { GUTTER } from '@/theme';
import { getErrorMessage } from '@/utils/apiError';

/** `/auth/change-password` (old + new + confirm). */
export function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submit = async () => {
    const e = {
      current: current ? undefined : 'Enter your current password',
      next: passwordError(next),
      confirm: confirm === next ? undefined : 'Passwords don’t match',
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    try {
      await changePassword({ oldPassword: current, newPassword: next }).unwrap();
      Alert.alert('Password updated', undefined, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      setErrors({ current: getErrorMessage(err) });
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Change Password" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 18 }} keyboardShouldPersistTaps="handled">
          <TextField label="Current password" icon={Lock} password value={current} onChangeText={setCurrent} error={errors.current} />
          <TextField label="New password" icon={Lock} password value={next} onChangeText={setNext} error={errors.next} hint="At least 6 characters" />
          <TextField label="Confirm new password" icon={Lock} password value={confirm} onChangeText={setConfirm} error={errors.confirm} />
          <Button label="Update password" onPress={submit} loading={isLoading} size="lg" className="mt-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
