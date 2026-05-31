import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, CloudOff, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, clearTokens, isAuthenticated } from "../lib/apiClient";
import { useAppState } from "../state/AppState";

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
  const googleBtnRef = useRef<HTMLDivElement>(null);

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

  if (authed) {
    return (
      <div className="border border-rule p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Cloud className="size-4 text-persimmon shrink-0" />
          <span className="font-mono text-[11px] text-ink">Connected to cloud</span>
          {syncStatus === "syncing" && (
            <span className="font-mono text-[10px] text-ink-soft ml-auto">Syncing...</span>
          )}
          {syncStatus === "error" && (
            <span className="font-mono text-[10px] text-red-500 ml-auto">Sync error</span>
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
            <LogOut className="size-3 mr-2" />
            Sign out
          </Button>
        </div>
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
        <CloudOff className="size-4 text-ink-soft shrink-0" />
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
