"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComponents } from "@/contexts/ComponentContext";
import { toast } from "sonner";

declare global {
  interface Window {
    Html5Qrcode?: unknown;
  }
}

const tryLoad = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });

const loadQrLib = async () => {
  if (window.Html5Qrcode) return;
  try {
    await tryLoad("/html5-qrcode.min.js");
    return;
  } catch {
    /* try CDN */
  }
  await tryLoad("https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js");
};

export const QRScanner = ({ onClose }: { onClose?: () => void }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [scanned, setScanned] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { components, checkoutComponent } = useComponents();

  useEffect(() => {
    let mounted = true;
    loadQrLib()
      .then(() => {
        if (!mounted) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Html5Qrcode = (window as any).Html5Qrcode;
        if (!Html5Qrcode) { toast.error("QR library failed to load"); return; }

        const html5QrCode = new Html5Qrcode("html5qr-reader");
        scannerRef.current = html5QrCode;

        html5QrCode
          .start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decoded: string) => {
            setScanned(decoded);
            try { html5QrCode.stop(); } catch { /* ignore */ }
            try {
              const parsed = JSON.parse(decoded);
              setComponentId(parsed?.id ? String(parsed.id) : decoded);
            } catch {
              setComponentId(decoded);
            }
          }, () => { /* per-frame errors — ignore */ })
          .catch((err: unknown) => toast.error("Could not start camera: " + String(err)));
      })
      .catch((err: unknown) => toast.error("Could not load QR scanner: " + String(err)));

    return () => {
      mounted = false;
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  const found = componentId ? components.find((c) => c.id === componentId || c.name === componentId) : undefined;
  const handleSubmit = async () => {
    if (!found) return toast.error("No component selected");
    if (quantity < 1) return toast.error("Quantity must be at least 1");
    if (quantity > found.available) return toast.error(`Only ${found.available} available`);

    // Default loan period: one week from today.
    const due = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const result = await checkoutComponent(found.id, quantity, due);
    if (!result.ok) return toast.error(result.error ?? "Checkout failed");

    toast.success("Checked out successfully");
    if (onClose) onClose();
  };

  return (
    <div className="space-y-4">
      <div id="html5qr-reader" style={{ width: "100%", height: 300, background: "#000" }} />

      <div>
        <Label>Scanned result</Label>
        <div className="mt-1 p-2 bg-secondary border-border rounded">{scanned || "No code yet"}</div>
      </div>

      {found ? (
        <div>
          <div className="mb-2">
            <strong>{found.name}</strong> — {found.available} / {found.quantity} available
          </div>
          <div>
            <Label htmlFor="qty">How many are you taking?</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={found.available}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
              Submit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  scannerRef.current?.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, () => {}, () => {});
                  setScanned(null);
                  setComponentId(null);
                } catch { /* ignore */ }
              }}
            >
              Scan again
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Scan a QR code — can be JSON like <code>{'{"id":"1"}'}</code> or a plain component id/name.
        </div>
      )}
    </div>
  );
};

export default QRScanner;