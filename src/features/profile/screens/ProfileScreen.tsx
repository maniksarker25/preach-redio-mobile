import { Image } from 'expo-image';
import { ChevronRight, Gem, Headphones, LogOut, MapPin, Mic, Pencil, Settings, Star } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';
import type { TabScreenProps } from '@/app/navigation/types';
import { logoWordmark } from '@/assets';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { useBroadcasters } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { usePlayerStore } from '@/store/playerStore';
import { baseApi } from '@/store/api/baseApi';
import { useAppDispatch, useAppSelector, useIsCreator } from '@/store/hooks';
import { loggedOut, selectCreatorApproved, selectProfile } from '@/store/slices/authSlice';
import { colors, GUTTER, shadow } from '@/theme';

/** Flutter `ProfileStatusCard`: icon + label row on a dark card. */
const ProfileRow = ({ icon: Icon, label, onPress, danger }: { icon: LucideIcon; label: string; onPress: () => void; danger?: boolean }) => (
  <Touchable onPress={onPress} scaleTo={0.985} className="h-14 flex-row items-center rounded-sm bg-ink-800 px-4" accessibilityLabel={label}>
    <Icon size={21} color={danger ? colors.danger : colors.brand[400]} />
    <AppText variant="title" className="ml-3.5 flex-1 text-[16px]" style={danger ? { color: colors.danger } : undefined}>
      {label}
    </AppText>
    {danger ? null : <ChevronRight size={18} color={colors.text.muted} />}
  </Touchable>
);

/** Profile tab — same items and order as the Flutter `ProfileScreen` (listener / creator). */
export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const bottom = useBottomSpace();
  const profile = useAppSelector(selectProfile);
  const creatorApproved = useAppSelector(selectCreatorApproved);
  const dispatch = useAppDispatch();
  const isCreator = useIsCreator();
  const signOut = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
  };
  const stationId = useBroadcasters().data?.find((b) => b.kind === 'station')?.id;

  const confirmSignOut = () =>
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          usePlayerStore.getState().stop();
          signOut();
        },
      },
    ]);

  const go = {
    edit: () => navigation.navigate('EditProfile'),
    playlists: () => navigation.navigate('Playlists'),
    upgrade: () => navigation.navigate('Subscription'),
    settings: () => navigation.navigate('Settings'),
    station: () => stationId && navigation.navigate('StationDetail', { id: stationId }),
    contents: () => navigation.navigate('MyPodcasts'),
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom }}>
        <View className="items-center pb-6 pt-5">
          <View className="absolute left-0 right-0 top-0 h-48 bg-live/5" />
          <Image source={logoWordmark} style={{ width: 120, height: 70 }} contentFit="contain" accessibilityLabel="Preach Radio" />
          <View className="mt-4 rounded-[35px] border-2 border-live p-1" style={shadow.glow}>
            <Artwork uri={profile?.profile_image} width={110} height={110} radius={30} />
          </View>
          <AppText variant="h1" className="mt-4 text-[26px]">
            {profile?.name ?? 'User Name'}
          </AppText>
          {profile?.address ? (
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin size={14} color={colors.live} />
              <AppText variant="bodySm" tone="secondary">
                {profile.address}
              </AppText>
            </View>
          ) : null}
        </View>

        <View className="gap-2.5" style={{ paddingHorizontal: GUTTER }}>
          {isCreator && creatorApproved === false ? (
            <View className="mb-1 rounded-sm border border-gold/40 bg-gold/10 p-3.5">
              <AppText variant="title" tone="gold">
                Waiting for approval
              </AppText>
              <AppText variant="bodySm" tone="secondary" className="mt-0.5">
                Our team is reviewing your creator account. You can publish once it’s approved.
              </AppText>
            </View>
          ) : null}
          {isCreator ? (
            <>
              <ProfileRow icon={Pencil} label="Edit Profile" onPress={go.edit} />
              <ProfileRow icon={Mic} label="My Contents" onPress={go.contents} />
              <ProfileRow icon={Gem} label="Upgrade" onPress={go.upgrade} />
              <ProfileRow icon={Headphones} label="My playlist" onPress={go.playlists} />
              <ProfileRow icon={Settings} label="Settings" onPress={go.settings} />
              <ProfileRow icon={Star} label="Station Profile" onPress={go.station} />
            </>
          ) : (
            <>
              <ProfileRow icon={Pencil} label="Edit Profile" onPress={go.edit} />
              <ProfileRow icon={Headphones} label="My playlist" onPress={go.playlists} />
              <ProfileRow icon={Gem} label="Upgrade" onPress={go.upgrade} />
              <ProfileRow icon={Settings} label="Settings" onPress={go.settings} />
              <ProfileRow icon={Star} label="Station Profile" onPress={go.station} />
            </>
          )}
          <View className="h-2" />
          <ProfileRow icon={LogOut} label="Log out" onPress={confirmSignOut} danger />
        </View>
      </ScrollView>
    </Screen>
  );
}
