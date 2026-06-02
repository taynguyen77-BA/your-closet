import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'DM Sans',
  medium: 'DM Sans',
  semibold: 'DM Sans',
  bold: 'DM Sans',
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: 'DM Serif Display',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 0.96,
    lineHeight: 30,
  },
  h1: {
    fontFamily: 'DM Serif Display',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  h2: {
    fontFamily: 'DM Serif Display',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.8,
    lineHeight: 26,
  },
  h3: {
    fontFamily: 'DM Serif Display',
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 0.68,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
};
