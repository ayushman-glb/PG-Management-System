import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, ShieldCheck, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  signerName: string;
  signerType: 'RESIDENT' | 'OWNER';
  onSaveSignature: (signatureSvg: string, signerType: 'RESIDENT' | 'OWNER') => void;
  onCancel?: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  signerName,
  signerType,
  onSaveSignature,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#D9A87C';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150"><image href="${dataUrl}" x="0" y="0" width="400" height="150"/></svg>`;
    onSaveSignature(svgMarkup, signerType);
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900 border border-amber-500/30 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-400" /> Digital Signature Pad
          </h4>
          <p className="text-xs text-neutral-400">
            Signer: <strong className="text-amber-400">{signerName}</strong> ({signerType})
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> HMAC SHA-256 Encrypted
        </span>
      </div>

      {/* HTML5 Canvas */}
      <div className="relative rounded-2xl bg-neutral-950 border border-white/10 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-600 text-xs font-medium">
            Sign here using mouse, touch, or stylus...
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear Signature
        </button>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              hasDrawn
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm & Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};
