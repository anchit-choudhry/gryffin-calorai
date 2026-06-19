import { useState } from "react";
import { shareOrDownloadCard } from "@/lib/shareCard";

export function useShareCard(renderFn: () => Promise<Blob>, filename: string) {
  const [sharing, setSharing] = useState(false);
  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await renderFn();
      await shareOrDownloadCard(blob, filename);
    } finally {
      setSharing(false);
    }
  };
  return { sharing, handleShare };
}
