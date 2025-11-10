import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComponents } from "@/contexts/ComponentContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window { Html5Qrcode?: any }
}

const tryLoad = (src: string) => new Promise<void>((resolve, reject) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.onload = () => resolve();
  s.onerror = (e) => reject(new Error(`Failed to load script ${src}`));
  document.body.appendChild(s);
});

const loadScript = async () => {
  if ((window as any).Html5Qrcode) return;
  // Try local copy first (place html5-qrcode.min.js in public/)
  try {
    await tryLoad('/html5-qrcode.min.js');
    return;
  } catch (e) {
    // fallback to CDN
  }

  try {
    await tryLoad('https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js');
    return;
  } catch (err) {
    throw new Error('Failed to load html5-qrcode from local and CDN');
  }
};

export const QRScanner = ({ onClose }: { onClose?: () => void }) => {
  const scannerRef = useRef<any>(null);
  const [scanned, setScanned] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { components, checkoutComponent } = useComponents();
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    loadScript().then(() => {
      if (!mounted) return;
      const Html5Qrcode = (window as any).Html5Qrcode;
      if (!Html5Qrcode) {
        toast.error('QR library failed to load');
        return;
      }

      const id = 'html5qr-reader';
      const html5QrCode = new Html5Qrcode(id);
      scannerRef.current = html5QrCode;

      html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => {
        // stop scanning on first decode
        setScanned(decoded);
        try { html5QrCode.stop(); } catch (e) {}
        // try to parse as JSON with id, otherwise assume decoded is id
        try {
          const parsed = JSON.parse(decoded);
          if (parsed && parsed.id) setComponentId(parsed.id.toString());
          else setComponentId(decoded);
        } catch (e) {
          setComponentId(decoded);
        }
      }, (err) => {
        // ignore per-frame errors
      }).catch((err: any) => {
        toast.error('Could not start camera: ' + String(err));
      });
  }).catch((err:any) => toast.error('Could not load QR scanner: ' + String(err)));

    return () => { mounted = false; if (scannerRef.current) scannerRef.current.stop().catch(()=>{}); };
  }, []);

  const found = componentId ? components.find(c => c.id === componentId || c.name === componentId) : undefined;

  const handleSubmit = async () => {
    if (!found) return toast.error('No component selected');
    if (quantity < 1) return toast.error('Quantity must be at least 1');
    if (quantity > found.available) return toast.error(`Only ${found.available} available`);

    // Try backend POST, fallback to local context
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId: found.id, userName: user?.username || 'unknown', quantity, expectedReturn: null })
      });
      if (!resp.ok) throw new Error('server');
      toast.success('Checked out via backend');
    } catch (e) {
      // fallback
      checkoutComponent(found.id, user?.username || 'unknown', quantity, new Date(Date.now()+7*24*3600*1000).toISOString().split('T')[0]);
      toast.success('Checked out (local)');
    }

    if (onClose) onClose();
  };

  return (
    <div className="space-y-4">
      <div id="html5qr-reader" style={{ width: '100%', height: 300, background: '#000' }} />

      <div>
        <Label>Scanned result</Label>
        <div className="mt-1 p-2 bg-secondary border-border rounded">{scanned || 'No code yet'}</div>
      </div>

      {found ? (
        <div>
          <div className="mb-2"><strong>{found.name}</strong> — {found.available} / {found.quantity} available</div>
          <div>
            <Label htmlFor="qty">How many are you taking?</Label>
            <Input id="qty" type="number" min={1} max={found.available} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="mt-1" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">Submit</Button>
            <Button variant="outline" onClick={() => { try { scannerRef.current?.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, ()=>{}, ()=>{}); setScanned(null); setComponentId(null); } catch(e){} }}>Scan again</Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Scan a QR code for a component (QR can contain JSON like <code>{'{"id":"1"}'}</code> or plain component id/name)
        </div>
      )}
    </div>
  );
};

export default QRScanner;
