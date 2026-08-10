import React from "react";
import { ThemeProvider } from "@providers/ThemeProvider";
import { AuthProvider } from "@providers/AuthProvider";
import { SmoothScroll } from "@components/animations/SmoothScroll";
import { ScrollProgressBar } from "@components/animations/ScrollProgressBar";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SmoothScroll>
          <ScrollProgressBar />
          {children}
        </SmoothScroll>
      </AuthProvider>
    </ThemeProvider>
  );
};
