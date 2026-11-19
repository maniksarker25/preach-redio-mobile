import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { PodcastQuery } from '@/services/repositories';
import type { ContentPageKey, PodcastMediaType } from '@/types/models';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  VerifyCode: { email: string; purpose: 'signup' | 'reset'; role?: 'user' | 'creator' };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  /** Creators only: opens the create sheet, never shown as a screen. */
  Create: undefined;
  Favorite: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;

  // Podcasts
  PodcastDetail: { id: string };
  AudioPlayer: undefined;
  PodcastList: { title: string; subtitle?: string; query: PodcastQuery };
  Album: { id: string };
  Albums: undefined;
  Category: { id: string };
  Comments: { podcastId: string };
  Search: undefined;

  // Clips & recordings
  ReelsViewer: { startId: string; ids?: string[] };
  RecordPlayer: { roomId: string };

  // Radio
  Stations: undefined;
  StationDetail: { id: string };
  RadioPlayer: undefined;

  // Library
  Playlist: { id: string };
  PlaylistEditor: { id?: string; addPodcastId?: string };
  AddToPlaylist: { podcastId: string };
  Playlists: undefined;

  // Account
  EditProfile: undefined;
  Notifications: undefined;
  Subscription: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Support: undefined;
  Faq: undefined;
  ContentPage: { key: ContentPageKey };

  // Creator studio
  CreateSheet: undefined;
  MyPodcasts: undefined;
  Upload: { mediaType: PodcastMediaType; recording?: { uri: string; durationSeconds: number } };
  RecordAudio: undefined;
  GoLive: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AuthScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
