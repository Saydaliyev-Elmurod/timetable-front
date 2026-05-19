import React from 'react';
import {
  LC_CLASSES,
  blockExpand,
  subjById,
  subjColors,
} from './catalog';
import {
  Bullets,
  Modal,
  Note,
  ghostBtnL,
  iCode,
  primaryBtnL,
} from './ui';

// ─── BulkPaste modal ─────────────────────────────────────────────────────────

const pTd = { padding: '7px 8px' };

export function BulkPasteModal({ onClose, onApply }: any) {
  const sample = `Sinf\tFan\tO'qituvchi\tXona\tSoat\tBlok
10-A\tMatematika\tN. Karimova\t204\t6\t2+2+1+1
10-A\tOna tili\tM. Yusupov\t208\t3\t1
10-A,10-B,10-V\tFizika\tA. Rahmonov\t305\t3\t2+1`;
  const [text, setText] = React.useState(sample);
  const parsed = React.useMemo(() => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const out = [];
    for (const ln of lines.slice(1)) {
      const c = ln.split('\t');
      if (c.length < 5) continue;
      out.push({
        classes: c[0].split(',').map((x) => x.trim()),
        subject: c[1],
        teacher: c[2],
        room: c[3],
        hours: parseInt(c[4], 10) || 0,
        block: c[5] || '1',
      });
    }
    return out;
  }, [text]);

  return (
    <Modal title="Excel'dan joylash" sub="Google Sheets yoki Excel'dan tanlangan kataklarni shu yerga joylang. Ustunlar avtomatik aniqlanadi."
      onClose={onClose} width={760}
      footer={
        <>
          <button onClick={onClose} style={ghostBtnL}>Bekor</button>
          <button onClick={() => { onApply(parsed); onClose(); }} style={primaryBtnL}>
            {parsed.length} ta darsni qo'shish
          </button>
        </>
      }>
      <div style={{ display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 14, height: 380 }}>
        <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 8 }}>
          <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B' }}>1. Joylang (Ctrl+V)</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1, resize: 'none', font: '500 12px JetBrains Mono',
              background: '#0F172A', color: '#E2E8F0',
              border: '1px solid #1E293B', borderRadius: 10, padding: 12, outline: 0,
              lineHeight: 1.6,
            }} />
          <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>
            <span style={{ color: '#4F46E5', fontWeight: 600 }}>Maslahat:</span> Bir nechta sinfni vergul bilan ajrating — masalan <code style={iCode}>10-A,10-B,10-V</code>
          </div>
        </div>
        <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 8 }}>
          <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B' }}>2. Ko'rib chiqing</div>
          <div style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'auto' as const, background: '#FAFBFD' }}>
            {parsed.length === 0 ? (
              <div style={{ padding: 20, color: '#94A3B8', font: '500 13px Manrope' }}>Yana ma'lumot kerak…</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', font: '500 12px Manrope' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    {['Sinf', 'Fan', 'O\'q', 'Xona', 'Soat', 'Blok'].map((h: any) => (
                      <th key={h} style={{ padding: '6px 8px', font: '700 10px Plus Jakarta Sans', letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#64748B', textAlign: 'left' as const, position: 'sticky' as const, top: 0, background: '#F1F5F9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r: any, i: any) => (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={pTd}>
                        <div style={{ display: 'flex' as const, gap: 3, flexWrap: 'wrap' as const }}>
                          {r.classes.map((c: any) => <span key={c} style={{ font: '700 10px JetBrains Mono', padding: '2px 5px', borderRadius: 4, background: '#EEF2FF', color: '#4338CA' }}>{c}</span>)}
                        </div>
                      </td>
                      <td style={pTd}>{r.subject}</td>
                      <td style={pTd}>{r.teacher}</td>
                      <td style={{ ...pTd, font: '600 11px JetBrains Mono' }}>{r.room}</td>
                      <td style={{ ...pTd, font: '700 12px JetBrains Mono', color: '#0F172A' }}>{r.hours}</td>
                      <td style={{ ...pTd, font: '500 11px JetBrains Mono', color: '#64748B' }}>{r.block}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>
            {parsed.length} ta qator aniqlandi · saqlashdan oldin har biri tekshiriladi
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATES = [
  {
    id: 't1', name: "10-sinf umumiy ta'lim", desc: 'Standart 5–11 sinf reja, 30 soat',
    subs: [
      ['mat', 6, '2+2+1+1'], ['ona', 3, '1'], ['adb', 3, '1'],
      ['ing', 4, '2+2', 'GROUP'], ['rus', 2, '1'],
      ['fiz', 3, '2+1'], ['kim', 2, '2'], ['bio', 2, '1'],
      ['geo', 1, '1'], ['tar', 2, '1'], ['inf', 2, '2', 'GROUP'],
      ['spo', 2, '1'],
    ],
  },
  {
    id: 't2', name: "7-sinf umumiy ta'lim", desc: "O'rta bo'g'in standart reja",
    subs: [
      ['mat', 5, '2+2+1'], ['ona', 3, '1'], ['adb', 2, '1'],
      ['ing', 3, '2+1', 'GROUP'], ['rus', 2, '1'],
      ['fiz', 2, '2'], ['bio', 2, '1'], ['geo', 2, '1'],
      ['tar', 2, '1'], ['inf', 1, '1'], ['spo', 2, '1'],
      ['mus', 1, '1'], ['chz', 1, '1'],
    ],
  },
  {
    id: 't3', name: "Lingvistik yo'nalish", desc: 'Til chuqurlashtirilgan, 11 soat til',
    subs: [
      ['mat', 4, '2+2'], ['ona', 3, '1'], ['adb', 3, '1'],
      ['ing', 6, '2+2+1+1', 'GROUP'], ['rus', 3, '2+1', 'GROUP'],
      ['fiz', 2, '2'], ['kim', 2, '2'],
      ['tar', 2, '1'], ['inf', 2, '2', 'GROUP'], ['spo', 2, '1'],
    ],
  },
];

export function TemplatesModal({ onClose, onApply }: any) {
  const [pickedTemplate, setPickedTemplate] = React.useState(TEMPLATES[0].id);
  const [pickedClasses, setPickedClasses] = React.useState(['10-A']);
  const T = TEMPLATES.find((t: any) => t.id === pickedTemplate);
  if (!T) return null;

  return (
    <Modal title="Shablondan dars qo'shish" sub="Tayyor o'quv reja shablonini tanlang va sinflarga qo'llang."
      onClose={onClose} width={800}
      footer={
        <>
          <span style={{ font: '500 12px Manrope', color: '#64748B', marginRight: 'auto' }}>
            {T.subs.length} ta fan × {pickedClasses.length} ta sinf = <b style={{ color: '#0F172A' }}>{T.subs.length * pickedClasses.length}</b> ta dars qo'shiladi
          </span>
          <button onClick={onClose} style={ghostBtnL}>Bekor</button>
          <button onClick={() => { onApply(T, pickedClasses); onClose(); }} style={primaryBtnL}>Qo'llash</button>
        </>
      }>
      <div style={{ display: 'grid' as const, gridTemplateColumns: '260px 1fr', gap: 18 }}>
        <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 8 }}>
          <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B' }}>Shablonlar</div>
          {TEMPLATES.map((t: any) => {
            const on = t.id === pickedTemplate;
            return (
              <button key={t.id} onClick={() => setPickedTemplate(t.id)} style={{
                textAlign: 'left' as const, cursor: 'pointer' as const,
                border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                background: on ? '#EEF2FF' : '#fff',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ font: '700 13px Manrope', color: on ? '#4338CA' : '#0F172A' }}>{t.name}</div>
                <div style={{ font: '500 11px Manrope', color: '#94A3B8', marginTop: 3 }}>{t.desc}</div>
                <div style={{ font: '500 10px JetBrains Mono', color: '#94A3B8', marginTop: 6 }}>
                  {t.subs.reduce((s: any, x: any) => s + x[1], 0)} soat / hafta
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B', marginBottom: 8 }}>Qo'llash uchun sinflar</div>
          <div style={{ display: 'flex' as const, flexWrap: 'wrap' as const, gap: 5, marginBottom: 18 }}>
            {LC_CLASSES.map((c: any) => {
              const on = pickedClasses.includes(c.name);
              return (
                <button key={c.name} onClick={() => {
                  setPickedClasses(on ? pickedClasses.filter((x) => x !== c.name) : [...pickedClasses, c.name]);
                }} style={{
                  font: '700 11px JetBrains Mono',
                  padding: '5px 9px', borderRadius: 7, cursor: 'pointer' as const,
                  border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  background: on ? '#EEF2FF' : '#fff',
                  color: on ? '#4338CA' : '#475569',
                }}>{c.name}</button>
              );
            })}
          </div>

          <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B', marginBottom: 8 }}>Reja tarkibi</div>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' as const }}>
            {T.subs.map(([sid, hrs, blk, flag]: any, i: number) => {
              const s = subjById(String(sid));
              if (!s) return null;
              const [bg, fg, _bar] = subjColors(s);
              const parts = blockExpand(String(blk));
              return (
                <div key={i} style={{ display: 'grid' as const, gridTemplateColumns: '160px 1fr 60px 60px', alignItems: 'center' as const, padding: '7px 12px', borderTop: i ? '1px solid #F1F5F9' : 'none', background: i % 2 ? '#FAFBFD' : '#fff' }}>
                  <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: bg, color: fg, font: '800 10px Plus Jakarta Sans', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{s.short[0]}</span>
                    <span style={{ font: '600 13px Manrope', color: '#0F172A' }}>{s.name}</span>
                  </div>
                  <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 6 }}>
                    <div style={{ display: 'flex' as const, gap: 2 }}>
                      {parts.map((p: any, j: any) => (<div key={j} style={{ width: p === 2 ? 14 : 6, height: 9, borderRadius: 2, background: '#CBD5E1' }} />))}
                    </div>
                    <span style={{ font: '500 11px JetBrains Mono', color: '#94A3B8' }}>{blk}</span>
                    {flag === 'GROUP' && <span style={{ font: '700 9px Plus Jakarta Sans', color: '#0D9488', background: '#F0FDFA', padding: '2px 5px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>guruh</span>}
                  </div>
                  <div style={{ font: '700 13px JetBrains Mono', color: '#0F172A', textAlign: 'right' as const }}>{hrs}h</div>
                  <div style={{ font: '500 11px Manrope', color: '#94A3B8', textAlign: 'right' as const }}>haftada</div>
                </div>
              );
            })}
          </div>
          <div style={{ font: '500 11px Manrope', color: '#94A3B8', marginTop: 10 }}>
            <span style={{ color: '#4F46E5', fontWeight: 600 }}>Diqqat:</span> shablon yaratgandan keyin har bir darsga o'qituvchi va xona biriktirilishi kerak.
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Design notes drawer ─────────────────────────────────────────────────────

export function DesignNotes({ open, onClose }: any) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.45)',
      zIndex: 120, display: 'flex' as const, justifyContent: 'flex-end' as const, animation: 'fade 200ms ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 480, maxWidth: '90vw', height: '100vh', background: '#fff',
        boxShadow: '-20px 0 40px -12px rgba(15,23,42,0.18)',
        display: 'flex' as const, flexDirection: 'column' as const, overflow: 'hidden' as const,
        animation: 'slideLeft 280ms cubic-bezier(0.22,1,0.36,1)',
        fontFamily: 'Manrope',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
          <div>
            <div style={{ font: '700 10px Plus Jakarta Sans', letterSpacing: '.16em', textTransform: 'uppercase' as const, color: '#4F46E5' }}>UX wireframe logikasi</div>
            <div style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em', marginTop: 3 }}>Darslar reja sahifasi</div>
          </div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer' as const, color: '#94A3B8', padding: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' as const, padding: '18px 24px 60px' }}>
          <Note num="1" h="Asosiy maqsad — minimal klik, maksimal qator">
            Direktor yoki o'quv ishlari bo'yicha mudir sahifaga kelganda, uning vazifasi ~150–300 ta dars yozuvini bir o'tirishda kiritish. Excel-gridning afzalligi — har bir maydon ko'rinib turadi va o'qish tartibida tab bosib tezda to'ldiriladi. Biz Excelga taqlid qildik, ammo har bir katakni "smart"laштirdik.
          </Note>
          <Note num="2" h="Sahifa tuzilishi">
            <Bullets items={[
              "Yuqori — breadcrumb + jadval nomi + ko'rinish almashtirgich (Ro'yxat / Matritsa) + 3 ta amal: Shablon, Excel'dan, Saqlash",
              "Chap — mavjud sidebar (E-timetable navigatsiyasi)",
              "Markaz — Smart Grid: har bir qator = bitta dars ta'rifi",
              "O'ng — Tekshiruv paneli: muammolar, sinf yuklari, o'qituvchi yuklari (real vaqtda hisoblanadi)",
            ]} />
          </Note>
          <Note num="3" h="Dropdown'lar — autocomplete + kontekstli filtr">
            <Bullets items={[
              "Har bir katak bosilganda PASTGA ochiluvchi popover keladi (modal emas — fokus yo'qolmaydi)",
              "Birinchi maydon — qidiruv inputi, avtomatik fokus. Yozish — filtr",
              "↑ ↓ — tanlash, ⏎ — qabul qilish, Tab — keyingi katakka o'tish",
              "Fan tanlangach, O'qituvchi popoveri AVTOMATIK shu fan o'qituvchilarini ko'rsatadi (boshqalarni ko'rish — bitta checkbox)",
              "Fan tanlangach, Xona popoveri ham faqat mos xonalarni chiqaradi (lab/sport zali/lingafon)",
              "Har bir o'qituvchi yonida — joriy yuk bar (18/22h) — to'lib kelganlarni darrov ko'rasiz",
            ]} />
          </Note>
          <Note num="4" h="Sinflar — bitta katakda bir nechta">
            "10-A, 10-B, 10-V haftada 6 soat matematika" — 3 ta qator emas, BITTA qator. Sinf katagi multi-select chip picker. Sinflar parallellar (5-sinflar, 6-sinflar…) bo'yicha guruhlangan; "barchasini tanlash" tugmasi parallel butun darajaga qo'llaydi.
          </Note>
          <Note num="5" h="Guruhga bo'lish (group split)">
            O'qituvchi katagining yonida <code style={iCode}>+ guruh</code> tugmasi. Bosilganda — qator ichida vertikal kengaytma: A guruh va B guruh, har biriga alohida o'qituvchi va alohida xona. Fan esa umumiy bo'lib qoladi (qoidaga muvofiq). Ikkala guruh soati ham bir xil — chunki bir vaqtda o'tiladi. <code style={iCode}>×</code> — guruhdan chiqarish.
          </Note>
          <Note num="6" h="Soat va blok (ketma-ket dars)">
            Soat katagi bosilganda mini-panel ochiladi: yuqorida ± stepper bilan haftalik soat, pastida — soat soniga MOS keladigan tayyor blok shakllari ("5 = 1+1+1+1+1", "5 = 2+1+1+1", "5 = 2+2+1"…). Foydalanuvchi 1-2 marta bosib variantni tanlaydi. Qator yon tomonida — visual preview: kvadratchalar (qisqalar — 1 soat, kengroq — 2 soatli juftlik). Default — <code style={iCode}>1</code>.
          </Note>
          <Note num="7" h="Ommaviy kiritish (Bulk)">
            <Bullets items={[
              "Excel'dan joylash — modal: chap tomonda paste-textarea (TSV), o'ng tomonda real-time preview jadvali. Saqlashdan oldin har bir qator validatsiyadan o'tadi",
              "Shablondan — tayyor reja shablonlari (masalan: 10-sinf umumiy, 7-sinf umumiy, Lingvistik). Foydalanuvchi shablon + sinflar tanlaydi → N×M qator generatsiya",
              "Dublikat — har bir qatorda ⌘D yoki ikonka: aniq nusxa pastda paydo bo'ladi, faqat sinfni o'zgartirish kerak",
              "Multi-select — qator chap chetida checkbox; tanlanganlarga: kopiya, o'chir, soatlarni o'zgartir",
            ]} />
          </Note>
          <Note num="8" h="Klaviatura mantiqsi">
            <Bullets items={[
              "Tab/Shift+Tab — kataklar o'qish tartibida",
              "Enter (oxirgi qatorda) — yangi bo'sh qator",
              "Esc — popover yopish",
              "⌘D — qatorni dublikat qilish",
              "⌘V Excel'dan paste — Bulk Paste modal'i avtomatik ochiladi",
              "Sinf qatorlari guruhlangan — har bir guruh boshida qator chetida sinf yorlig'i (10-A, 10-B…)",
            ]} />
          </Note>
          <Note num="9" h="Validatsiya — passiv, lekin doim ko'rinadigan">
            <Bullets items={[
              "Har bir qator oxirida — ✓ (tayyor) yoki ! (xato), hover qilganda — sabab",
              "O'ng panelda — top 5 muammo ro'yxati. Bosilganda o'sha qatorga aylanadi",
              "Sinf haftalik soat = umumiy soat (cheklov: 30–36, oshib ketsa qizil)",
              "O'qituvchi yuki barlari real vaqtda jiringlamasdan yangilanadi — siz darslarni kiritar ekansiz, panelda yuk to'lib boradi",
            ]} />
          </Note>
          <Note num="10" h="Matritsa ko'rinish (variant B)">
            Yuqoridagi switch'dan Matritsa'ga o'tasiz: qatorlar — fanlar, ustunlar — sinflar. Har bir katakda — haftalik soat. Bir qatorga to'ldirib chiqib "Matematika hamma 10-sinflarga 6 soatdan" deyish — 4 ta klik. ÷2 belgisi — guruhli darsligini bildiradi. Pastida — har sinfning umumiy yuki.
          </Note>
          <div style={{ height: 1, background: '#F1F5F9', margin: '18px 0' }} />
          <div style={{ font: '500 12px Manrope', color: '#94A3B8', lineHeight: 1.6 }}>
            <b style={{ color: '#0F172A' }}>Nima uchun shu yondashuv?</b> Excel tezligi — birinchi o'rinda. Lekin Excelda fan/o'qituvchi/xona nomlarini har safar qo'lda yozish — xato manbai. Smart Grid har bir maydonda kontekst beradi (rang chiplari, avatarlar, yuklar) — foydalanuvchi yozayotgan narsani DOIM ko'rib turadi, va ma'lumotlar baza bilan bog'lab keladi. Bu Notion'ning database view yoki Linear'ning issue gridiga eng yaqin paradigma.
          </div>
        </div>
      </div>
    </div>
  );
}
