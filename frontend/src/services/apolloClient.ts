import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { env } from "../config/env";

const httpLink = createHttpLink({
  uri: env.GRAPHQL_URL,
});

const authLink = setContext((_: any, { headers }: any) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("roombae_access_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          residents: {
            merge(_: any, incoming: any) {
              return incoming;
            },
          },
          complaints: {
            merge(_: any, incoming: any) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
