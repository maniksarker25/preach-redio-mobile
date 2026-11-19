import { Camera, Mail, MapPin, Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useSessionStore } from '@/store/sessionStore';
import { colors, GUTTER } from '@/theme';
import type { Gender } from '@/types/models';
import { pickImage } from '@/utils/pickers';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

/** Profile form mirroring `normalUser` fields (`/normal-user/update-profile`). */
export function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const profile = useSessionStore((s) => s.session?.profile);
  const updateProfile = useSessionStore((s) => s.updateProfile);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [gender, setGender] = useState<Gender | undefined>(profile?.gender);
  const [image, setImage] = useState(profile?.profile_image);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const changePhoto = async () => {
    const picked = await pickImage();
    if (picked) setImage(picked.uri);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500)); // mock request
    updateProfile({ name: name.trim(), phone: phone.trim(), address: address.trim(), gender, profile_image: image });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScreenHeader title="Edit profile" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View className="mb-8 items-center">
            <Touchable onPress={changePhoto} accessibilityLabel="Change profile photo">
              <Avatar uri={image} name={name || 'You'} size={112} ring />
              <View className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-ink-900 bg-white">
                <Camera size={16} color={colors.black} />
              </View>
            </Touchable>
            <AppText variant="caption" tone="muted" className="mt-3">
              Tap to change photo
            </AppText>
          </View>

          <View className="gap-5">
            <TextField label="Full name" icon={User} value={name} onChangeText={(t) => { setName(t); setError(undefined); }} error={error} autoCapitalize="words" />
            <TextField label="Email" icon={Mail} value={profile?.email} editable={false} hint="Email can’t be changed" />
            <TextField label="Phone" icon={Phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField label="Location" icon={MapPin} value={address} onChangeText={setAddress} placeholder="City, Country" />
            <View>
              <AppText variant="label" tone="secondary" className="mb-2">
                Gender
              </AppText>
              <View className="flex-row gap-2">
                {GENDERS.map((g) => (
                  <Chip key={g.key} label={g.label} selected={gender === g.key} onPress={() => setGender(g.key)} />
                ))}
              </View>
            </View>
          </View>

          <Button label="Save changes" onPress={save} loading={saving} size="lg" className="mt-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
