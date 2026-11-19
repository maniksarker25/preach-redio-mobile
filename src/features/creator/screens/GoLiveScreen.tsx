import { LinearGradient } from 'expo-linear-gradient';
import { Image as ImageIcon, Mic, MicOff, Radio, UserPlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { LiveBadge } from '@/components/common/LiveBadge';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { Equalizer } from '@/components/media/Equalizer';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import { formatClock } from '@/utils/format';
import { pickImage } from '@/utils/pickers';

type Phase = 'setup' | 'connecting' | 'live';

/**
 * Go-live flow: room setup (`/live-stream/create-streaming-room`) → join with a
 * 100ms token → on-air studio → end (`/live-stream/end-live/:id`). Streaming is simulated.
 */
export function GoLiveScreen({ navigation }: RootScreenProps<'GoLive'>) {
  const insets = useSafeAreaInsets();
  const profile = useAppSelector(selectProfile);
  const [phase, setPhase] = useState<Phase>('setup');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<string>();
  const [error, setError] = useState<string>();
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const start = async () => {
    if (!name.trim()) {
      setError('Give your broadcast a title');
      return;
    }
    setPhase('connecting');
    await new Promise((r) => setTimeout(r, 1200));
    setPhase('live');
  };

  const end = () =>
    Alert.alert('End broadcast?', 'Listeners will be disconnected. The recording appears in your past broadcasts.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => navigation.goBack() },
    ]);

  if (phase === 'live') {
    return (
      <Screen safeTop={false} className="bg-black">
        <Artwork uri={cover ?? profile?.profile_cover} radius={0} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.9)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View className="flex-row items-center justify-between px-4" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-center gap-2.5">
            <LiveBadge />
            <AppText variant="label" tone="white" style={{ fontVariant: ['tabular-nums'] }}>
              {formatClock(elapsed)}
            </AppText>
          </View>
          <IconButton icon={X} variant="glass" color={colors.white} onPress={end} accessibilityLabel="End broadcast" />
        </View>

        <View className="flex-1 items-center justify-center">
          <Avatar uri={profile?.profile_image} name={profile?.name ?? 'You'} size={132} live />
          <AppText variant="h1" tone="white" className="mt-6 px-8 text-center">
            {name}
          </AppText>
          <View className="mt-5">
            <Equalizer playing={!muted} height={26} barWidth={4} bars={5} color={colors.white} />
          </View>
          {muted ? (
            <AppText variant="label" tone="gold" className="mt-3">
              Your microphone is muted
            </AppText>
          ) : null}
        </View>

        <View className="flex-row items-center justify-center gap-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <IconButton icon={muted ? MicOff : Mic} variant="glass" size={24} color={muted ? colors.gold : colors.white} onPress={() => setMuted((m) => !m)} accessibilityLabel={muted ? 'Unmute' : 'Mute'} />
          <Button label="End live" variant="primary" onPress={end} className="w-40" />
          <IconButton icon={UserPlus} variant="glass" size={22} color={colors.white} onPress={() => Alert.alert('Invite a co-host', 'Invitations are sent as a notification to the person you choose.')} accessibilityLabel="Invite a co-host" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back="down" title="Go live" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <Touchable onPress={async () => { const img = await pickImage([16, 9]); if (img) setCover(img.uri); }} accessibilityLabel="Choose a cover for your broadcast">
            <Artwork uri={cover ?? profile?.profile_cover} aspect={16 / 9} radius={20}>
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ImageIcon size={26} color={colors.white} />
                <AppText variant="label" tone="white" className="mt-2">
                  {cover ? 'Change cover' : 'Add a cover'}
                </AppText>
              </View>
            </Artwork>
          </Touchable>
          <TextField label="Title" value={name} onChangeText={(t) => { setName(t); setError(undefined); }} placeholder="e.g. Midweek Word: Hebrews 11" error={error} maxLength={120} />
          <TextField label="Description" value={description} onChangeText={setDescription} placeholder="What will you share? (optional)" multiline maxLength={500} />
          <View className="flex-row items-start gap-3 rounded-lg border border-line bg-ink-800 p-4">
            <Radio size={18} color={colors.brand[400]} style={{ marginTop: 2 }} />
            <AppText variant="bodySm" tone="secondary" className="flex-1">
              Your broadcast appears under “Live now” for every listener. It’s recorded and saved to your past broadcasts when you end it.
            </AppText>
          </View>
          <Button label={phase === 'connecting' ? 'Connecting…' : 'Go live now'} icon={Radio} loading={phase === 'connecting'} onPress={start} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
