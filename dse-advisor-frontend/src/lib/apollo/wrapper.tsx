"use client";

import React, { useCallback, useMemo } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const makeClient = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8060/graphql",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  }, []);

  const client = useMemo(() => makeClient(), [makeClient]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
