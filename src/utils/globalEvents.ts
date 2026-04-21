import type { AlertOptions } from "../context/AlertContext";

type AlertListener = (options: AlertOptions) => void;
type UnauthorizedListener = () => void;

class GlobalEvents {
    private alertListeners: Set<AlertListener> = new Set();
    private unauthorizedListeners: Set<UnauthorizedListener> = new Set();

    onAlert(listener: AlertListener): () => void {
        this.alertListeners.add(listener);
        return () => {
            this.alertListeners.delete(listener);
        };
    }

    emitAlert(options: AlertOptions) {
        this.alertListeners.forEach((listener) => listener(options));
    }

    onUnauthorized(listener: UnauthorizedListener): () => void {
        this.unauthorizedListeners.add(listener);
        return () => {
            this.unauthorizedListeners.delete(listener);
        };
    }

    emitUnauthorized() {
        this.unauthorizedListeners.forEach((listener) => listener());
    }
}

export const globalEvents = new GlobalEvents();
