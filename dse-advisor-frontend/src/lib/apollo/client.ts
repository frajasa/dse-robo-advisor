import { ApolloClient, InMemoryCache, HttpLink, from, Observable } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

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

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (!refreshToken) return null;

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || "/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token refreshToken userId email fullName
          }
        }`,
        variables: { refreshToken },
      }),
    });
    const json = await response.json();
    const data = json?.data?.refreshToken;
    if (data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.token;
    }
  } catch {
    // Refresh failed
  }
  return null;
}

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (CombinedGraphQLErrors.is(error)) {
    const unauthorized = error.errors.some(
      (err) =>
        err.extensions?.classification === "UNAUTHORIZED" ||
        err.message?.toLowerCase().includes("unauthorized")
    );

    if (unauthorized && typeof window !== "undefined") {
      return new Observable((observer) => {
        attemptTokenRefresh()
          .then((newToken) => {
            if (newToken) {
              operation.setContext(({ headers = {} }: Record<string, Record<string, string>>) => ({
                headers: {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                },
              }));
              forward(operation).subscribe(observer);
            } else {
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              window.location.href = "/auth/login";
              observer.complete();
            }
          })
          .catch(() => {
            observer.complete();
          });
      });
    }
  } else {
    console.error(`[Network error]: ${error}`);
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

let apolloClientInstance: ApolloClient | null = null;

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
