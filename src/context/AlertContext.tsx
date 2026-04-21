import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import CustomAlert from "../components/common/CustomAlert";
import { globalEvents } from "../utils/globalEvents";

export type AlertType = "info" | "success" | "danger";

export interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    showCancelButton?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
}

interface AlertContextValue {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
    confirm: (options: Omit<AlertOptions, "showCancelButton">) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

interface InternalState extends AlertOptions {
    visible: boolean;
}

const initialState: InternalState = {
    visible: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancelButton: false,
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<InternalState>(initialState);
    const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

    const hideAlert = useCallback(() => {
        setState((prev) => ({ ...prev, visible: false }));
    }, []);

    const showAlert = useCallback((options: AlertOptions) => {
        setState({
            visible: true,
            title: options.title,
            message: options.message,
            type: options.type ?? "info",
            confirmText: options.confirmText ?? "Tamam",
            cancelText: options.cancelText ?? "İptal",
            showCancelButton: options.showCancelButton ?? false,
            onConfirm: options.onConfirm,
            onCancel: options.onCancel,
        });
    }, []);

    const confirm = useCallback(
        (options: Omit<AlertOptions, "showCancelButton">) => {
            return new Promise<boolean>((resolve) => {
                confirmResolverRef.current = resolve;
                setState({
                    visible: true,
                    title: options.title,
                    message: options.message,
                    type: options.type ?? "info",
                    confirmText: options.confirmText ?? "Evet",
                    cancelText: options.cancelText ?? "İptal",
                    showCancelButton: true,
                    onConfirm: undefined,
                    onCancel: undefined,
                });
            });
        },
        []
    );

    const handleConfirm = useCallback(async () => {
        const callback = state.onConfirm;
        const resolver = confirmResolverRef.current;
        hideAlert();
        if (resolver) {
            confirmResolverRef.current = null;
            resolver(true);
        }
        await callback?.();
    }, [state.onConfirm, hideAlert]);

    const handleCancel = useCallback(async () => {
        const callback = state.onCancel;
        const resolver = confirmResolverRef.current;
        hideAlert();
        if (resolver) {
            confirmResolverRef.current = null;
            resolver(false);
        }
        await callback?.();
    }, [state.onCancel, hideAlert]);

    useEffect(() => {
        const unsubscribe = globalEvents.onAlert((options) => {
            showAlert(options);
        });
        return unsubscribe;
    }, [showAlert]);

    const value = useMemo(
        () => ({ showAlert, hideAlert, confirm }),
        [showAlert, hideAlert, confirm]
    );

    return (
        <AlertContext.Provider value={value}>
            {children}
            <CustomAlert
                visible={state.visible}
                title={state.title}
                message={state.message}
                type={state.type}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                showCancelButton={state.showCancelButton}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </AlertContext.Provider>
    );
}

export function useAlert(): AlertContextValue {
    const ctx = useContext(AlertContext);
    if (!ctx) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return ctx;
}
