/**
 * Design tokens — the single source of truth for colour, radius and type.
 * Plain CommonJS so tailwind.config.js and TypeScript code read the same values.
 *
 * Values follow the existing Flutter app (lib/utils/app_colors, core/theme/dark_theme):
 * charcoal background #1E2122, #2A2B31 surfaces, #151619 navigation bar,
 * soft pink accent #E6A7A8, red for live / progress, Roboto + Roboto Condensed.
 */
const colors = {
  /** Accent — Flutter `primaryColor` (#E6A7A8) and its tints/shades. */
  brand: {
    50: '#FCF4F4',
    100: '#F8E4E4',
    200: '#F2CDCE',
    300: '#ECBABB',
    400: '#E6A7A8',
    500: '#DC8F91',
    600: '#C97376',
    700: '#A9585C',
    800: '#7F4044',
    900: '#552B2E',
  },
  ink: {
    950: '#000000', // players, reels
    900: '#1E2122', // app background (Flutter blackColor)
    850: '#151619', // bottom navigation, sheets
    800: '#2A2B31', // cards, search box, category tiles
    700: '#34353B', // raised / pressed
    600: '#43444B', // borders on raised, inputs
    500: '#5A5B63',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B9BABD', // ~70% white
    muted: '#8E8F94', // ~55% white
    faint: '#706666', // Flutter hintTextColor
    inverse: '#000000',
  },
  live: '#F44336', // Flutter Colors.red — live badges, progress
  gold: '#F6B545', // subscription
  success: '#4CAF50',
  warning: '#F6B545',
  danger: '#F44336',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
  scrim: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/** The Flutter app's fonts: Roboto Condensed SemiBold is its default face. */
const fonts = {
  regular: 'Roboto-Regular',
  medium: 'RobotoCondensed-Regular',
  semibold: 'RobotoCondensed-SemiBold',
  bold: 'Roboto-Bold',
  extrabold: 'Roboto-Bold',
};

const radius = {
  xs: 5,
  sm: 8,
  md: 12,
  lg: 12,
  xl: 16,
  '2xl': 24,
};

module.exports = { colors, fonts, radius };
