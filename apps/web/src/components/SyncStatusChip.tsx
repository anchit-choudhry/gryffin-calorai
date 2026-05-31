import { Cloud, CloudOff, Loader, WifiOff } from "lucide-react";
import { useAppState } from "../state/AppState";
import { isAuthenticated } from "../lib/apiClient";
import type { SyncStatus } from "../state/slices/syncSlice";

const LABELS: Record<SyncStatus, string> = {
  idle: "Not signed in",
  syncing: "Syncing...",
  synced: "Synced",
  offline: "Offline",
  error: "Sync error",
};

export function SyncStatusChip() {
  const syncStatus = useAppState((s) => s.syncStatus);
  const lastSyncedAt = useAppState((s) => s.lastSyncedAt);

  if (!isAuthenticated()) return null;

  const label = LABELS[syncStatus];
  const title =
    syncStatus === "synced" && lastSyncedAt
      ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
      : label;

  return (
    <span
      title={title}
      aria-label={title}
      className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft select-none"
    >
      {syncStatus === "syncing" && (
        <Loader className="size-3 animate-spin text-persimmon" aria-hidden />
      )}
      {syncStatus === "synced" && <Cloud className="size-3 text-green-500" aria-hidden />}
      {syncStatus === "offline" && <WifiOff className="size-3 text-amber-500" aria-hidden />}
      {syncStatus === "error" && <CloudOff className="size-3 text-red-500" aria-hidden />}
      {label}
    </span>
  );
}
