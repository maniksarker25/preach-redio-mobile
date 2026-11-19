import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 64;

/**
 * Bottom padding for scroll content. Inside the tabs the bar (and the
 * mini-player above it) sit in normal layout flow, so only a small gap is
 * needed; stack screens also clear the home indicator.
 */
export const useBottomSpace = (inTabs = true) => {
  const insets = useSafeAreaInsets();
  return inTabs ? 24 : insets.bottom + 24;
};
