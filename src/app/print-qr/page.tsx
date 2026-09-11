'use client';

import { useState, useEffect } from 'react';
import { Item, Category } from '@/types/inventory';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckSquare, Square, QrCode, MapPin, School, Info, Link2, Hash, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function PrintQrPage() {
  const { canPrintQr, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardSize, setCardSize] = useState<'medium' | 'small'>('medium');
  const [qrMode, setQrMode] = useState<'url' | 'code'>('url');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        const list = data.items || [];
        setItems(list);
        setSelectedIds(list.map((i: Item) => i.id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = items.filter(i => selectedIds.includes(i.id));

  // Compute QR value according to selected mode
  const getQrValue = (item: Item): string => {
    if (qrMode === 'url' && origin) {
      return `${origin}/?code=${encodeURIComponent(item.code)}`;
    }
    return item.code;
  };

  if (!authLoading && !canPrintQr) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">
            เฉพาะเจ้าหน้าที่พัสดุและผู้ดูแลระบบ
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            หน้านี้สำหรับพิมพ์ป้าย QR Code ติดตู้พัสดุ สงวนสิทธิ์สำหรับเจ้าหน้าที่พัสดุและ Super Admin เท่านั้น
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Control Header (Hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E5E0D8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#1F4D3A]" />
              พิมพ์สติกเกอร์ QR Code ติดชั้นวาง / กล่องพัสดุ
            </h1>
            <p className="text-xs text-[#6B6560] mt-0.5">
              เลือกสินค้าที่ต้องการ แล้วสั่งพิมพ์เป็นแผ่นสติกเกอร์ A4 เพื่อนำไปแปะหน้าตู้จัดเก็บ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] disabled:opacity-40 text-white text-xs font-medium transition"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ ({selectedItems.length} ป้าย)</span>
            </button>
          </div>
        </div>

        {/* Informative Tip Box */}
        <div className="bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-3 text-xs text-[#1A1A1A] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1F4D3A] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>คำแนะนำสำหรับการสแกนผ่านกล้องโทรศัพท์:</strong>
            <p className="text-[#6B6560] mt-0.5">
              เมื่อเลือกโหมด <u>&quot;ลิงก์เว็บเบิกทันที&quot;</u> คุณครูสามารถใช้ <strong>แอปกล้องถ่ายรูปปกติของโทรศัพท์ (หรือ LINE)</strong> ส่องป้าย QR ที่ตู้ได้ทันที จะมีแถบข้อความให้กดเพื่อเปิดหน้าตัดสต็อกของสินค้านั้นได้โดยอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Select All Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-medium text-[#1A1A1A] hover:text-[#1F4D3A] transition"
            >
              {selectedIds.length === items.length ? (
                <CheckSquare className="w-4 h-4 text-[#1F4D3A]" />
              ) : (
                <Square className="w-4 h-4 text-[#6B6560]" />
              )}
              <span>เลือกทั้งหมด ({selectedIds.length}/{items.length})</span>
            </button>
          </div>

          {/* QR Content Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F7F4EF] p-1 rounded-lg border border-[#E5E0D8]">
            <span className="text-[#6B6560] font-medium px-1.5 text-xs">รูปแบบ QR:</span>
            <button
              onClick={() => setQrMode('url')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 transition ${
                qrMode === 'url'
                  ? 'bg-[#1F4D3A] text-white'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
              }`}
              title="กล้องโทรศัพท์ส่องแล้วเด้งเปิดหน้าตัดสต็อกเลย"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>ลิงก์เว็บเบิกทันที (แนะนำ)</span>
            </button>
            <button
              onClick={() => setQrMode('code')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 transition ${
                qrMode === 'code'
                  ? 'bg-[#1F4D3A] text-white'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
              }`}
              title="เฉพาะรหัสข้อความเดิม"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>รหัสพัสดุเดิม</span>
            </button>
          </div>

          {/* Label Size Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#6B6560] font-medium text-xs">ขนาดป้าย:</span>
            <button
              onClick={() => setCardSize('medium')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardSize === 'medium'
                  ? 'bg-[#E8F0EB] text-[#1F4D3A] border-[#1F4D3A]/20'
                  : 'bg-[#F7F4EF] text-[#6B6560] border-[#E5E0D8]'
              }`}
            >
              ขนาดมาตรฐาน (ติดชั้นวาง)
            </button>
            <button
              onClick={() => setCardSize('small')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardSize === 'small'
                  ? 'bg-[#E8F0EB] text-[#1F4D3A] border-[#1F4D3A]/20'
                  : 'bg-[#F7F4EF] text-[#6B6560] border-[#E5E0D8]'
              }`}
            >
              ขนาดกะทัดรัด (ติดกล่อง)
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white p-4 sm:p-8 rounded-xl border border-[#E5E0D8] min-h-[500px]">
        {selectedItems.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560] no-print">
            <p className="text-xs font-medium">กรุณาเลือกรายการสินค้าด้านบนเพื่อแสดงตัวอย่างป้าย QR</p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              cardSize === 'medium'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}
          >
            {selectedItems.map(item => {
              const qrValue = getQrValue(item);

              return (
                <div
                  key={item.id}
                  className="relative bg-white border-2 border-dashed border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-between hover:border-[#1F4D3A] transition break-inside-avoid"
                >
                  {/* Deselect checkbox on screen only */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="no-print absolute top-2 right-2 p-1 text-[#6B6560] hover:text-[#B42318]"
                    title="ตัดรายการนี้ออกจากการพิมพ์"
                  >
                    <CheckSquare className="w-4 h-4 text-[#1F4D3A]" />
                  </button>

                  {/* Card Header */}
                  <div className="flex items-center gap-1.5 border-b border-[#E5E0D8] pb-1.5 mb-2">
                    <School className="w-3.5 h-3.5 text-[#1F4D3A]" />
                    <span className="text-[10px] font-semibold text-[#1A1A1A] uppercase tracking-tight">
                      พัสดุโรงเรียน • สแกนเบิก
                    </span>
                  </div>

                  {/* QR Code and Item Meta */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 flex items-center justify-center">
                      <QRCodeSVG
                        value={qrValue}
                        size={cardSize === 'medium' ? 78 : 64}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded block truncate w-max">
                        {item.code}
                      </span>
                      <h2 className="text-xs font-black text-slate-900 mt-1 leading-snug line-clamp-2">
                        {item.name}
                      </h2>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        หน่วยนับ: {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Shelf Location Tag */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <strong className="truncate">{item.location || 'คลังพัสดุกลาง'}</strong>
                    </span>
                    <span className="text-[9px] text-blue-600 font-semibold shrink-0">
                      แตะเพื่อตัดสต็อก
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
