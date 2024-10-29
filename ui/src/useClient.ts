import { useMemo } from "react";
import { ServiceType } from "@bufbuild/protobuf";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createPromiseClient, PromiseClient } from "@connectrpc/connect";

const prod_base_url = "https://districts.khanacademy.systems";
const dev_base_url = 'http://localhost:8080';

// NODE_ENV is "development" for yarn start, and "production" for yarn build
// This transport is going to be used throughout the app
const transport = createConnectTransport({
    // process.env.NODE_ENV == "production" ? prod_base_url : dev_base_url,
    baseUrl: dev_base_url,
  });
/**
* Get a promise client for the given service.
*/
export function useClient<T extends ServiceType>(service: T): PromiseClient<T> {
  // We memoize the client, so that we only create one instance per service.
  return useMemo(() => createPromiseClient(service, transport), [service]);
}