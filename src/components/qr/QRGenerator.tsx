import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useRef } from 'react';

interface QRGeneratorProps {
  value: string;
  title?: string;
  subtitle?: string;
}

export function QRGenerator({ value, title, subtitle }: QRGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // To restore React event listeners after destructive DOM change
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div ref={printRef} className="flex flex-col items-center p-4 bg-white">
        {title && <h3 className="text-lg font-bold mb-2 text-center">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 mb-4 text-center">{subtitle}</p>}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 inline-block">
          <QRCodeSVG 
            value={value} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-xs text-gray-400 mt-4 break-all max-w-[200px] text-center">{value}</p>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>
    </div>
  );
}
