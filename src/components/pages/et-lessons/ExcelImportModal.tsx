import React from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { LC_CLASSES } from './catalog';
import { LessonService } from '@/lib/lessons';
import { Modal, ghostBtnL, primaryBtnL } from './ui';

// Excel "taqsimot" import modali.
// - Namuna (example) shablonni yuklab olish — backend kutadigan matritsa ko'rinishida:
//     O'qituvchi | Fan\Sinf | Xona | <sinf ustunlari...>
//   Har bir katakda — shu sinf uchun haftalik soat (0,5 ham mumkin).
//   Bir xil (sinf, fan) ikkita o'qituvchiga yozilsa — guruhli dars bo'ladi.
// - To'ldirilgan faylni POST /api/lessons/v1/template ga yuklash.

export function ExcelImportModal({ onClose, onImported }: any) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sarlavhadagi sinf ustunlari — mavjud sinflardan, bo'lmasa namunaviy ro'yxat.
  const classNames: string[] = LC_CLASSES.length
    ? LC_CLASSES.map((c: any) => c.name)
    : ['1A', '1B', '1D', '2A', '2B', '2D', '2E'];

  const headers = ["O'qituvchi", 'Fan\\Sinf', 'Xona', ...classNames];

  // Bitta qator yasash: [o'qituvchi, fan, xona, ...sinf bo'yicha soatlar]
  const row = (teacher: string, subject: string, room: string, hoursByClass: Record<string, number>) => {
    const r: (string | number)[] = [teacher, subject, room];
    classNames.forEach((cn) => r.push(hoursByClass[cn] ?? ''));
    return r;
  };

  const handleDownloadExample = () => {
    const c0 = classNames[0];
    const c1 = classNames[1] ?? classNames[0];
    const example: (string | number)[][] = [
      headers,
      row('Hasanova Dinora', 'Matematika', '1b', { [c0]: 5 }),
      row('Hasanova Dinora', 'Ona tili', '1b', { [c0]: 4 }),
      row('Hasanova Dinora', 'Texnologiya', '1b', { [c0]: 1 }),
      row('Hasanova Dinora', "O'qish", '1b', { [c0]: 4 }),
      row('Hasanova Dinora', 'Tabiat', '1b', { [c0]: 1 }),
      row('Hasanova Dinora', "Yo'l harakati qoidalari", '1b', { [c0]: 0.5 }),
      row('Halilova Xanifa', 'Matematika', '1a', { [c1]: 5 }),
      // Guruhli dars namunasi: bir xil (sinf, fan), ikki xil o'qituvchi.
      row('Aliyev Akmal', 'Ingliz tili', 'lingafon', { [c0]: 4 }),
      row('Valiyev Vali', 'Ingliz tili', 'lingafon', { [c0]: 4 }),
    ];

    const ws = XLSX.utils.aoa_to_sheet(example);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 3 ? 22 : 8 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Taqsimot');
    XLSX.writeFile(wb, 'darslar-shablon.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      await LessonService.importTemplate(file);
      toast.success("Excel muvaffaqiyatli yuklandi");
      onImported && onImported();
      onClose();
    } catch (err) {
      // Xatolik toast'i axios interceptor orqali ko'rsatiladi; bu yerda faqat fallback.
      toast.error("Faylni yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Excel'dan yuklash"
      sub="Taqsimot faylini yuklang yoki avval namunaviy shablonni yuklab oling. Ustunlar: O'qituvchi, Fan\Sinf, Xona va sinflar."
      onClose={onClose}
      width={560}
      footer={
        <>
          <button onClick={onClose} style={ghostBtnL}>Bekor</button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{ ...primaryBtnL, opacity: !file || uploading ? 0.5 : 1, cursor: !file || uploading ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? 'Yuklanmoqda…' : 'Yuklash'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 16 }}>
        {/* Dropzone / fayl tanlash */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed #E2E8F0', borderRadius: 14, padding: '36px 20px',
            textAlign: 'center' as const, cursor: 'pointer' as const, background: '#F8FAFC',
          }}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".xlsx,.xls"
          />
          {file ? (
            <>
              <div style={{ font: '700 14px Manrope', color: '#0F172A' }}>{file.name}</div>
              <div style={{ font: '500 12px Manrope', color: '#10B981', marginTop: 4 }}>Fayl tanlandi · yuklashga tayyor</div>
            </>
          ) : (
            <>
              <div style={{ font: '700 14px Manrope', color: '#0F172A' }}>Faylni tanlang yoki shu yerga tashlang</div>
              <div style={{ font: '500 12px Manrope', color: '#64748B', marginTop: 4 }}>Excel format (.xlsx, .xls)</div>
            </>
          )}
        </div>

        {/* Namunaviy shablon */}
        <button
          onClick={handleDownloadExample}
          style={{
            width: '100%', background: '#fff', color: '#4F46E5', border: '1.5px solid #E2E8F0',
            borderRadius: 10, padding: '11px', font: '700 13px Manrope', cursor: 'pointer' as const,
          }}
        >
          Namunaviy shablonni yuklab olish (.xlsx)
        </button>

        <div style={{ font: '500 11px Manrope', color: '#94A3B8', lineHeight: 1.6 }}>
          <b style={{ color: '#475569' }}>Eslatma:</b> har bir sinf ustunidagi katakka shu sinf uchun
          haftalik soatni yozing (yarim soat — <code>0,5</code>). Bir xil sinf va fanga ikki xil
          o'qituvchi yozilsa — guruhli dars sifatida import qilinadi.
        </div>
      </div>
    </Modal>
  );
}
