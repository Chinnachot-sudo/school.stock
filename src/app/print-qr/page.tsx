'use client';

import { useState, useEffect } from 'react';
import { Item, Category } from '@/types/inventory';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckSquare, Square, QrCode, MapPin, School, Sparkles, Link2, Hash } from 'lucide-react';

export default function PrintQrPage() {
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

  return (
    <div className="space-y-4">
      
      {/* Control Header (Hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              พิมพ์สติกเกอร์ QR Code ติดชั้นวาง / กล่องพัสดุ
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกสินค้าที่ต้องการ แล้วสั่งพิมพ์เป็นแผ่นสติกเกอร์ A4 เพื่อนำไปแปะหน้าตู้จัดเก็บ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ ({selectedItems.length} ป้าย)</span>
            </button>
          </div>
        </div>

        {/* Informative Tip Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>💡 ข้อแนะนำสำคัญสำหรับการสแกนผ่านกล้อง iPhone:</strong>
            <p className="text-blue-700 mt-0.5">
              เมื่อเลือกโหมด <u>&quot;ลิงก์เว็บเบิกทันที&quot;</u> คุณครูสามารถใช้ <strong>แอปกล้องถ่ายรูปปกติของ iPhone (หรือแอป LINE)</strong> ส่องป้าย QR ที่ตู้ได้ทันที จะมีแถบสีเหลืองให้กดเพื่อเปิดหน้าตัดสต็อกของสินค้านั้นได้โดยอัตโนมัติ!
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Select All Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-blue-600 transition"
            >
              {selectedIds.length === items.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>เลือกทั้งหมด ({selectedIds.length}/{items.length})</span>
            </button>
          </div>

          {/* QR Content Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <span className="text-slate-500 font-medium px-1.5">รูปแบบ QR:</span>
            <button
              onClick={() => setQrMode('url')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                qrMode === 'url'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="กล้อง iPhone ส่องแล้วเด้งเปิดหน้าตัดสต็อกเลย"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>ลิงก์เว็บเบิกทันที (แนะนำ)</span>
            </button>
            <button
              onClick={() => setQrMode('code')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                qrMode === 'code'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="เฉพาะรหัสข้อความเดิม"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>รหัสพัสดุเดิม</span>
            </button>
          </div>

          {/* Label Size Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">ขนาดป้าย:</span>
            <button
              onClick={() => setCardSize('medium')}
              className={`px-3 py-1 rounded-lg font-bold border transition ${
                cardSize === 'medium'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              ขนาดมาตรฐาน (ติดชั้นวาง)
            </button>
            <button
              onClick={() => setCardSize('small')}
              className={`px-3 py-1 rounded-lg font-bold border transition ${
                cardSize === 'small'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              ขนาดกะทัดรัด (ติดกล่อง)
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
        {selectedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 no-print">
            <p className="text-sm font-semibold">กรุณาเลือกรายการสินค้าด้านบนเพื่อแสดงตัวอย่างป้าย QR</p>
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
                  className="relative bg-white border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between hover:border-blue-400 transition break-inside-avoid"
                >
                  {/* Deselect checkbox on screen only */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="no-print absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                    title="ตัดรายการนี้ออกจากการพิมพ์"
                  >
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  </button>

                  {/* Card Header */}
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2">
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
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
