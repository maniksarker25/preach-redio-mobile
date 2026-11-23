import { ChevronDown, FileText, HelpCircle, Mail, MessageSquare, Phone, User } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useGetContentPageQuery, useGetFaqsQuery, useGetSupportContactQuery, useSendFeedbackMutation } from '@/store/api/settingsApi';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import { getErrorMessage } from '@/utils/apiError';
import { timeAgo } from '@/utils/format';
import { htmlToBlocks } from '@/utils/html';

/** Used until the dashboard sets a contact email. */
const FALLBACK_SUPPORT_EMAIL = 'support@preachradio.com';
const PAGE_TITLES = { about: 'About Us', terms: 'Terms of Services', privacy: 'Privacy Policy' } as const;

/** CMS page (about / terms / privacy) — live; the dashboard saves HTML, rendered here as native text. */
export function ContentPageScreen({ route }: RootScreenProps<'ContentPage'>) {
  const { key } = route.params;
  const page = useGetContentPageQuery(key);
  const blocks = useMemo(() => htmlToBlocks(page.data?.body), [page.data?.body]);
  return (
    <Screen>
      <ScreenHeader title={PAGE_TITLES[key]} />
      {page.isLoading ? (
        <View style={{ padding: GUTTER, gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={i % 2 ? '85%' : '100%'} height={14} />
          ))}
        </View>
      ) : page.isError ? (
        <ErrorState onRetry={() => void page.refetch()} />
      ) : !page.data || !blocks.length ? (
        <EmptyState icon={FileText} title="Coming soon" message="This page hasn’t been published yet. Please check back later." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
          <AppText variant="caption" tone="muted" className="mb-5">
            Updated {timeAgo(page.data.updatedAt)}
          </AppText>
          {blocks.map((b, i) =>
            b.kind === 'heading' ? (
              <AppText key={i} variant="h3" className="mb-2 mt-2" accessibilityRole="header">
                {b.text}
              </AppText>
            ) : b.kind === 'bullet' ? (
              <View key={i} className="mb-2 flex-row pl-1">
                <AppText variant="body" tone="secondary" className="w-5">
                  •
                </AppText>
                <AppText variant="body" tone="secondary" className="flex-1">
                  {b.text}
                </AppText>
              </View>
            ) : (
              <AppText key={i} variant="body" tone="secondary" className="mb-4">
                {b.text}
              </AppText>
            ),
          )}
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
  const faqs = useGetFaqsQuery();
  return (
    <Screen>
      <ScreenHeader title="FAQ" />
      {faqs.isError ? (
        <ErrorState onRetry={() => void faqs.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 10, paddingBottom: 48 }}>
          {faqs.isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={58} />)
          ) : faqs.data?.length ? (
            faqs.data.map((f) => (
              <FaqItemView
                key={f._id}
                q={f.question}
                a={
                  htmlToBlocks(f.answer)
                    .map((b) => b.text)
                    .join('\n\n') || f.answer
                }
              />
            ))
          ) : (
            <EmptyState icon={HelpCircle} title="No FAQs yet" message="Can’t find an answer? Send us a message." />
          )}
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

/** Help & support: FAQ, email/phone from the dashboard (`get-contact-us`), and a message that lands in the dashboard's Feedback. */
export function SupportScreen({ navigation }: RootScreenProps<'Support'>) {
  const profile = useAppSelector(selectProfile);
  const contact = useGetSupportContactQuery();
  const [sendFeedback, { isLoading: busy }] = useSendFeedbackMutation();
  const [name, setName] = useState(profile?.name ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const email = contact.data?.email?.trim() || FALLBACK_SUPPORT_EMAIL;
  const phone = contact.data?.phone_number?.trim();

  const send = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your name';
    if (message.trim().length < 10) e.message = 'Tell us a little more (10+ characters)';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await sendFeedback({ name: name.trim(), description: message.trim() }).unwrap();
      Alert.alert('Message sent', 'Thanks for reaching out. Our team will get back to you soon.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    }
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
            <Touchable onPress={() => void Linking.openURL(`mailto:${email}`)} className="flex-1 rounded-lg border border-line bg-ink-800 p-4" accessibilityLabel={`Email support at ${email}`}>
              <Mail size={20} color={colors.brand[400]} />
              <AppText variant="title" className="mt-3">
                Email us
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {email}
              </AppText>
            </Touchable>
          </View>
          {phone ? (
            <Touchable
              onPress={() => void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}
              className="flex-row items-center rounded-lg border border-line bg-ink-800 p-4"
              accessibilityLabel={`Call support at ${phone}`}
            >
              <Phone size={18} color={colors.brand[400]} />
              <AppText variant="title" className="ml-3">
                {phone}
              </AppText>
            </Touchable>
          ) : null}
          <AppText variant="h3" className="mt-2">
            Send a message
          </AppText>
          <TextField label="Name" icon={User} value={name} onChangeText={setName} error={errors.name} editable={!busy} />
          <TextField label="How can we help?" value={message} onChangeText={setMessage} multiline maxLength={1000} error={errors.message} editable={!busy} />
          {errors.form ? (
            <AppText variant="caption" tone="live" accessibilityRole="alert">
              {errors.form}
            </AppText>
          ) : null}
          <Button label="Send message" onPress={() => void send()} loading={busy} disabled={busy} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
