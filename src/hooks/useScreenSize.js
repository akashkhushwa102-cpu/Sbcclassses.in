// Hook for responsive screen size detection
import { useEffect, useState } from "react";
import { RES } from "../constants/responsive.js";

export const useScreenSize = () => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < RES.mobile,
    isTablet: width >= RES.mobile && width < RES.tablet,
    isDesktop: width >= RES.tablet,
    isSmallMobile: width < 375,
    isLandscape: typeof window !== "undefined" && window.innerHeight < window.innerWidth,
  };
};
