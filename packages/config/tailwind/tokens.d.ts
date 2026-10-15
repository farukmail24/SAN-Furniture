export interface BrandColors {
  navy: {
    950: string;
    900: string;
    800: string;
    700: string;
    600: string;
    50: string;
  };
  sand: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
  };
  brass: {
    400: string;
    500: string;
    600: string;
    700: string;
  };
  sage: {
    50: string;
    600: string;
    700: string;
    800: string;
  };
}

export interface BrandTokens {
  colors: BrandColors;
  fontFamily: {
    display: string[];
    sans: string[];
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  boxShadow: {
    ambient: string;
    card: string;
    elevation: string;
    drawer: string;
  };
}

export declare const brandTokens: BrandTokens;
export default brandTokens;
