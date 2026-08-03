import React from "react";
import { ThemeProvider } from "@providers/ThemeProvider";
import { ApolloAppProvider } from "@providers/ApolloProvider";
import { SmoothScroll } from "@components/animations/SmoothScroll";
import { ScrollProgressBar } from "@components/animations/ScrollProgressBar";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ApolloAppProvider>
      <ThemeProvider>
        <SmoothScroll>
          <ScrollProgressBar />
          {children}
        </SmoothScroll>
      </ThemeProvider>
    </ApolloAppProvider>
  );
};
