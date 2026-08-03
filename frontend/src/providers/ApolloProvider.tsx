import React from "react";
import { ApolloProvider as BaseApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@config/apollo";

export function ApolloAppProvider({ children }: { children: React.ReactNode }) {
  return <BaseApolloProvider client={apolloClient as any}>{children}</BaseApolloProvider>;
}

export { ApolloAppProvider as ApolloProvider };
