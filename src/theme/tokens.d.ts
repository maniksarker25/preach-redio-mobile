type Scale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

export declare const colors: {
  brand: Scale;
  ink: Record<950 | 900 | 850 | 800 | 700 | 600 | 500, string>;
  text: { primary: string; secondary: string; muted: string; faint: string; inverse: string };
  live: string;
  gold: string;
  success: string;
  warning: string;
  danger: string;
  line: string;
  lineStrong: string;
  scrim: string;
  white: string;
  black: string;
  transparent: string;
};

export declare const fonts: {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  extrabold: string;
};

export declare const radius: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number>;
