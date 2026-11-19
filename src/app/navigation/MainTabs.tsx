import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { FavoriteScreen } from '@/features/library/screens/FavoriteScreen';
import { HistoryScreen } from '@/features/library/screens/HistoryScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { useIsCreator } from '@/store/sessionStore';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Placeholder for the creator "+" tab; pressing it opens the create sheet instead. */
const Empty = () => <View />;

/** Same tabs as Flutter: listener → Home · History · Favorite · Profile; creator adds "+" in the middle. */
export function MainTabs() {
  const isCreator = useIsCreator();
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, lazy: true }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      {isCreator ? <Tab.Screen name="Create" component={Empty} /> : null}
      <Tab.Screen name="Favorite" component={FavoriteScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
