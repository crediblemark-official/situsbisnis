import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useHostname() {
    return useSyncExternalStore(
        subscribe,
        () => window.location.host,
        () => ""
    );
}
