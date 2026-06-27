// Responsive Design Constants
export const RES = {
  // Breakpoints
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  // Responsive font sizes (mobile-first)
  fontXs: "clamp(11px, 2.5vw, 12px)",
  fontSm: "clamp(12px, 2.5vw, 13px)",
  fontBase: "clamp(13px, 3vw, 14px)",
  fontMd: "clamp(14px, 3vw, 15px)",
  fontLg: "clamp(16px, 3.5vw, 18px)",
  fontXl: "clamp(18px, 4vw, 20px)",
  font2xl: "clamp(20px, 5vw, 24px)",
  font3xl: "clamp(22px, 5.5vw, 28px)",
  font4xl: "clamp(24px, 6vw, 32px)",
  font5xl: "clamp(28px, 7vw, 48px)",
  // Responsive spacing
  spacingXs: "clamp(4px, 1vw, 6px)",
  spacingSm: "clamp(6px, 1.5vw, 8px)",
  spacingMd: "clamp(8px, 2vw, 12px)",
  spacingLg: "clamp(12px, 3vw, 16px)",
  spacingXl: "clamp(16px, 4vw, 24px)",
  spacing2xl: "clamp(20px, 5vw, 32px)",
  spacing3xl: "clamp(24px, 6vw, 48px)",
  spacing4xl: "clamp(32px, 8vw, 64px)",
};

// Helper function for responsive padding
export const getResponsivePadding = (width) => {
  if (width < RES.mobile) return "12px 16px";
  if (width < RES.tablet) return "16px 20px";
  return "20px 32px";
};

// Helper function for responsive grid columns
export const getGridCols = (width, defaultCols = 3) => {
  if (width < RES.mobile) return 1;
  if (width < RES.tablet) return 2;
  return defaultCols;
};
