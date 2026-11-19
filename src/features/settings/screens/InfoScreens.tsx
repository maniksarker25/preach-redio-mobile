import { ChevronDown, Mail, MessageSquare, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { ErrorState, Skeleton } from '@/components/common/States';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useContentPage, useFaqs } from '@/hooks/queries';
import { useSessionStore } from '@/store/sessionStore';
import { colors, GUTTER } from '@/theme';
import { timeAgo } from '@/utils/format';

const SUPPORT_EMAIL = 'support@preachradio.com';

/** CMS page (about / terms / privacy), managed from the dashboard. */
export function ContentPageScreen({ route }: RootScreenProps<'ContentPage'>) {
  const page = useContentPage(route.params.key);
  return (
    <Screen>
      <ScreenHeader title={page.data?.title} />
      {page.isPending ? (
        <View style={{ padding: GUTTER, gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={i % 2 ? '85%' : '100%'} height={14} />
          ))}
        </View>
      ) : page.isError || !page.data ? (
        <ErrorState onRetry={() => void page.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
          <AppText variant="caption" tone="muted" className="mb-5">
            Updated {timeAgo(page.data.updatedAt)}
          </AppText>
          {page.data.body.split('\n\n').map((para, i) => (
            <AppText key={i} variant="body" tone="secondary" className="mb-4">
              {para}
            </AppText>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const FaqItemView = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View layout={LinearTransition.duration(220)} style={{ overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.ink[800] }}>
      <Touchable onPress={() => setOpen((o) => !o)} scaleTo={0.99} className="flex-row items-center p-4" accessibilityState={{ expanded: open }} accessibilityLabel={q}>
        <AppText variant="title" className="flex-1 pr-3">
          {q}
        </AppText>
        <ChevronDown size={18} color={colors.text.muted} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Touchable>
      {open ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <AppText variant="bodySm" tone="secondary">
            {a}
          </AppText>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

export function FaqScreen({ navigation }: RootScreenProps<'Faq'>) {
  const faqs = useFaqs();
  return (
    <Screen>
      <ScreenHeader title="FAQ" />
      {faqs.isError ? (
        <ErrorState onRetry={() => void faqs.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 10, paddingBottom: 48 }}>
          {faqs.isPending ? [0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={58} />) : faqs.data?.map((f) => <FaqItemView key={f._id} q={f.question} a={f.answer} />)}
          <View className="mt-6 items-center">
            <AppText variant="bodySm" tone="muted">
              Still need help?
            </AppText>
            <Button label="Contact support" variant="secondary" size="sm" onPress={() => navigation.navigate('Support')} className="mt-3" />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

/** Contact form — posts to `/contact-us` once connected. */
export function SupportScreen({ navigation }: RootScreenProps<'Support'>) {
  const profile = useSessionStore((s) => s.session?.profile);
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (message.trim().length < 10) e.message = 'Tell us a little more (10+ characters)';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    Alert.alert('Message sent', 'Thanks for reaching out. We usually reply within one business day.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <Screen>
      <ScreenHeader title="Help & support" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3">
            <Touchable onPress={() => navigation.navigate('Faq')} className="flex-1 rounded-lg border border-line bg-ink-800 p-4" accessibilityLabel="Read the FAQ">
              <MessageSquare size={20} color={colors.brand[400]} />
              <AppText variant="title" className="mt-3">
                FAQ
              </AppText>
              <AppText variant="caption" tone="muted">
                Quick answers
              </AppText>
            </Touchable>
            <Touchable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} className="flex-1 rounded-lg border border-line bg-ink-800 p-4" accessibilityLabel="Email support">
              <Mail size={20} color={colors.brand[400]} />
              <AppText variant="title" className="mt-3">
                Email us
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {SUPPORT_EMAIL}
              </AppText>
            </Touchable>
          </View>
          <AppText variant="h3" className="mt-2">
            Send a message
          </AppText>
          <TextField label="Name" icon={User} value={name} onChangeText={setName} error={errors.name} />
          <TextField label="Email" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <TextField label="How can we help?" value={message} onChangeText={setMessage} multiline maxLength={1000} error={errors.message} />
          <Button label="Send message" onPress={send} loading={busy} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
