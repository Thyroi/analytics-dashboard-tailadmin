export {};

type GtagCommand =
  | "config"
  | "event"
  | "set";

declare global {
  interface Window {
    gtag: (
      command: GtagCommand,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
