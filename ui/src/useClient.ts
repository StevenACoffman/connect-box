import { createContext, useContext, useMemo } from "react";
import { DescService } from "@bufbuild/protobuf";
import { createClient, Client, Transport, Code,
    ConnectError,
    type Interceptor,
} from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

const prod_base_url = "https://play.khanacademy.systems";
const dev_base_url = 'http://localhost:8080';

const retryInterceptor: Interceptor = (next) => {
    return async (req) => {
        if (!req.stream) {
            return await next(req);
        }
        for (let i = 0; ; i++) {
            try {
                return await next(req);
            } catch (err) {
                if (i === 5) {
                    throw err;
                }
                const cErr = ConnectError.from(err);
                console.log(cErr)
                if (cErr.code !== Code.Unknown) {
                    throw err;
                }
                // Wait for a bit and retry
                let expBackoff = Math.pow(2, i);
                let maxJitter = Math.ceil(expBackoff*0.2);
                let finalBackoff = expBackoff + Math.floor(Math.random() * maxJitter);
                await new Promise((resolve) => setTimeout(resolve, 1000*finalBackoff));
                // then try again until 5th time
            }
        }
    };
};

// NODE_ENV is "development" for yarn start, and "production" for yarn build
// This transport is going to be used throughout the app
const defaultTransport = createConnectTransport({
    // process.env.NODE_ENV == "production" ? prod_base_url : dev_base_url,
    baseUrl: dev_base_url,
    interceptors: [retryInterceptor],
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
