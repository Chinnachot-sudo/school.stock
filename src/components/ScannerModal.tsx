'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { X, Camera, Flashlight, AlertCircle, Search, MapPin, Boxes, ArrowRight, RefreshCw } from 'lucide-react';
import { Item } from '@/types/inventory';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: Item[];
  onDeduct?: (item: Item) => void;
  onRestock?: (item: Item) => void;
  onScanSuccess?: (decodedText: string) => void;
}

export default function ScannerModal({
  isOpen,
  onClose,
  items = [],
  onDeduct,
  onRestock,
  onScanSuccess
}: ScannerModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [detectedItem, setDetectedItem] = useState<Item | null>(null);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extractCodeFromText = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('code=')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        return url.searchParams.get('code') || trimmed;
      } catch (e) {
        const match = trimmed.match(/[?&]code=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    }
    return trimmed;
  };

  const handleProcessCode = (rawCode: string) => {
    const code = extractCodeFromText(rawCode).toLowerCase();
    
    // Check if items array is passed
    if (items && items.length > 0) {
      const found = items.find(
        i => i.code.toLowerCase() === code || i.id.toLowerCase() === code
      );
      if (found) {
        setDetectedItem(found);
        setUnrecognizedCode(null);
        if (scannerRef.current && scannerRef.current.isScanning) {
          try {
            scannerRef.current.pause(true);
          } catch (e) {}
        }
        return;
      } else {
        setUnrecognizedCode(rawCode);
        setDetectedItem(null);
        return;
      }
    }

    // Fallback if standalone onScanSuccess is provided
    if (onScanSuccess) {
      stopAndClose(() => onScanSuccess(rawCode));
    }
  };

  const handleResumeScanning = () => {
    setDetectedItem(null);
    setUnrecognizedCode(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setIsTorchOn(false);
    setDetectedItem(null);
    setUnrecognizedCode(null);
    setShowManualInput(false);

    const isSecure = typeof window !== 'undefined' && window.isSecureContext;
    const hasGetUserMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    if (!isSecure && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setErrorMessage(
        'เบราว์เซอร์จำกัดการเปิดกล้องผ่าน HTTP\nกรุณาใช้ปุ่ม "ถ่ายรูปสแกน" ด้านล่าง'
      );
      return;
    }

    if (!hasGetUserMedia) {
      setErrorMessage(
        'เบราว์เซอร์นี้ไม่รองรับการเปิดวิดีโอกล้องสด กรุณาใช้ปุ่ม "ถ่ายรูปสแกน" หรือพิมพ์รหัสแทน'
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
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMounted) {
              handleProcessCode(decodedText);
            }
          },
          () => {}
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
            'ไม่สามารถเปิดกล้องสดได้ กรุณาแตะปุ่ม "ถ่ายรูปสแกน" หรือพิมพ์รหัสแทน'
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

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);

    try {
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

      // Tier 1: WebKit BarcodeDetector
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
          console.warn('BarcodeDetector failed:', e);
        }
      }

      // Tier 2: jsQR
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
          console.warn('jsQR failed:', e);
        }
      }

      // Tier 3: Html5Qrcode
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
        handleProcessCode(decodedResult);
      } else {
        setErrorMessage(
          'ตรวจไม่พบบาร์โค้ดในรูปภาพ กรุณาถ่ายให้ใกล้และชัดเจนขึ้น หรือพิมพ์รหัสแทน'
        );
      }
    } catch (err: any) {
      setIsProcessingFile(false);
      console.error('File scan error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการอ่านรูปภาพ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl overflow-hidden border border-[#E5E0D8] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#1F4D3A] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-white/80" />
            <span className="font-semibold text-xs sm:text-sm">สแกนรหัสพัสดุ</span>
          </div>
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded text-xs transition ${
                  isTorchOn
                    ? 'bg-[#C45C26] text-white'
                    : 'bg-[#183D2E] text-white/80'
                }`}
                title="เปิด/ปิดไฟฉาย"
              >
                <Flashlight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => stopAndClose()}
              className="p-1.5 rounded hover:bg-[#183D2E] text-white/80 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offscreen element for Tier-3 fallback */}
        <div
          id="qr-reader-offscreen"
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '300px', height: '300px' }}
        ></div>

        {/* Camera Viewport Area */}
        <div className="relative bg-[#1A1A1A] min-h-[250px] flex items-center justify-center overflow-hidden">
          <div id="qr-reader" className="w-full h-full"></div>

          {/* Viewfinder frame overlay with static guidance */}
          {!detectedItem && !errorMessage && !isStarting && !isProcessingFile && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-52 h-52 border-2 border-white/70 rounded-xl relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white"></span>
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white"></span>
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white"></span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white"></span>
              </div>
              <p className="text-white/80 text-[11px] font-medium mt-3 bg-black/40 px-2.5 py-1 rounded">
                จัดโค้ดให้อยู่ในกรอบ
              </p>
            </div>
          )}

          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] text-white p-4">
              <div className="w-7 h-7 border-2 border-[#1F4D3A] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-[#E5E0D8]">กำลังเชื่อมต่อกล้อง...</p>
            </div>
          )}

          {isProcessingFile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A]/95 text-white p-4 z-20">
              <div className="w-8 h-8 border-2 border-[#1F4D3A] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-white">กำลังอ่านรหัส...</p>
            </div>
          )}

          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] text-white p-5 text-center z-10">
              <AlertCircle className="w-8 h-8 text-[#B54708] mb-2" />
              <p className="text-xs text-[#FEF0C7] whitespace-pre-line leading-relaxed max-w-xs">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Scanned Result Card: Triggered when item is detected */}
        {detectedItem ? (
          <div className="p-4 bg-white border-t border-[#E5E0D8] space-y-3">
            <div className="p-3 bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] text-[#6B6560] block uppercase tracking-wider">
                    {detectedItem.code}
                  </span>
                  <h3 className="font-semibold text-sm text-[#1A1A1A] mt-0.5 leading-snug">
                    {detectedItem.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-[#6B6560] mt-1">
                    <MapPin className="w-3 h-3 text-[#6B6560] shrink-0" />
                    <span className="truncate">{detectedItem.location || 'ไม่ระบุจุดจัดเก็บ'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#6B6560] block">คงเหลือ</span>
                  <div className="text-xl font-bold font-mono text-[#1A1A1A] leading-tight">
                    {detectedItem.currentStock}
                  </div>
                  <span className="text-[10px] text-[#6B6560]">{detectedItem.unit}</span>
                </div>
              </div>
            </div>

            {/* 3 Explicit Action Buttons as specified in Brief */}
            <div className="space-y-2 pt-1">
              {/* 1. Primary Action: ตัดสต็อก (Terracotta #C45C26) */}
              <button
                type="button"
                onClick={() => {
                  const target = detectedItem;
                  stopAndClose(() => {
                    if (onDeduct) onDeduct(target);
                    else if (onScanSuccess) onScanSuccess(target.code);
                  });
                }}
                className="w-full min-h-[48px] bg-[#C45C26] hover:bg-[#A84B1E] active:scale-98 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
              >
                <span>ตัดสต็อก</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* 2. Secondary Action: รับเข้า (Outline) */}
                <button
                  type="button"
                  onClick={() => {
                    const target = detectedItem;
                    stopAndClose(() => {
                      if (onRestock) onRestock(target);
                      else if (onScanSuccess) onScanSuccess(target.code);
                    });
                  }}
                  className="min-h-[44px] bg-white hover:bg-[#E8F0EB] text-[#1F4D3A] border border-[#1F4D3A] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <span>+ รับเข้า</span>
                </button>

                {/* 3. Scan Next (Neutral) */}
                <button
                  type="button"
                  onClick={handleResumeScanning}
                  className="min-h-[44px] bg-white hover:bg-[#F7F4EF] text-[#6B6560] border border-[#E5E0D8] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>สแกนถัดไป</span>
                </button>
              </div>
            </div>
          </div>
        ) : unrecognizedCode ? (
          /* Unrecognized code card */
          <div className="p-4 bg-white border-t border-[#E5E0D8] space-y-3">
            <div className="p-3 bg-[#FEF0C7] border border-[#B54708]/30 rounded-lg text-[#B54708] text-xs">
              <p className="font-semibold">ไม่พบพัสดุในระบบ</p>
              <p className="text-[11px] mt-0.5">
                รหัส <span className="font-mono font-bold">{unrecognizedCode}</span> ยังไม่มีในฐานข้อมูล
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResumeScanning}
                className="min-h-[44px] bg-[#1F4D3A] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
              >
                <span>ลองสแกนใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="min-h-[44px] bg-white border border-[#E5E0D8] text-[#6B6560] rounded-lg text-xs font-medium"
              >
                <span>พิมพ์รหัสแทน</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Action Toolbar */
          <div className="p-4 bg-white border-t border-[#E5E0D8] space-y-3">
            
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
                className="w-full min-h-[44px] bg-white hover:bg-[#F7F4EF] text-[#1A1A1A] border border-[#E5E0D8] font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer transition text-xs text-center"
              >
                <Camera className="w-4 h-4 text-[#6B6560]" />
                <span>ถ่ายรูปสแกนด้วยกล้องมือถือ</span>
              </label>
            </div>

            {/* Toggle Manual Input Button */}
            {!showManualInput ? (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="w-full py-2 text-center text-xs text-[#6B6560] hover:text-[#1A1A1A] transition underline underline-offset-2"
              >
                พิมพ์รหัสแทน
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E5E0D8] flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์รหัส SKU หรือบาร์โค้ด"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1F4D3A] font-mono text-[#1A1A1A]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="bg-[#1F4D3A] hover:bg-[#183D2E] disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium transition"
                >
                  ค้นหา
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
