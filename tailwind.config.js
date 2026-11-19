const { colors, fonts, radius } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.ts', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        ink: colors.ink,
        fg: colors.text,
        live: colors.live,
        gold: colors.gold,
        success: colors.success,
        danger: colors.danger,
        line: colors.line,
        'line-strong': colors.lineStrong,
        scrim: colors.scrim,
      },
      fontFamily: {
        regular: [fonts.regular],
        medium: [fonts.medium],
        semibold: [fonts.semibold],
        bold: [fonts.bold],
        extrabold: [fonts.extrabold],
      },
      borderRadius: {
        xs: `${radius.xs}px`,
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        '2xl': `${radius['2xl']}px`,
      },
    },
  },
  plugins: [],
};
