import { Mic, Music, Radio, Video } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Screen } from '@/components/layouts/Screen';
import { colors, GUTTER } from '@/theme';

const Option = ({ icon: Icon, title, body, tint, onPress }: { icon: LucideIcon; title: string; body: string; tint: string; onPress: () => void }) => (
  <Touchable haptic onPress={onPress} className="flex-row items-center rounded-lg border border-line bg-ink-800 p-4" accessibilityLabel={title}>
    <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${tint}22` }}>
      <Icon size={22} color={tint} />
    </View>
    <View className="ml-4 flex-1">
      <AppText variant="title">{title}</AppText>
      <AppText variant="caption" tone="muted" className="mt-0.5">
        {body}
      </AppText>
    </View>
  </Touchable>
);

/** The creator "+" menu — the same four actions as the Flutter creator nav. */
export function CreateSheetScreen({ navigation }: RootScreenProps<'CreateSheet'>) {
  const insets = useSafeAreaInsets();
  return (
    <Screen safeTop={false} className="bg-ink-850">
      <View className="items-center pb-2 pt-2.5">
        <View className="h-1 w-10 rounded-full bg-ink-500" />
      </View>
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 20 }} className="gap-3">
        <AppText variant="h2" className="mb-2 mt-3">
          Create
        </AppText>
        <Option icon={Music} title="Upload audio" body="A message, study or devotional" tint={colors.brand[400]} onPress={() => navigation.replace('Upload', { mediaType: 'audio' })} />
        <Option icon={Video} title="Upload video" body="A full sermon or a Preach Clip" tint="#7FB2FF" onPress={() => navigation.replace('Upload', { mediaType: 'video' })} />
        <Option icon={Mic} title="Record audio" body="Record straight from your phone" tint={colors.gold} onPress={() => navigation.replace('RecordAudio')} />
        <Option icon={Radio} title="Go live" body="Broadcast to your listeners now" tint={colors.live} onPress={() => navigation.replace('GoLive')} />
      </View>
    </Screen>
  );
}
