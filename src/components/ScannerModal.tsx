'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { X, Camera, Flashlight, AlertCircle, Search, Sparkles, CheckCircle2 } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function ScannerModal({
  isOpen,
  onClose,
  onScanSuccess
}: ScannerModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setIsTorchOn(false);

    const isSecure = typeof window !== 'undefined' && window.isSecureContext;
    const hasGetUserMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    // Insecure HTTP on IP address (e.g. http://10.3.0.38:3000)
    if (!isSecure && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setErrorMessage(
        'เบราว์เซอร์มือถือจำกัดการเปิดวิดีโอสดเนื่องจากเปิดผ่าน HTTP\nกรุณาแตะปุ่ม "📷 ถ่ายรูปสแกนด้วยกล้องมือถือ" ด้านล่างเพื่อเปิดกล้องถ่ายภาพ'
      );
      return;
    }

    if (!hasGetUserMedia) {
      setErrorMessage(
        'เบราว์เซอร์นี้ไม่รองรับการเปิดวิดีโอกล้องสด กรุณาใช้ปุ่ม "📷 ถ่ายรูปสแกนด้วยกล้องมือถือ" ด้านล่าง'
      );
      return;
    }

    setIsStarting(true);

    const initScanner = async () => {
      try {
        const qrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMounted) {
              stopAndClose(() => onScanSuccess(decodedText));
            }
          },
          () => {
            // Frame noise - ignore
          }
        );

        if (isMounted) {
          setIsStarting(false);
          try {
            const track = qrCode.getRunningTrackCameraCapabilities();
            if (track && (track as any).torchFeature?.().isSupported?.()) {
              setHasTorch(true);
            }
          } catch (e) {}
        }
      } catch (err: any) {
        console.error('Camera live start error:', err);
        if (isMounted) {
          setIsStarting(false);
          setErrorMessage(
            'ไม่สามารถเปิดกล้องวิดีโอสดได้ กรุณาแตะปุ่ม "📷 ถ่ายรูปสแกนด้วยกล้องมือถือ" ด้านล่าง'
          );
        }
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen]);

  const stopAndClose = async (callback?: () => void) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error('Stop scanner error:', e);
      }
    }
    if (callback) {
      callback();
    } else {
      onClose();
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.error('Toggle torch error:', e);
    }
  };

  // Ultra-resilient multi-tier Image QR & Barcode Decoder
  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);

    try {
      // 1. Read file into an Image element
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Downscale onto an in-memory Canvas (max 1200px) so iPhone 12-48MP photos won't crash memory
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0, width, height);

      let decodedResult: string | null = null;

      // Tier 1: Native Apple WebKit BarcodeDetector (Supported in modern iOS Safari & Chrome)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'code_128', 'code_39']
          });
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            decodedResult = barcodes[0].rawValue;
          }
        } catch (e) {
          console.warn('BarcodeDetector pass failed:', e);
        }
      }

      // Tier 2: jsQR pixel analysis (Instant pure JS for QR codes)
      if (!decodedResult) {
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const qr = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });
          if (qr && qr.data) {
            decodedResult = qr.data;
          }
        } catch (e) {
          console.warn('jsQR pass failed:', e);
        }
      }

      // Tier 3: Html5Qrcode fallback
      if (!decodedResult) {
        try {
          const tempContainer = document.getElementById('qr-reader-offscreen');
          if (tempContainer) {
            const html5Qr = new Html5Qrcode('qr-reader-offscreen');
            decodedResult = await html5Qr.scanFile(file, false);
          }
        } catch (e) {
          console.warn('Html5Qrcode file scan failed:', e);
        }
      }

      setIsProcessingFile(false);

      if (decodedResult) {
        stopAndClose(() => onScanSuccess(decodedResult!));
      } else {
        setErrorMessage(
          'ตรวจไม่พบบาร์โค้ดในภาพถ่าย กรุณาถ่ายภาพให้ใกล้และชัดเจนขึ้น หรือพิมพ์รหัสสินค้าด้านล่าง'
        );
      }
    } catch (err: any) {
      setIsProcessingFile(false);
      console.error('File scan error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการประมวลผลภาพ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopAndClose(() => onScanSuccess(manualCode.trim()));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">สแกน QR Code / บาร์โค้ด</span>
          </div>
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg border transition ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="เปิด/ปิดไฟฉาย"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => stopAndClose()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offscreen element for Tier-3 fallback (has dimensions, hidden offscreen) */}
        <div
          id="qr-reader-offscreen"
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '300px', height: '300px' }}
        ></div>

        {/* Camera Viewport Area */}
        <div className="relative bg-slate-950 min-h-[260px] flex items-center justify-center overflow-hidden">
          <div id="qr-reader" className="w-full h-full"></div>

          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium text-slate-300">กำลังเชื่อมต่อกล้องมือถือ...</p>
            </div>
          )}

          {isProcessingFile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white p-4 z-20">
              <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-emerald-300">กำลังอ่านรหัส QR / บาร์โค้ด...</p>
              <p className="text-xs text-slate-400 mt-1">กรุณารอสักครู่</p>
            </div>
          )}

          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-5 text-center z-10">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-xs text-amber-200 whitespace-pre-line leading-relaxed max-w-xs font-medium">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          
          {/* Native Camera Capture Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileCapture}
              className="hidden"
              id="camera-file-input"
            />
            <label
              htmlFor="camera-file-input"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 cursor-pointer transition text-sm text-center"
            >
              <Camera className="w-5 h-5" />
              <span>📷 ถ่ายรูปสแกนด้วยกล้องมือถือ</span>
            </label>
            <p className="text-[11px] text-center text-slate-500 mt-1 font-medium">
              * แตะเพื่อเปิดกล้องมือถือ ถ่ายภาพ QR Code แล้วระบบจะตัดสต็อกให้ทันที
            </p>
          </div>

          {/* Manual Code Input Fallback */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] text-slate-600 font-semibold mb-1.5">
              หรือพิมพ์รหัสสินค้าด้วยตนเอง:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="เช่น A4-DOUBLE-A หรือ PEN-WB-BLUE"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                ตกลง
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
