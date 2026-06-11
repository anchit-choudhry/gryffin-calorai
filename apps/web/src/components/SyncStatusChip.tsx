import { Cloud, CloudOff, HardDrive, Loader, WifiOff } from "lucide-react";
import { useAppState } from "../state/AppState";
import { isAuthenticated } from "../lib/apiClient";
import type { SyncStatus } from "../state/slices/syncSlice";

const BASE_LABELS: Record<SyncStatus, string> = {
  idle: "Not signed in",
  syncing: "Syncing",
  synced: "Synced",
  offline: "Offline",
  error: "Sync error",
};

const CHIP_CLS =
  "hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft select-none";

export function SyncStatusChip() {
  const syncStatus = useAppState((s) => s.syncStatus);
  const lastSyncedAt = useAppState((s) => s.lastSyncedAt);
  const pendingSyncCount = useAppState((s) => s.pendingSyncCount);

  if (!isAuthenticated()) {
    return (
      <span className={CHIP_CLS} aria-label="Data saved locally">
        <HardDrive className="size-3 text-ink-soft/60" aria-hidden={true} />
        Saved locally
      </span>
    );
  }

  const baseLabel = BASE_LABELS[syncStatus];
  const label =
    syncStatus === "syncing" && pendingSyncCount > 0
      ? `${baseLabel} (${pendingSyncCount})`
      : baseLabel;
  const title =
    syncStatus === "synced" && lastSyncedAt
      ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
      : label;

  return (
    <span title={title} aria-label={title} className={CHIP_CLS}>
      {syncStatus === "syncing" && (
        <Loader className="size-3 animate-spin text-persimmon" aria-hidden={true} />
      )}
      {syncStatus === "synced" && <Cloud className="size-3 text-green-500" aria-hidden={true} />}
      {syncStatus === "offline" && <WifiOff className="size-3 text-amber-500" aria-hidden={true} />}
      {syncStatus === "error" && <CloudOff className="size-3 text-red-500" aria-hidden={true} />}
      {label}
    </span>
  );
}
