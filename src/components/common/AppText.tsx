import { memo } from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '@/utils/podcast';

const variants = {
  display: 'font-bold text-[28px] leading-[34px]',
  h1: 'font-bold text-[24px] leading-[30px]',
  h2: 'font-bold text-[22px] leading-[28px]',
  h3: 'font-bold text-[17px] leading-[22px]',
  title: 'font-semibold text-[15px] leading-[20px]',
  body: 'font-semibold text-[15px] leading-[22px]',
  bodySm: 'font-medium text-[14px] leading-[19px]',
  label: 'font-semibold text-[14px] leading-[18px]',
  caption: 'font-medium text-[12px] leading-[16px]',
  overline: 'font-bold text-[11px] leading-[14px] tracking-[1px] uppercase',
} as const;

const tones = {
  primary: 'text-fg-primary',
  secondary: 'text-fg-secondary',
  muted: 'text-fg-muted',
  faint: 'text-fg-faint',
  brand: 'text-brand-400',
  inverse: 'text-fg-inverse',
  gold: 'text-gold',
  live: 'text-live',
  white: 'text-white',
} as const;

export type TextVariant = keyof typeof variants;
export type TextTone = keyof typeof tones;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

/** Typography primitive — every string in the app renders through this. */
export const AppText = memo(function AppText({ variant = 'body', tone = 'primary', className, ...rest }: AppTextProps) {
  return <Text {...rest} className={cn(variants[variant], tones[tone], className)} />;
});
