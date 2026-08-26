import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, ShieldCheck, PenTool, Type, Upload } from 'lucide-react';
import { SignatureType } from '../types/Agreement';

interface SignatureCanvasProps {
  signerName: string;
  signerType: 'RESIDENT' | 'OWNER';
  onSaveSignature: (payload: {
    signatureType: SignatureType;
    signatureData: string;
    consent: boolean;
  }) => void;
  onCancel?: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  signerName,
  signerType,
  onSaveSignature,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<SignatureType>('DRAWN');
  const [typedSignature, setTypedSignature] = useState(signerName);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#004D61';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [activeTab]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!consent) {
      alert('Please check the legal electronic signature consent box to proceed.');
      return;
    }

    if (activeTab === 'DRAWN') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature({
        signatureType: 'DRAWN',
        signatureData: dataUrl,
        consent,
      });
    } else if (activeTab === 'TYPED') {
      if (!typedSignature.trim()) return;
      onSaveSignature({
        signatureType: 'TYPED',
        signatureData: typedSignature.trim(),
        consent,
      });
    } else if (activeTab === 'UPLOADED') {
      if (!uploadedImage) return;
      onSaveSignature({
        signatureType: 'UPLOADED',
        signatureData: uploadedImage,
        consent,
      });
    }
  };

  const isValid =
    consent &&
    ((activeTab === 'DRAWN' && hasDrawn) ||
      (activeTab === 'TYPED' && typedSignature.trim().length > 0) ||
      (activeTab === 'UPLOADED' && uploadedImage !== null));

  return (
    <div className="p-6 rounded-3xl bg-neutral-900 border border-amber-500/30 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-400" /> Digital E-Signature
          </h4>
          <p className="text-xs text-neutral-400">
            Signer: <strong className="text-amber-400">{signerName}</strong> ({signerType})
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> IT Act 2000 Compliant
        </span>
      </div>

      {/* Signature Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('DRAWN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'DRAWN'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white bg-neutral-800'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" /> Draw
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TYPED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'TYPED'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white bg-neutral-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" /> Type
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UPLOADED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'UPLOADED'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white bg-neutral-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Image
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'DRAWN' && (
        <div className="space-y-2">
          <div className="relative rounded-2xl bg-neutral-950 border border-white/10 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={500}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-600 text-xs font-medium">
                Draw your signature here with mouse, finger, or stylus...
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3 py-1 text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear Drawing
          </button>
        </div>
      )}

      {activeTab === 'TYPED' && (
        <div className="space-y-2">
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Type your full legal name..."
            className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-white/10 text-white font-serif text-lg italic focus:outline-none focus:border-amber-500"
          />
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-white/5 text-center">
            <span className="font-serif italic text-2xl text-amber-400 tracking-wider">
              {typedSignature || 'Your Legal Signature'}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'UPLOADED' && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-neutral-950 hover:file:bg-amber-400 cursor-pointer"
          />
          {uploadedImage && (
            <div className="p-2 rounded-xl bg-neutral-950 border border-white/10 flex justify-center max-h-32 overflow-hidden">
              <img src={uploadedImage} alt="Uploaded Signature Preview" className="max-h-28 object-contain" />
            </div>
          )}
        </div>
      )}

      {/* Legal Consent Checkbox */}
      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/40 border border-white/5 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
        />
        <span className="text-xs text-neutral-300 leading-snug">
          I consent to sign this Residential Lease Agreement electronically in accordance with the Information Technology Act, 2000.
        </span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            isValid
              ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Sign Agreement
        </button>
      </div>
    </div>
  );
};
