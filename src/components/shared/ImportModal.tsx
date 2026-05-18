import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ImportModalProps {
  title: string;
  description: string;
  onImport: (data: any[]) => Promise<void>;
  onClose: () => void;
  templateName?: string;
  templateColumns: string[];
  mapping: (row: any) => any;
}

export default function ImportModal({ 
  title, description, onImport, onClose, 
  templateName = 'template.xlsx', templateColumns, mapping 
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      parseFile(f);
    }
  };

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);
        
        if (json.length === 0) {
          toast.error("Fayl bo'sh yoki noto'g'ri formatda");
          return;
        }
        
        setData(json);
      } catch (err) {
        toast.error("Faylni o'qishda xatolik yuz berdi");
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      Object.fromEntries(templateColumns.map(c => [c, '']))
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, templateName);
  };

  const handleConfirm = async () => {
    if (!data) return;
    try {
      setIsLoading(true);
      const mapped = data.map(mapping);
      await onImport(mapped);
      onClose();
    } catch (err) {
      toast.error("Import qilishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <header style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', margin: 0 }}>{title}</h3>
            <p style={{ font: '500 13px Manrope', color: '#64748B', margin: '4px 0 0' }}>{description}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </header>

        <div style={{ padding: 28 }}>
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #E2E8F0', borderRadius: 16, padding: '48px 20px',
                textAlign: 'center', cursor: 'pointer', transition: 'all 150ms',
                background: '#F8FAFC'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.background = '#EEF2FF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px -2px rgba(79,70,229,0.12)' }}>
                <Upload size={24} />
              </div>
              <div style={{ font: '700 15px Manrope', color: '#0F172A' }}>Faylni tanlang yoki shu yerga tashlang</div>
              <div style={{ font: '500 13px Manrope', color: '#64748B', marginTop: 4 }}>Excel (.xlsx, .xls) yoki CSV formatida</div>
            </div>
          ) : (
            <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -2px rgba(16,185,129,0.12)' }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '700 14px Manrope', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                <div style={{ font: '600 12px Manrope', color: '#10B981' }}>{data?.length || 0} ta qator aniqlandi</div>
              </div>
              <button onClick={() => { setFile(null); setData(null); }} style={{ border: 0, background: 'transparent', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          )}

          <button 
            onClick={handleDownloadTemplate}
            style={{ 
              marginTop: 20, width: '100%', background: '#fff', color: '#4F46E5', border: '1.5px solid #E2E8F0',
              borderRadius: 12, padding: '12px', font: '700 13px Manrope', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Download size={14} />
            Namunaviy shablonni yuklab olish
          </button>
        </div>

        <footer style={{ padding: '20px 28px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', font: '700 14px Manrope', color: '#475569', cursor: 'pointer' }}>Bekor qilish</button>
          <button 
            disabled={!data || isLoading}
            onClick={handleConfirm}
            style={{ 
              flex: 1, padding: '12px', borderRadius: 12, border: 0, 
              background: !data ? '#E2E8F0' : '#4F46E5', color: '#fff', 
              font: '700 14px Manrope', cursor: !data ? 'not-allowed' : 'pointer',
              boxShadow: !data ? 'none' : '0 10px 15px -3px rgba(79,70,229,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Importni boshlash
          </button>
        </footer>
      </div>
    </div>
  );
}
