import { colors, fonts, radius } from './tokens';

export { colors, fonts, radius };

/** 4-point spacing scale for values that can't be expressed as classes. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

/** Horizontal page gutter — the Flutter app pads screens by 12. */
export const GUTTER = spacing.md;

export const ratios = {
  square: 1,
  video: 16 / 9,
  portrait: 9 / 16,
  banner: 2,
} as const;

/** Soft drop shadow for floating surfaces (banner cards, mini-player). */
export const shadow = {
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  glow: {
    shadowColor: colors.live,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;
