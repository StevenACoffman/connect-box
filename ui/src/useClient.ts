import { createContext, useContext, useMemo } from "react";
import { DescService } from "@bufbuild/protobuf";
import { createClient, Client, Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

const prod_base_url = "https://districts.khanacademy.systems";
const dev_base_url = 'http://localhost:8080';

// NODE_ENV is "development" for yarn start, and "production" for yarn build
// This transport is going to be used throughout the app
const defaultTransport = createConnectTransport({
    // process.env.NODE_ENV == "production" ? prod_base_url : dev_base_url,
    baseUrl: dev_base_url,
});

// A context to override the default transport in tests
export const TransportContext = createContext<Transport>(defaultTransport);

/**
 * Get a promise client for the given service.
 */
export function useClient<T extends DescService>(service: T): Client<T> {
    const transport = useContext(TransportContext);
    // We memoize the client, so that we only create one instance per service.
    return useMemo(
        () => createClient(service, transport),
        [service, transport],
    );
}