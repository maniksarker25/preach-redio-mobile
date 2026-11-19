import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, HandHeart, Headphones, Sparkles } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useSessionStore } from '@/store/sessionStore';
import { colors, GUTTER } from '@/theme';
import { cn } from '@/utils/podcast';

/** Mirrors the RevenueCat offering the Flutter app shows. Prices come from the store at runtime. */
const PLANS = [
  { id: 'annual', title: 'Yearly', price: '$39.99', per: 'per year', note: 'Save 33%' },
  { id: 'monthly', title: 'Monthly', price: '$4.99', per: 'per month', note: undefined },
] as const;

/** Only what the subscription does today: no ads + supporting the ministry. */
const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Headphones, title: 'Ad-free listening', body: 'No banners, no interruptions between messages.' },
  { icon: HandHeart, title: 'Support the ministry', body: 'Your subscription helps keep Preach Radio on air.' },
  { icon: Sparkles, title: 'Every station, every message', body: 'The full library and all live broadcasts.' },
];

export function SubscriptionScreen({ navigation }: RootScreenProps<'Subscription'>) {
  const insets = useSafeAreaInsets();
  const isPremium = useSessionStore((s) => s.isPremium);
  const setPremium = useSessionStore((s) => s.setPremium);
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('annual');
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900)); // mock purchase (RevenueCat later)
    setBusy(false);
    setPremium(true);
    Alert.alert('Welcome to Premium', 'Thank you for supporting Preach Radio.', [{ text: 'Continue', onPress: () => navigation.goBack() }]);
  };

  return (
    <Screen safeTop={false}>
      <LinearGradient colors={['#3A2A0E', colors.ink[900]]} locations={[0, 0.55]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 520 }} />
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader back="down" />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-gold/15">
            <Crown size={36} color={colors.gold} fill={colors.gold} />
          </View>
          <AppText variant="overline" tone="gold" className="mt-5">
            Preach Radio Premium
          </AppText>
          <AppText variant="display" className="mt-2 text-center">
            {isPremium ? 'You’re Premium' : 'Listen without interruptions'}
          </AppText>
        </View>

        <View className="mt-8 gap-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <View key={title} className="flex-row">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gold/15">
                <Icon size={19} color={colors.gold} />
              </View>
              <View className="ml-3.5 flex-1">
                <AppText variant="title">{title}</AppText>
                <AppText variant="bodySm" tone="muted">
                  {body}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {isPremium ? (
          <View className="mt-10 rounded-xl border border-gold/30 bg-gold/10 p-5">
            <AppText variant="title" tone="gold">
              Your subscription is active
            </AppText>
            <AppText variant="bodySm" tone="secondary" className="mt-1">
              Manage or cancel it from your App Store or Google Play account.
            </AppText>
          </View>
        ) : (
          <>
            <View className="mt-10 gap-3" accessibilityRole="radiogroup">
              {PLANS.map((p) => {
                const selected = plan === p.id;
                return (
                  <Touchable
                    key={p.id}
                    haptic
                    onPress={() => setPlan(p.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    className={cn('flex-row items-center rounded-xl border-2 p-4', selected ? 'border-gold bg-gold/10' : 'border-line-strong bg-ink-800')}
                  >
                    <View className={cn('h-6 w-6 items-center justify-center rounded-full', selected ? 'bg-gold' : 'border-2 border-ink-500')}>
                      {selected ? <Check size={14} color={colors.text.inverse} strokeWidth={3} /> : null}
                    </View>
                    <View className="ml-3.5 flex-1">
                      <AppText variant="title">{p.title}</AppText>
                      <AppText variant="caption" tone="muted">
                        {p.price} {p.per}
                      </AppText>
                    </View>
                    {p.note ? (
                      <View className="rounded-full bg-gold px-2.5 py-1">
                        <AppText variant="caption" tone="inverse">
                          {p.note}
                        </AppText>
                      </View>
                    ) : null}
                  </Touchable>
                );
              })}
            </View>
            <Button label="Start Premium" variant="gold" size="lg" onPress={subscribe} loading={busy} className="mt-6" />
            <Button label="Restore purchases" variant="ghost" size="sm" onPress={() => Alert.alert('Nothing to restore', 'No previous purchase was found for this account.')} className="mt-2" />
            <AppText variant="caption" tone="faint" className="mt-3 text-center">
              Renews automatically until cancelled. Cancel anytime in your store account.
            </AppText>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
