import { Headphones, Lock, Mail, Mic2, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { repositories } from '@/services/repositories';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';
import { AuthLayout } from '../components/AuthLayout';
import { isEmail, useAuthAction } from '../hooks/useAuthAction';

type Role = 'user' | 'creator';

const RoleCard = ({ icon: Icon, title, body, selected, onPress }: { icon: LucideIcon; title: string; body: string; selected: boolean; onPress: () => void }) => (
  <Touchable
    haptic
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    className={cn('flex-1 rounded-lg border-2 p-4', selected ? 'border-brand-500 bg-brand-500/10' : 'border-line-strong bg-ink-800')}
  >
    <Icon size={22} color={selected ? colors.brand[400] : colors.text.muted} />
    <AppText variant="title" className="mt-3">
      {title}
    </AppText>
    <AppText variant="caption" tone="muted" className="mt-0.5">
      {body}
    </AppText>
  </Touchable>
);

/** `/user/register-user` → email OTP → signed in. Creators wait for admin approval to publish. */
export function SignUpScreen({ navigation }: AuthScreenProps<'SignUp'>) {
  const [role, setRole] = useState<Role>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { busy, error, run } = useAuthAction();

  const submit = async () => {
    const e = {
      name: name.trim() ? undefined : 'Enter your name',
      email: isEmail(email) ? undefined : 'Enter a valid email',
      password: password.length >= 8 ? undefined : 'Use at least 8 characters',
    };
    setErrors(e);
    if (e.name || e.email || e.password) return;
    const res = await run(() => repositories.auth.register({ name: name.trim(), email: email.trim(), password, role }));
    if (res) navigation.navigate('VerifyCode', { email: res.email, purpose: 'signup', role });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join a community of listeners, preachers and stations."
      footer={
        <View className="flex-row items-center">
          <AppText variant="bodySm" tone="muted">
            Already have an account?{' '}
          </AppText>
          <Touchable onPress={() => navigation.navigate('Login')}>
            <AppText variant="label" tone="brand">
              Sign in
            </AppText>
          </Touchable>
        </View>
      }
    >
      <View className="flex-row gap-3" accessibilityRole="radiogroup">
        <RoleCard icon={Headphones} title="Listener" body="Listen, watch and save" selected={role === 'user'} onPress={() => setRole('user')} />
        <RoleCard icon={Mic2} title="Creator" body="Share messages, go live" selected={role === 'creator'} onPress={() => setRole('creator')} />
      </View>
      {role === 'creator' ? (
        <AppText variant="caption" tone="muted">
          Creator accounts are reviewed by our team before you can publish.
        </AppText>
      ) : null}
      <TextField label="Full name" icon={User} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" error={errors.name} />
      <TextField label="Email" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <TextField label="Password" icon={Lock} value={password} onChangeText={setPassword} password autoComplete="new-password" hint="At least 8 characters" error={errors.password ?? error} />
      <Button label="Create account" onPress={submit} loading={busy} size="lg" className="mt-2" />
      <AppText variant="caption" tone="faint" className="text-center">
        By continuing you agree to our Terms and Privacy Policy.
      </AppText>
    </AuthLayout>
  );
}
