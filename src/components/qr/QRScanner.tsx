import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!scannerRef.current) return;

    let html5QrCode: Html5Qrcode;
    let isComponentMounted = true;

    // Small delay to ensure the div is rendered in the DOM before Html5Qrcode tries to find it
    const timer = setTimeout(() => {
      if (!isComponentMounted) return;
      
      html5QrCode = new Html5Qrcode("qr-reader");

      html5QrCode.start(
        { facingMode: "environment" }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        },
        (decodedText) => {
          // Stop scanning on success
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              onScanSuccess(decodedText);
            }).catch(e => {
              console.error("Failed to stop scanner", e);
              onScanSuccess(decodedText);
            });
          }
        },
        (err) => {
          // Ignore frequent parsing errors
        }
      ).then(() => {
        if (isComponentMounted) setIsInitializing(false);
      }).catch((err) => {
        if (isComponentMounted) {
          setIsInitializing(false);
          
          // Check if it's a secure context issue (HTTP vs HTTPS)
          if (window.isSecureContext === false) {
            setError("Accès caméra refusé : Vous devez utiliser HTTPS ou 'localhost' pour accéder à la caméra.");
          } else {
            setError("Impossible d'accéder à la caméra. Autorisez l'accès dans votre navigateur.");
          }
          console.error("Camera start error:", err);
        }
      });
    }, 100);

    return () => {
      isComponentMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("Failed to stop scanner on unmount", e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-xl relative p-4 flex flex-col items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-10" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-center mb-4">Scanner le QR Code</h3>
        
        <div className="relative w-full">
          {isInitializing && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 rounded-lg min-h-[250px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-gray-500">Démarrage de la caméra...</p>
            </div>
          )}

          <div 
            id="qr-reader" 
            ref={scannerRef} 
            className="w-full overflow-hidden rounded-lg min-h-[250px] bg-black"
          ></div>
        </div>
        
        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
