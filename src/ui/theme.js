export const UI_THEME = {
  fontFamily: 'Inter, Arial',
  fontWeight: {
    regular: '400',
    medium: '600',
    bold: '700'
  },
  colors: {
    overlay: { color: 0x000000, alpha: 0.85 },
    panelBg: 0x1b2436,
    panelStroke: 0x3498db,
    textPrimary: '#ffffff',
    textSubtle: '#bcd7ff',
    textAccent: '#9ee4ff',
    accentStrong: '#2f8cc9',
    success: 0x2ecc71,
    primary: 0x2f8cc9,
    neutral: 0x95a5a6,
    danger: 0xff5370
  },
  buttons: {
    width: 240,
    height: 64,
    radius: 16,
    hoverScale: 1.04,
    pressScale: 0.96,
    variants: {
      primary: { fill: 0x2f8cc9, text: '#ffffff' },
      success: { fill: 0x2ecc71, text: '#ffffff' },
      neutral: { fill: 0x95a5a6, text: '#ffffff' },
      danger: { fill: 0xff5370, text: '#ffffff' }
    }
  },
  spacing: {
    section: 48,
    block: 32,
    element: 18
  }
};
