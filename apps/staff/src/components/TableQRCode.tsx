import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

interface TableQRCodeProps {
  tableNumber: number;
  qrCodeUrl: string; // The actual menu URL to encode (e.g., http://localhost:5173/menu?restaurant=slug&table=id)
  baseUrlOverride?: string;
}

export function TableQRCode({ tableNumber, qrCodeUrl, baseUrlOverride }: TableQRCodeProps) {
  // If override is provided, swap the host portion while keeping the path + query params
  const finalQrUrl = useMemo(() => {
    if (!baseUrlOverride || !baseUrlOverride.trim()) return qrCodeUrl;
    try {
      const original = new URL(qrCodeUrl);
      const override = new URL(baseUrlOverride.trim());
      // Replace origin but keep path and search params
      return `${override.origin}${original.pathname}${original.search}`;
    } catch {
      // If URLs can't be parsed, just return original
      return qrCodeUrl;
    }
  }, [qrCodeUrl, baseUrlOverride]);

  const downloadQR = () => {
    const canvas = document.getElementById(`qr-table-${tableNumber}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col items-center bg-stone-950 dark:bg-black p-8 rounded-[3rem] border border-white/5 shadow-2xl hover:scale-[1.02] transition-all duration-500 group/qr relative overflow-hidden w-full max-w-[340px] min-h-[540px] mx-auto flex-shrink-0">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-saffron-500/10 blur-[80px] rounded-full group-hover/qr:bg-saffron-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-stone-500/5 blur-[80px] rounded-full" />

      <div className="mb-6 text-center relative z-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-saffron-500 mb-2">DineSmart Online</h4>
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-saffron-500/50 to-transparent mx-auto" />
      </div>
      
      <div className="relative p-5 bg-white rounded-3xl mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover/qr:shadow-saffron-500/10 transition-all duration-700">
        <QRCodeCanvas
          id={`qr-table-${tableNumber}`}
          value={finalQrUrl}
          size={160}
          level="H"
          includeMargin={false}
          fgColor="#0A0A0A"
          imageSettings={{
            src: "/logo.png", // Assuming there is a logo at this path, or we can use a placeholder
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="text-3xl">DS</span>
        </div>
      </div>

      <div className="w-full text-center space-y-6 relative z-10">
        <div className="bg-stone-900/50 py-4 rounded-2xl border border-white/5 shadow-inner">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.3em] mb-1">Table</p>
          <p className="text-4xl font-black text-white leading-none tracking-tighter">{tableNumber}</p>
        </div>
        
        <div className="px-4">
          <p className="text-[8px] font-medium text-stone-500 max-w-[200px] break-all opacity-50 hover:opacity-100 transition-opacity cursor-help" title={finalQrUrl}>
            {finalQrUrl}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={downloadQR}
            className="flex-1 py-4 bg-saffron-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all active:scale-95 shadow-xl shadow-saffron-500/10"
          >
            Download Print
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(finalQrUrl);
              toast.success('Link copied');
            }}
            className="p-4 bg-stone-900 text-stone-400 rounded-2xl hover:bg-stone-800 hover:text-white transition-all active:scale-95 border border-white/5"
            title="Copy URL"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
