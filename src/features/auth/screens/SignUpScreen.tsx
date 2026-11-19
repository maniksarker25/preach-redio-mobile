import { Check, Headphones, Lock, Mail, MapPin, Mic2, Phone, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import type { AuthScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { DateField } from '@/components/common/DateField';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { useRegisterMutation } from '@/store/api/authApi';
import { colors } from '@/theme';
import type { Gender } from '@/types/models';
import { getErrorMessage } from '@/utils/apiError';
import { AuthLayout } from '../components/AuthLayout';
import { FormError } from '../components/FormError';
import { isEmail, passwordError } from '../validation';

type Role = 'user' | 'creator';
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
/** Latest allowed date of birth (at least 5 years old). */
const MAX_DOB = new Date(new Date().getFullYear() - 5, 11, 31);

/** Listener / Creator choice card with an icon bubble and a check when selected. */
const RoleCard = ({ icon: Icon, title, body, selected, onPress }: { icon: LucideIcon; title: string; body: string; selected: boolean; onPress: () => void }) => (
  <Touchable
    haptic
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={title}
    style={{
      flex: 1,
      borderRadius: 16,
      padding: 14,
      backgroundColor: selected ? 'rgba(230,167,168,0.10)' : colors.ink[800],
      borderWidth: 1.5,
      borderColor: selected ? 'rgba(230,167,168,0.7)' : 'rgba(255,255,255,0.06)',
    }}
  >
    <View className="flex-row items-start justify-between">
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: selected ? 'rgba(230,167,168,0.18)' : 'rgba(255,255,255,0.06)' }}>
        <Icon size={19} color={selected ? colors.brand[300] : colors.text.secondary} />
      </View>
      <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: selected ? colors.brand[400] : 'transparent', borderWidth: selected ? 0 : 1.5, borderColor: 'rgba(255,255,255,0.2)' }}>
        {selected ? <Check size={12} color={colors.black} strokeWidth={3} /> : null}
      </View>
    </View>
    <AppText variant="title" className="mt-3 text-[16px]">
      {title}
    </AppText>
    <AppText variant="caption" tone="muted" className="mt-0.5">
      {body}
    </AppText>
  </Touchable>
);

/** Segmented gender picker. */
const GenderPicker = ({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) => (
  <View>
    <AppText variant="label" tone="muted" className="mb-1.5 text-[13px]">
      Gender
    </AppText>
    <View className="flex-row rounded-[14px] p-1" style={{ backgroundColor: colors.ink[800], borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }} accessibilityRole="radiogroup">
      {GENDERS.map((g) => {
        const on = g === value;
        return (
          <Touchable
            key={g}
            haptic
            onPress={() => onChange(g)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={{ flex: 1, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.white : 'transparent' }}
          >
            <AppText variant="label" tone={on ? 'inverse' : 'secondary'}>
              {g}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  </View>
);

/** Two-segment progress bar. */
const Progress = ({ step }: { step: 1 | 2 }) => (
  <View className="flex-row gap-1.5" accessibilityLabel={`Step ${step} of 2`}>
    {[1, 2].map((i) => (
      <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.brand[400] : 'rgba(255,255,255,0.1)' }} />
    ))}
  </View>
);

/**
 * `/user/register-user` in two short steps:
 * 1 · account (role, name, email, password) · 2 · about you (phone, address, birthday, gender).
 * Sends the same fields as the Flutter app; a 6-digit code is then emailed.
 */
export function SignUpScreen({ navigation }: AuthScreenProps<'SignUp'>) {
  const [register, { isLoading, error, reset }] = useRegisterMutation();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<Gender>('Male');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const clear = (key: string) => {
    setErrors((x) => ({ ...x, [key]: undefined }));
    reset();
  };

  const next = () => {
    const e = {
      name: name.trim() ? undefined : 'Enter your name',
      email: isEmail(email) ? undefined : 'Enter a valid email',
      password: passwordError(password),
      confirm: confirm === password ? undefined : 'Passwords don’t match',
    };
    setErrors(e);
    if (!Object.values(e).some(Boolean)) setStep(2);
  };

  const submit = async () => {
    const e = { address: address.trim() ? undefined : 'Enter your address', dob: dob ? undefined : 'Select your date of birth' };
    setErrors(e);
    if (e.address || e.dob || !dob) return;
    try {
      const res = await register({ name, email, phone, address, role, gender, password, dateOfBirth: dob.toISOString() }).unwrap();
      navigation.navigate('VerifyCode', { email: res.email, purpose: 'signup' });
    } catch (err) {
      // The email is checked on submit; send them back to fix it.
      if (/email/i.test(getErrorMessage(err))) setStep(1);
    }
  };

  const footer = (
    <View className="flex-row items-center">
      <AppText variant="bodySm" tone="muted">
        Already have an account?{' '}
      </AppText>
      <Touchable onPress={() => navigation.navigate('Login')} accessibilityLabel="Log in">
        <AppText variant="label" tone="brand">
          Log In
        </AppText>
      </Touchable>
    </View>
  );

  return (
    <AuthLayout
      eyebrow={`Step ${step} of 2`}
      title={step === 1 ? 'Create your account' : 'A little about you'}
      subtitle={step === 1 ? 'Listen, watch and share messages that matter.' : 'This helps us personalise Preach Radio for you.'}
      onBack={step === 2 ? () => setStep(1) : undefined}
      footer={footer}
    >
      <Progress step={step} />
      {error ? <FormError message={getErrorMessage(error)} /> : null}

      {step === 1 ? (
        <Animated.View key="step1" entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(160)} style={{ gap: 16 }}>
          <View className="flex-row gap-3" accessibilityRole="radiogroup">
            <RoleCard icon={Headphones} title="Listener" body="Listen, watch & save" selected={role === 'user'} onPress={() => setRole('user')} />
            <RoleCard icon={Mic2} title="Creator" body="Share & go live" selected={role === 'creator'} onPress={() => setRole('creator')} />
          </View>
          {role === 'creator' ? (
            <AppText variant="caption" tone="muted">
              Creator accounts are reviewed by our team before you can publish.
            </AppText>
          ) : null}
          <TextField variant="filled" label="Full name" placeholder="Your name" icon={User} value={name} onChangeText={(t) => { setName(t); clear('name'); }} autoCapitalize="words" autoComplete="name" error={errors.name} />
          <TextField variant="filled" label="Email" placeholder="you@example.com" icon={Mail} value={email} onChangeText={(t) => { setEmail(t); clear('email'); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
          <TextField variant="filled" label="Password" placeholder="At least 6 characters" icon={Lock} value={password} onChangeText={(t) => { setPassword(t); clear('password'); }} password autoComplete="new-password" error={errors.password} />
          <TextField variant="filled" label="Confirm password" placeholder="Repeat your password" icon={Lock} value={confirm} onChangeText={(t) => { setConfirm(t); clear('confirm'); }} password error={errors.confirm} onSubmitEditing={next} />
          <Button label="Continue" onPress={next} size="lg" className="mt-2 rounded-[14px]" />
        </Animated.View>
      ) : (
        <Animated.View key="step2" entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(160)} style={{ gap: 16 }}>
          <TextField variant="filled" label="Phone (optional)" placeholder="+1 555 000 0000" icon={Phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          <TextField variant="filled" label="Address" placeholder="City, Country" icon={MapPin} value={address} onChangeText={(t) => { setAddress(t); clear('address'); }} error={errors.address} />
          <DateField variant="filled" label="Date of birth" value={dob} onChange={(d) => { setDob(d); clear('dob'); }} maximumDate={MAX_DOB} error={errors.dob} />
          <GenderPicker value={gender} onChange={setGender} />
          <Button label="Create account" onPress={submit} loading={isLoading} size="lg" className="mt-2 rounded-[14px]" />
          <AppText variant="caption" tone="faint" className="text-center">
            By creating an account you agree to our Terms and Privacy Policy.
          </AppText>
        </Animated.View>
      )}
    </AuthLayout>
  );
}
