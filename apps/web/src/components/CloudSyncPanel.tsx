import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, CloudOff, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api, clearTokens, isAuthenticated } from "../lib/apiClient";
import { activateE2E } from "../hooks/useSyncService";
import { deriveKey, decryptBlob } from "../lib/e2eEncryption";
import { setE2EKey, clearE2EKey } from "../lib/e2eKeyStore";
import { useAppState } from "../state/AppState";
import { cn, EDITORIAL_INPUT_CLS, SERIF_TITLE_CLS } from "../lib/utils";
import type { UserId } from "../types";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function CloudSyncPanel() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [loading, setLoading] = useState(false);
  const syncStatus = useAppState((s) => s.syncStatus);
  const lastSyncedAt = useAppState((s) => s.lastSyncedAt);
  const e2eEnabled = useAppState((s) => s.e2eEnabled);
  const e2eKeyReady = useAppState((s) => s.e2eKeyReady);
  const setE2EEnabled = useAppState((s) => s.setE2EEnabled);
  const setE2EKeyReady = useAppState((s) => s.setE2EKeyReady);
  const userId = useAppState((s) => s.userId);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [isActivating, setIsActivating] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | undefined>(undefined);
  const [passphraseInput, setPassphraseInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [setupError, setSetupError] = useState<string | undefined>(undefined);

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    setLoading(true);
    try {
      await api.auth.exchangeToken("google", response.credential);
      setAuthed(true);
      toast.success("Signed in - syncing your data...");
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.length > 0 && msg.length <= 120 ? msg : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || authed || !googleBtnRef.current) return;

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => void handleCredential(res),
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "sign_in_with",
          shape: "rectangular",
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => void handleCredential(res),
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "sign_in_with",
        shape: "rectangular",
      });
    };
    document.head.appendChild(script);
  }, [googleClientId, authed, handleCredential]);

  // On mount (authenticated), check if E2E is configured server-side.
  useEffect(() => {
    if (!isAuthenticated()) return;
    void api
      .get<{ salt: string }>("/api/v1/sync/e2e-config")
      .then(() => {
        setE2EEnabled(true);
      })
      .catch(() => {
        // 404 = E2E not configured; leave e2eEnabled as false
      });
  }, [setE2EEnabled]);

  // Clear key from memory when the panel unmounts.
  useEffect(() => {
    return () => {
      clearE2EKey();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch {
      clearTokens();
    } finally {
      toast.success("Signed out");
      window.location.reload();
    }
  }, []);

  const handleSyncNow = useCallback(() => {
    window.dispatchEvent(new CustomEvent("gc:sync"));
  }, []);

  const handleSetup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) return;
      if (passphraseInput !== confirmInput) {
        setSetupError("Passphrases do not match");
        return;
      }
      setSetupError(undefined);
      setIsActivating(true);
      try {
        await activateE2E(userId as UserId, passphraseInput);
        setPassphraseInput("");
        setConfirmInput("");
        toast.success("Encryption enabled");
      } catch {
        toast.error("Failed to enable encryption - please try again");
      } finally {
        setIsActivating(false);
      }
    },
    [passphraseInput, confirmInput, userId],
  );

  const handleUnlock = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUnlocking(true);
      setUnlockError(undefined);
      try {
        const saltDto = await api.get<{ salt: string }>("/api/v1/sync/e2e-config");
        const saltBytes = Uint8Array.from(atob(saltDto.salt), (c) => c.charCodeAt(0));
        const key = await deriveKey(passphraseInput, saltBytes);
        // Fetch one blob to validate the key
        const blobs = await api.get<
          Array<{
            iv: string;
            ciphertext: string;
            clientBlobId: string;
            isDeleted: boolean;
          }>
        >("/api/v1/sync/blobs?since=1970-01-01T00:00:00Z&limit=1");
        const firstBlob = blobs[0];
        if (firstBlob !== undefined && !firstBlob.isDeleted) {
          await decryptBlob(key, firstBlob.iv, firstBlob.ciphertext);
        }
        setE2EKey(key);
        setE2EKeyReady(true);
        setPassphraseInput("");
        window.dispatchEvent(new Event("gc:sync"));
      } catch (err) {
        if (err instanceof DOMException) {
          setUnlockError("Incorrect passphrase");
        } else {
          setUnlockError("Failed to unlock - check your connection");
        }
      } finally {
        setIsUnlocking(false);
      }
    },
    [passphraseInput, setE2EKeyReady],
  );

  if (authed) {
    return (
      <div className="border border-rule p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Cloud className="size-4 text-persimmon shrink-0" aria-hidden="true" />
          <span className="font-mono text-[11px] text-ink">Connected to cloud</span>
          {syncStatus === "syncing" && (
            <span className="font-mono text-[10px] text-ink-soft ml-auto">Syncing...</span>
          )}
          {syncStatus === "error" && (
            <span className="font-mono text-[10px] text-red-500 ml-auto">Sync error</span>
          )}
          {e2eEnabled && e2eKeyReady && (
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-sage/80 ml-auto">
              <ShieldCheck className="size-3" aria-hidden="true" />
              E2E encrypted
            </span>
          )}
        </div>
        {lastSyncedAt && (
          <p className="font-mono text-[10px] text-ink-soft">
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-[11px] h-8"
            onClick={handleSyncNow}
            disabled={syncStatus === "syncing" || loading}
          >
            <RefreshCw
              className={`size-3 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Sync now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="font-mono text-[11px] h-8 text-ink-soft hover:text-ink"
            onClick={() => void handleSignOut()}
            disabled={loading}
          >
            <LogOut className="size-3 mr-2" aria-hidden="true" />
            Sign out
          </Button>
        </div>

        {/* E2E setup form - shown once, when not yet configured */}
        {!e2eEnabled && (
          <form onSubmit={(e) => void handleSetup(e)} className="mt-3 space-y-2">
            <p className={cn(SERIF_TITLE_CLS, "text-sm")}>Enable end-to-end encryption</p>
            <p className="font-mono text-[10px] text-ink-soft leading-relaxed">
              Your data will be encrypted on this device before syncing. Choose a strong passphrase
              - it cannot be recovered if forgotten.
            </p>
            <Input
              type="password"
              placeholder="Passphrase"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              className={EDITORIAL_INPUT_CLS}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm passphrase"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className={EDITORIAL_INPUT_CLS}
              autoComplete="new-password"
            />
            {setupError !== undefined && (
              <p className="font-mono text-[10px] text-persimmon">{setupError}</p>
            )}
            <Button
              type="submit"
              disabled={isActivating || passphraseInput.length === 0}
              className="w-full font-mono text-[10px] uppercase tracking-wider rounded-none"
            >
              {isActivating ? "Encrypting & uploading..." : "Enable encryption"}
            </Button>
          </form>
        )}

        {/* Unlock form - shown each session when e2e is configured but key is not in memory */}
        {e2eEnabled && !e2eKeyReady && (
          <form onSubmit={(e) => void handleUnlock(e)} className="mt-3 space-y-2">
            <p className={cn(SERIF_TITLE_CLS, "text-sm")}>Sync is locked</p>
            <p className="font-mono text-[10px] text-ink-soft">
              Enter your encryption passphrase to resume syncing.
            </p>
            <Input
              type="password"
              placeholder="Passphrase"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              className={EDITORIAL_INPUT_CLS}
              autoFocus={true}
              autoComplete="current-password"
            />
            {unlockError !== undefined && (
              <p className="font-mono text-[10px] text-persimmon">{unlockError}</p>
            )}
            <Button
              type="submit"
              disabled={isUnlocking || passphraseInput.length === 0}
              className="w-full font-mono text-[10px] uppercase tracking-wider rounded-none"
            >
              {isUnlocking ? "Verifying..." : "Unlock sync"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (!googleClientId) {
    return (
      <div className="border border-rule p-6 space-y-2">
        <p className="font-mono text-[11px] text-ink-soft">
          Cloud sync is not configured. Add{" "}
          <code className="bg-paper-muted px-1 text-ink">VITE_GOOGLE_CLIENT_ID</code> to your{" "}
          <code className="bg-paper-muted px-1 text-ink">.env</code> file to enable Google Sign-In.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-rule p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CloudOff className="size-4 text-ink-soft shrink-0" aria-hidden="true" />
        <span className="font-mono text-[11px] text-ink-soft">Not connected to cloud</span>
      </div>
      <p className="font-mono text-[10px] text-ink-soft leading-relaxed">
        Sign in to sync your data across devices and keep a cloud backup.
      </p>
      <div ref={googleBtnRef} />
      {loading && <p className="font-mono text-[10px] text-ink-soft">Completing sign-in...</p>}
    </div>
  );
}
