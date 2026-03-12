import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (
        err.extensions?.classification === "UNAUTHORIZED" ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
        }
      }
    }
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

function createApolloClient() {
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}

let apolloClientInstance: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient();
  }
  return apolloClientInstance;
}

export function resetApolloClient() {
  if (apolloClientInstance) {
    apolloClientInstance.clearStore();
  }
  apolloClientInstance = createApolloClient();
  return apolloClientInstance;
}

export const apolloClient = createApolloClient();
