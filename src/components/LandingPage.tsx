import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#" className="et-logo" style={{ textDecoration: 'none' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 7, boxSizing: 'border-box',
        boxShadow: '0 4px 12px -2px rgba(79,70,229,0.35)'
      }}>
        <div style={{ background: '#fff', borderRadius: 2, opacity: 0.95 }} />
        <div style={{ background: '#fff', borderRadius: 2, opacity: 0.55 }} />
        <div style={{ background: '#fff', borderRadius: 2, opacity: 0.55 }} />
        <div style={{ background: '#14B8A6', borderRadius: 2, position: 'relative' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ position: 'absolute', inset: 0, margin: 'auto' }}>
            <path d="M2.5 5.2 L4 6.7 L7.5 3.3" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <span style={{
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em',
        color: dark ? '#F8FAFC' : '#0F172A'
      }}>E-timetable</span>
    </a>
  );
}

function Header({ onGetStarted, onSignIn }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  const navItems = [
    { label: 'Afzalliklar', href: '#features' },
    { label: 'Qanday ishlaydi', href: '#how' },
    { label: 'Tariflar', href: '#pricing' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: scrolled || mobileOpen ? 'rgba(255,255,255,0.82)' : 'transparent',
      backdropFilter: scrolled || mobileOpen ? 'saturate(180%) blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled || mobileOpen ? 'saturate(180%) blur(12px)' : 'none',
      borderBottom: scrolled || mobileOpen ? '1px solid #E2E8F0' : '1px solid transparent',
      transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)'
    }}>
      <div className="et-header-inner">
        <Logo />
        <nav className="et-nav-desktop">
          {navItems.map(x => (
            <a key={x.label} href={x.href} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>{x.label}</a>
          ))}
        </nav>
        <div className="et-header-cta">
          <button className="btn btn-ghost et-signin" onClick={onSignIn}>Tizimga kirish</button>
          <button className="btn btn-primary" onClick={onGetStarted}>Boshlash</button>
        </div>
        <button
          className="et-burger"
          aria-label="Menyu"
          onClick={() => setMobileOpen(v => !v)}
        >
          <span style={{ transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>
      {mobileOpen && (
        <div className="et-mobile-panel">
          {navItems.map(x => (
            <a key={x.label} href={x.href} onClick={() => setMobileOpen(false)}
              style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 600, color: '#0F172A', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
              {x.label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <button className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }} onClick={() => { setMobileOpen(false); onSignIn(); }}>Tizimga kirish</button>
            <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }} onClick={() => { setMobileOpen(false); onGetStarted(); }}>Boshlash</button>
          </div>
        </div>
      )}
    </header>
  );
}

function MiniTimetable() {
  const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju'];
  const cells: (string | null)[][] = [
    ['Matem', 'Ing', 'Ona t', 'Fizika', 'Tarix'],
    ['Ona t', 'Matem', 'Ing',  null,     'Kimyo'],
    ['Sport', 'Tarix', 'Matem','Ing',    'Fizika'],
    ['Ing',   'Fizika', 'Kimyo','Matem', 'Biol'],
    [null,    'Geog',  'Ona t','Tarix', 'Ing'],
    ['Biol',  'Ing',   'Matem','Sport', null],
  ];
  const colors: Record<string, { bg: string; fg: string }> = {
    Matem: { bg: '#EEF2FF', fg: '#4338CA' },
    Ing:   { bg: '#F0FDFA', fg: '#0D9488' },
    'Ona t': { bg: '#FEF3C7', fg: '#B45309' },
    Fizika:{ bg: '#FCE7F3', fg: '#9D174D' },
    Tarix: { bg: '#DBEAFE', fg: '#1D4ED8' },
    Kimyo: { bg: '#E0E7FF', fg: '#3730A3' },
    Sport: { bg: '#ECFCCB', fg: '#4D7C0F' },
    Biol:  { bg: '#F0FDFA', fg: '#0F766E' },
    Geog:  { bg: '#FEE2E2', fg: '#B91C1C' },
  };
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 20,
      boxShadow: '0 32px 64px -16px rgba(15,23,42,0.20), 0 0 0 1px #E2E8F0',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>10-"A" sinfi</div>
          <div style={{ fontFamily: 'Manrope', fontSize: 12, color: '#64748B', marginTop: 2 }}>Haftalik jadval · Shanba 18 Apr</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDFA', color: '#0D9488', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#14B8A6' }} />
          Konfliktsiz
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5, 1fr)', gap: 4 }}>
        <div />
        {days.map(d => (
          <div key={d} style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
        ))}
        {cells.map((row, i) => (
          <React.Fragment key={i}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</div>
            {row.map((c, j) => c ? (
              <div key={j} style={{ background: colors[c].bg, color: colors[c].fg, borderRadius: 6, padding: '7px 4px', fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, textAlign: 'center', minHeight: 30 }}>{c}</div>
            ) : (
              <div key={j} style={{ background: '#F8FAFC', borderRadius: 6, border: '1px dashed #E2E8F0', minHeight: 30 }} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 24, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 500, color: '#64748B' }}>{label}</div>
    </div>
  );
}

function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{
      position: 'relative',
      paddingTop: 48, paddingBottom: 96,
      background: `
        radial-gradient(1200px 600px at 10% 0%, #EEF2FF 0%, transparent 60%),
        radial-gradient(800px 400px at 90% 20%, #CCFBF1 0%, transparent 60%),
        #FFFFFF
      `,
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div className="et-hero-grid" style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 32px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 999, boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#14B8A6' }} />
            <span style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 600, color: '#334155' }}>emaktab.uz bilan integratsiya</span>
          </div>
          <h1 className="et-hero-h1" style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.025em',
            color: '#0F172A', margin: '20px 0 20px', textWrap: 'balance'
          }}>
            Maktab dars jadvalini tuzish <span style={{ background: 'linear-gradient(90deg, #4F46E5 0%, #14B8A6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>endi muammo emas.</span>
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: 18, lineHeight: 1.55, color: '#475569', maxWidth: 520, margin: 0 }}>
            Google OR-Tools optimizatsiya algoritmlari yordamida bir necha haftalik mehnatingizni soniyalarda bajaring. E-maktab.uz bilan to'liq integratsiya qilingan tizim.
          </p>
          <div className="et-hero-ctas" style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Bepul sinab ko'rish →</button>
            <button className="btn btn-secondary btn-lg">Demo ko'rish</button>
          </div>
          <div className="et-hero-stats" style={{ display: 'flex', gap: 28, marginTop: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stat value="200+" label="maktab" />
            <div className="et-stat-divider" style={{ width: 1, height: 28, background: '#E2E8F0' }} />
            <Stat value="1.2 mln" label="dars taqsimlangan" />
            <div className="et-stat-divider" style={{ width: 1, height: 28, background: '#E2E8F0' }} />
            <Stat value="0" label="konflikt" />
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <MiniTimetable />
          <div className="et-hero-toast" style={{
            position: 'absolute', bottom: -18, left: -18,
            background: '#0F172A', color: '#fff', borderRadius: 14, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Manrope', fontSize: 13,
            boxShadow: '0 20px 40px -12px rgba(15,23,42,0.30)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>847 ta dars · <b style={{ color: '#14B8A6' }}>2.3 soniyada</b></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      ),
      title: 'E-maktab.uz integratsiyasi',
      body: "O'qituvchilar, sinflar va fanlarni qo'lda kiritishga hojat yo'q. Bir marta bosish orqali emaktab.uz tizimidan barcha ma'lumotlarni tortib oling."
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2v10l7 4"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
      ),
      title: 'Google OR-Tools algoritmi',
      body: "Darslarning ustma-ust tushib qolishi nolga teng. Matematik optimizatsiya o'qituvchilarning 'oynalarini' minimallashtiradi."
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      ),
      title: 'Tezlik va moslashuvchanlik',
      body: "A/B haftalik jadvallar, murakkab guruhlar (1-guruh/2-guruh) va xonalar yetishmovchiligini inobatga olgan holda 1000+ darslarni soniyalarda taqsimlaydi."
    }
  ];
  return (
    <section id="features" className="et-section" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Afzalliklari</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            Nega direktorlar E-timetable ni tanlaydi?
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14, lineHeight: 1.55 }}>
            Uch soha: ma'lumot, algoritm, tezlik. Hammasi bir joyda.
          </p>
        </div>
        <div className="et-grid-3">
          {items.map((f, i) => (
            <div key={i} style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28,
              boxShadow: '0 4px 12px -2px rgba(15,23,42,0.04)',
              transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)', cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(15,23,42,0.12)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: '#EEF2FF', color: '#4F46E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 20, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontFamily: 'Manrope', fontSize: 15, lineHeight: 1.6, color: '#475569', margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ emoji, tier, desc, price, perks, popular, cta, onClick }: any) {
  const color = popular ? '#fff' : '#0F172A';
  const sub = popular ? 'rgba(255,255,255,0.82)' : '#64748B';
  const border = popular ? 'transparent' : '#E2E8F0';
  const bg = popular ? 'linear-gradient(180deg, #4F46E5 0%, #4338CA 100%)' : '#fff';
  return (
    <div style={{
      background: bg, borderRadius: 24, padding: 32, position: 'relative',
      border: `1px solid ${border}`,
      boxShadow: popular ? '0 32px 64px -16px rgba(79,70,229,0.45)' : '0 4px 12px -2px rgba(15,23,42,0.06)',
      transform: popular ? 'translateY(-8px)' : 'none'
    }}>
      {popular && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: '#14B8A6', color: '#fff', fontFamily: 'Manrope', fontSize: 11, fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', borderRadius: 999,
          boxShadow: '0 8px 20px -4px rgba(20,184,166,0.45)'
        }}>⭐ Ommabop</div>
      )}
      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 22, color, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>{tier}
      </div>
      <p style={{ fontFamily: 'Manrope', fontSize: 13, color: sub, margin: '6px 0 22px' }}>{desc}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 40, color, letterSpacing: '-0.02em' }}>{price}</div>
        {price !== 'Bepul' && <div style={{ fontFamily: 'Manrope', fontSize: 13, color: sub }}>so'm/oy</div>}
      </div>
      <div style={{ height: 1, background: popular ? 'rgba(255,255,255,0.18)' : '#E2E8F0', margin: '22px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {perks.map((p: string, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Manrope', fontSize: 14, color }}>
            <span style={{
              width: 20, height: 20, borderRadius: 999,
              background: popular ? 'rgba(255,255,255,0.18)' : '#F0FDFA',
              color: popular ? '#fff' : '#14B8A6',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            {p}
          </div>
        ))}
      </div>
      <button style={{
        display: 'block', width: '100%', marginTop: 28, padding: '13px 18px', border: 0, cursor: 'pointer',
        borderRadius: 10, fontFamily: 'Manrope', fontWeight: 700, fontSize: 14,
        background: popular ? '#fff' : '#0F172A',
        color: popular ? '#4338CA' : '#fff',
        transition: 'transform 150ms'
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
      onClick={onClick}
      >{cta}</button>
    </div>
  );
}

function Pricing({ popularTier = 'mini', onGetStarted }: { popularTier?: string, onGetStarted: () => void }) {
  const tiers = [
    {
      key: 'free',
      emoji: '🎁', tier: 'Free', desc: "Kichik o'quv markazlari uchun.", price: 'Bepul',
      perks: ['15 ta o\'qituvchi', '20 ta fan', '10 ta sinf', 'Asosiy funksiyalar'],
      cta: 'Hozir boshlang'
    },
    {
      key: 'mini',
      emoji: '🚀', tier: 'Mini', desc: "O'rta maktablar uchun.", price: '149 000',
      perks: ['50 ta o\'qituvchi', '50 ta fan', '50 ta sinf', 'emaktab.uz importi', 'Prioritet qo\'llab-quvvatlash'],
      cta: 'Mini tarifni tanlash'
    },
    {
      key: 'max',
      emoji: '🏢', tier: 'Max', desc: 'Katta maktab va kollejlar uchun.', price: '349 000',
      perks: ['200 ta o\'qituvchi', '200 ta fan', '200 ta sinf', 'Premium algoritm', 'PDF / Excel eksport', 'Shaxsiy menejer'],
      cta: "Max tarifga o'tish"
    }
  ];
  return (
    <section id="pricing" className="et-section" style={{ background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 72px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Tariflar</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            O'quv dargohingizga mos tarif
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14 }}>
            Bepul tarifda boshlang. Xohlagan paytda kattaroq rejaga o'ting.
          </p>
        </div>
        <div className="et-grid-3" style={{ alignItems: 'start' }}>
          {tiers.map(({ key, ...t }) => (
            <PricingCard key={key} {...t} popular={key === popularTier} onClick={onGetStarted} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Ro\'yxatdan o\'ting', d: 'emaktab.uz hisobingiz bilan 30 soniyada kiring.' },
    { n: '02', t: 'Ma\'lumotlarni import qiling', d: 'O\'qituvchilar, sinflar va fanlar bir bosishda tortiladi.' },
    { n: '03', t: 'Cheklovlarni sozlang', d: 'Xonalar, guruhlar, A/B hafta — ularning hammasi.' },
    { n: '04', t: 'Tayyor jadvalni yuklab oling', d: 'PDF, Excel yoki emaktab.uz ga qayta yuboring.' },
  ];
  return (
    <section id="how" className="et-section" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Qanday ishlaydi</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
            To'rt bosqich. Soniyalar.
          </h2>
        </div>
        <div className="et-grid-4" style={{ position: 'relative' }}>
          <div className="et-how-line" />
          {steps.map((s) => (
            <div key={s.n} style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999,
                background: '#fff', border: '2px solid #E0E7FF',
                color: '#4F46E5', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px -2px rgba(79,70,229,0.15)',
                marginBottom: 20
              }}>{s.n}</div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 18, margin: '0 0 8px', color: '#0F172A' }}>{s.t}</h3>
              <p style={{ fontFamily: 'Manrope', fontSize: 14, lineHeight: 1.55, color: '#64748B', margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{ padding: '48px 20px 112px', background: '#F8FAFC' }}>
      <div className="et-cta-band" style={{
        maxWidth: 1100, margin: '0 auto',
        background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
        borderRadius: 28, color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.5
        }} />
        <div style={{ position: 'relative' }}>
          <h2 className="et-cta-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
            Jadval tuzishga haftalar emas,<br/>soniyalar sarflang.
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: 'rgba(255,255,255,0.82)', marginTop: 16 }}>
            14 kun bepul. Karta kerak emas.
          </p>
          <div className="et-cta-buttons" style={{ display: 'inline-flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={onGetStarted} style={{
              background: '#fff', color: '#4338CA', border: 0, cursor: 'pointer',
              fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, padding: '14px 24px', borderRadius: 10,
              boxShadow: '0 8px 20px -4px rgba(0,0,0,0.25)'
            }}>Bepul sinab ko'rish →</button>
            <button style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
              fontFamily: 'Manrope', fontWeight: 600, fontSize: 15, padding: '14px 24px', borderRadius: 10
            }}>Demo buyurtma qilish</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#0B0F1A', color: '#CBD5E1', padding: '64px 20px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="et-footer-grid" style={{ paddingBottom: 48, borderBottom: '1px solid #1E293B' }}>
          <div>
            <Logo dark />
            <p style={{ fontFamily: 'Manrope', fontSize: 14, color: '#94A3B8', marginTop: 16, maxWidth: 320, lineHeight: 1.6 }}>
              O'zbekiston maktablari uchun sun'iy intellekt asosida ishlaydigan dars jadvali platformasi.
            </p>
          </div>
          {[
            { h: 'Mahsulot', l: [{t:'Afzalliklar',h:'#features'}, {t:'Qanday ishlaydi',h:'#how'}, {t:'Tariflar',h:'#pricing'}, {t:"Yangiliklar",h:'#'}] },
            { h: 'Kompaniya', l: [{t:'Biz haqimizda',h:'#'}, {t:'Mijozlar',h:'#'}, {t:'Blog',h:'#'}, {t:'Aloqa',h:'#'}] },
            { h: 'Huquqiy', l: [{t:'Maxfiylik',h:'#'}, {t:'Shartlar',h:'#'}, {t:'Oferta',h:'#'}] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 16, letterSpacing: '0.02em' }}>{col.h}</div>
              {col.l.map(i => (
                <a key={i.t} href={i.h} style={{ display: 'block', fontFamily: 'Manrope', fontSize: 14, color: '#94A3B8', textDecoration: 'none', padding: '6px 0' }}>{i.t}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="et-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, fontFamily: 'Manrope', fontSize: 13, color: '#64748B', flexWrap: 'wrap', gap: 16 }}>
          <div>E-timetable.uz © 2026. Barcha huquqlar himoyalangan.</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#" style={{ color: '#94A3B8' }}>Telegram</a>
            <a href="#" style={{ color: '#94A3B8' }}>Instagram</a>
            <a href="#" style={{ color: '#94A3B8' }}>YouTube</a>
            <a href="mailto:info@e-timetable.uz" style={{ color: '#94A3B8' }}>info@e-timetable.uz</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="et-landing-page">
      <Header onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <Hero onGetStarted={onGetStarted} />
      <Features />
      <HowItWorks />
      <Pricing popularTier="mini" onGetStarted={onGetStarted} />
      <CTA onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}