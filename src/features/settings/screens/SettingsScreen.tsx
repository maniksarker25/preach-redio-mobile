import Constants from 'expo-constants';
import { Bell, FileText, HelpCircle, Info, KeyRound, LifeBuoy, Lock, Mic, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { ListGroup, ListRow } from '@/components/common/ListRow';
import { TextField } from '@/components/common/TextField';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useDeleteAccountMutation } from '@/store/api/authApi';
import { useAppDispatch, useIsCreator } from '@/store/hooks';
import { usePlayerStore } from '@/store/playerStore';
import { roleChanged } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import { getErrorMessage } from '@/utils/apiError';

/** Password confirmation for `/user/delete-account`. */
function DeleteAccountModal({ visible, isCreator, onClose }: { visible: boolean; isCreator: boolean; onClose: () => void }) {
  const [deleteAccount, { isLoading, error, reset }] = useDeleteAccountMutation();
  const [password, setPassword] = useState('');

  const close = () => {
    setPassword('');
    reset();
    onClose();
  };

  const confirm = async () => {
    if (!password) return;
    try {
      usePlayerStore.getState().stop();
      await deleteAccount({ password }).unwrap(); // logs out on success
    } catch {
      /* shown from `error` */
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 }} onPress={close}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: colors.ink[850], borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.line }}>
            <AppText variant="h3">Delete your account?</AppText>
            <AppText variant="bodySm" tone="secondary" className="mt-2">
              {isCreator
                ? 'This permanently deletes your account and your podcasts, with their likes, bookmarks and comments.'
                : 'This permanently deletes your account, playlists and history.'}{' '}
              This can’t be undone.
            </AppText>
            <View className="mt-5">
              <TextField
                label="Enter your password to confirm"
                icon={Lock}
                password
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  reset();
                }}
                error={error ? getErrorMessage(error) : undefined}
                autoFocus
              />
            </View>
            <View className="mt-5 flex-row gap-3">
              <Button label="Cancel" variant="secondary" onPress={close} className="flex-1" />
              <Button label="Delete" variant="danger" onPress={confirm} loading={isLoading} disabled={!password} className="flex-1" />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const dispatch = useAppDispatch();
  const isCreator = useIsCreator();
  const [deleting, setDeleting] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
        <ListGroup title="Account">
          <ListRow icon={KeyRound} label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <ListRow icon={Bell} label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        </ListGroup>
        <ListGroup title="Support">
          <ListRow icon={HelpCircle} label="FAQ" onPress={() => navigation.navigate('Faq')} />
          <ListRow icon={LifeBuoy} label="Contact Support" onPress={() => navigation.navigate('Support')} />
        </ListGroup>
        <ListGroup title="Legal">
          <ListRow icon={FileText} label="Terms of Services" onPress={() => navigation.navigate('ContentPage', { key: 'terms' })} />
          <ListRow icon={ShieldCheck} label="Privacy Policy" onPress={() => navigation.navigate('ContentPage', { key: 'privacy' })} />
          <ListRow icon={Info} label="About Us" onPress={() => navigation.navigate('ContentPage', { key: 'about' })} />
        </ListGroup>
        {__DEV__ ? (
          <ListGroup title="Preview (development only)">
            <ListRow
              icon={Mic}
              label="Creator mode"
              trailing={
                <Switch
                  value={isCreator}
                  onValueChange={(v) => {
                    dispatch(roleChanged(v ? 'creator' : 'user'));
                  }}
                  trackColor={{ true: colors.brand[400], false: colors.ink[600] }}
                  thumbColor={colors.white}
                  accessibilityLabel="Creator mode"
                />
              }
            />
          </ListGroup>
        ) : null}
        <ListGroup>
          <ListRow icon={Trash2} label="Delete Account" destructive onPress={() => setDeleting(true)} />
        </ListGroup>
        <AppText variant="caption" tone="faint" className="text-center">
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </ScrollView>
      <DeleteAccountModal visible={deleting} isCreator={isCreator} onClose={() => setDeleting(false)} />
    </Screen>
  );
}
