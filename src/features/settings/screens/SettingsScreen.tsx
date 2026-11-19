import { Bell, FileText, HelpCircle, Info, KeyRound, LifeBuoy, Mic, ShieldCheck, Trash2 } from 'lucide-react-native';
import { Alert, ScrollView, Switch } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { ListGroup, ListRow } from '@/components/common/ListRow';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePlayerStore } from '@/store/playerStore';
import { useIsCreator, useSessionStore } from '@/store/sessionStore';
import { colors, GUTTER } from '@/theme';
import Constants from 'expo-constants';

export function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const signOut = useSessionStore((s) => s.signOut);
  const isCreator = useIsCreator();
  const setRole = useSessionStore((s) => s.setRole);

  /** `/user/delete-account` asks for the password; deleting a creator also deletes their podcasts. */
  const deleteAccount = () =>
    Alert.alert(
      'Delete your account?',
      isCreator
        ? 'This permanently deletes your account, your podcasts, and their likes and comments. This can’t be undone.'
        : 'This permanently deletes your account, playlists and history. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            usePlayerStore.getState().stop();
            signOut();
          },
        },
      ],
    );

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
        <ListGroup title="Preview">
          <ListRow
            icon={Mic}
            label="Creator mode (demo)"
            trailing={<Switch value={isCreator} onValueChange={(v) => setRole(v ? 'creator' : 'user')} trackColor={{ true: colors.brand[400], false: colors.ink[600] }} thumbColor={colors.white} accessibilityLabel="Creator mode" />}
          />
        </ListGroup>
        <ListGroup>
          <ListRow icon={Trash2} label="Delete Account" destructive onPress={deleteAccount} />
        </ListGroup>
        <AppText variant="caption" tone="faint" className="text-center">
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </ScrollView>
    </Screen>
  );
}
