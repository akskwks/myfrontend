import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleHelp, Info, TriangleAlert } from "lucide-react";

type DialogOptions = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogRequest = {
  kind: "alert" | "confirm";
  options: DialogOptions;
  resolve: (accepted: boolean) => void;
};

type DialogApi = {
  alert: (options: string | DialogOptions) => Promise<void>;
  confirm: (options: string | DialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogApi | null>(null);

function asOptions(value: string | DialogOptions): DialogOptions {
  return typeof value === "string" ? { message: value } : value;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<DialogRequest | null>(null);
  const activeRef = useRef<DialogRequest | null>(null);
  const queueRef = useRef<DialogRequest[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const enqueue = useCallback(
    (kind: DialogRequest["kind"], options: string | DialogOptions) =>
      new Promise<boolean>((resolve) => {
        const request = { kind, options: asOptions(options), resolve };
        if (activeRef.current) {
          queueRef.current.push(request);
        } else {
          activeRef.current = request;
          setActive(request);
        }
      }),
    [],
  );

  const finish = useCallback((accepted: boolean) => {
    const request = activeRef.current;
    if (!request) return;
    activeRef.current = queueRef.current.shift() ?? null;
    setActive(activeRef.current);
    request.resolve(accepted);
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: async (options) => {
        await enqueue("alert", options);
      },
      confirm: (options) => enqueue("confirm", options),
    }),
    [enqueue],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    dialog.showModal();
    (active.kind === "confirm" ? cancelRef : confirmRef).current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [active]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        className="app-dialog"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        onCancel={(event) => {
          event.preventDefault();
          finish(false);
        }}
      >
        {active && (
          <>
            <div
              className={`app-dialog-icon${active.options.destructive ? " is-danger" : ""}`}
              aria-hidden="true"
            >
              {active.options.destructive ? (
                <TriangleAlert size={23} />
              ) : active.kind === "confirm" ? (
                <CircleHelp size={23} />
              ) : (
                <Info size={23} />
              )}
            </div>
            <h2 id="app-dialog-title">
              {active.options.title ??
                (active.kind === "confirm" ? "확인해 주세요" : "안내")}
            </h2>
            <p id="app-dialog-message">{active.options.message}</p>
            <div className="app-dialog-actions">
              {active.kind === "confirm" && (
                <button
                  ref={cancelRef}
                  className="secondary-button"
                  type="button"
                  onClick={() => finish(false)}
                >
                  {active.options.cancelLabel ?? "취소"}
                </button>
              )}
              <button
                ref={confirmRef}
                className={`primary-button${active.options.destructive ? " is-danger" : ""}`}
                type="button"
                onClick={() => finish(true)}
              >
                {active.options.confirmLabel ?? "확인"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error("AppDialogProvider is missing.");
  return dialog;
}
