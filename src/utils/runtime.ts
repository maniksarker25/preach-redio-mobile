import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';

/**
 * True in a dev / store build made with our config plugins; false in Expo Go.
 * Background playback and lock-screen controls need native services that only such builds declare.
 * Two checks because `executionEnvironment` alone has not been reliable across Expo Go versions.
 */
export const IS_NATIVE_BUILD = !isRunningInExpoGo() && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && Constants.appOwnership !== 'expo';
