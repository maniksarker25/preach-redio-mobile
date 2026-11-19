import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { OnboardingScreen } from '@/features/auth/screens/OnboardingScreen';
import { CreateSheetScreen } from '@/features/creator/screens/CreateSheetScreen';
import { GoLiveScreen } from '@/features/creator/screens/GoLiveScreen';
import { MyPodcastsScreen } from '@/features/creator/screens/MyPodcastsScreen';
import { RecordAudioScreen } from '@/features/creator/screens/RecordAudioScreen';
import { UploadScreen } from '@/features/creator/screens/UploadScreen';
import { CategoryScreen } from '@/features/discover/screens/CategoryScreen';
import { SearchScreen } from '@/features/discover/screens/SearchScreen';
import { AddToPlaylistScreen } from '@/features/library/screens/AddToPlaylistScreen';
import { PlaylistEditorScreen } from '@/features/library/screens/PlaylistEditorScreen';
import { PlaylistScreen } from '@/features/library/screens/PlaylistScreen';
import { PlaylistsScreen } from '@/features/library/screens/PlaylistsScreen';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { AlbumScreen } from '@/features/podcasts/screens/AlbumScreen';
import { AlbumsScreen } from '@/features/podcasts/screens/AlbumsScreen';
import { AudioPlayerScreen } from '@/features/podcasts/screens/AudioPlayerScreen';
import { CommentsScreen } from '@/features/podcasts/screens/CommentsScreen';
import { PodcastDetailScreen } from '@/features/podcasts/screens/PodcastDetailScreen';
import { PodcastListScreen } from '@/features/podcasts/screens/PodcastListScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { SubscriptionScreen } from '@/features/profile/screens/SubscriptionScreen';
import { RadioPlayerScreen } from '@/features/radio/screens/RadioPlayerScreen';
import { RecordPlayerScreen } from '@/features/radio/screens/RecordPlayerScreen';
import { StationDetailScreen } from '@/features/radio/screens/StationDetailScreen';
import { StationsScreen } from '@/features/radio/screens/StationsScreen';
import { ReelsViewerScreen } from '@/features/reels/screens/ReelsScreens';
import { ChangePasswordScreen } from '@/features/settings/screens/ChangePasswordScreen';
import { ContentPageScreen, FaqScreen, SupportScreen } from '@/features/settings/screens/InfoScreens';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { useGetMyProfileQuery } from '@/store/api/authApi';
import { useAppSelector } from '@/store/hooks';
import { selectHasOnboarded, selectIsAuthenticated } from '@/store/slices/authSlice';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const player: NativeStackNavigationOptions = { presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: true };
const sheet: NativeStackNavigationOptions = { presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetCornerRadius: 28, sheetGrabberVisible: false, contentStyle: { backgroundColor: colors.ink[850] } };
const modal: NativeStackNavigationOptions = { presentation: 'modal', animation: 'slide_from_bottom' };

/**
 * Signed out → onboarding / auth. Signed in → tabs + every detail, player and
 * modal screen. Switching `session` swaps the whole tree (no back into auth).
 */
export function RootNavigator() {
  const signedIn = useAppSelector(selectIsAuthenticated);
  const hasOnboarded = useAppSelector(selectHasOnboarded);
  // Refresh the saved profile on launch; an expired session is refreshed or logged out by the base query.
  useGetMyProfileQuery(undefined, { skip: !signedIn });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.ink[900] } }}>
      {!signedIn ? (
        <>
          {!hasOnboarded ? <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} /> : null}
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ animation: 'fade' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />

          <Stack.Group>
            <Stack.Screen name="PodcastDetail" component={PodcastDetailScreen} />
            <Stack.Screen name="PodcastList" component={PodcastListScreen} />
            <Stack.Screen name="Album" component={AlbumScreen} />
            <Stack.Screen name="Albums" component={AlbumsScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Stations" component={StationsScreen} />
            <Stack.Screen name="StationDetail" component={StationDetailScreen} />
            <Stack.Screen name="Playlists" component={PlaylistsScreen} />
            <Stack.Screen name="Playlist" component={PlaylistScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Faq" component={FaqScreen} />
            <Stack.Screen name="ContentPage" component={ContentPageScreen} />
            <Stack.Screen name="MyPodcasts" component={MyPodcastsScreen} />
          </Stack.Group>

          <Stack.Group screenOptions={player}>
            <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
            <Stack.Screen name="RadioPlayer" component={RadioPlayerScreen} />
            <Stack.Screen name="RecordPlayer" component={RecordPlayerScreen} options={{ contentStyle: { backgroundColor: colors.black } }} />
            <Stack.Screen name="ReelsViewer" component={ReelsViewerScreen} options={{ contentStyle: { backgroundColor: colors.black } }} />
          </Stack.Group>

          <Stack.Group screenOptions={sheet}>
            <Stack.Screen name="Comments" component={CommentsScreen} options={{ sheetAllowedDetents: [0.75, 1] }} />
            <Stack.Screen name="AddToPlaylist" component={AddToPlaylistScreen} />
            <Stack.Screen name="CreateSheet" component={CreateSheetScreen} options={{ sheetAllowedDetents: [0.55] }} />
          </Stack.Group>

          <Stack.Group screenOptions={modal}>
            <Stack.Screen name="PlaylistEditor" component={PlaylistEditorScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="RecordAudio" component={RecordAudioScreen} />
            <Stack.Screen name="GoLive" component={GoLiveScreen} options={{ gestureEnabled: false }} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
