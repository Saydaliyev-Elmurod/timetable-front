import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { useTranslation, Locale } from '@/i18n/index';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

function Logo({ dark = false }: { dark?: boolean }) {
  // Calendar-style monogram: indigo card with binder rings + date dots,
  // one teal-highlighted date represents a scheduled lesson.
  return (
    <a href="#" className="et-logo" style={{ textDecoration: 'none' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        position: 'relative',
        boxShadow: '0 6px 16px -4px rgba(79,70,229,0.45)',
        overflow: 'hidden',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="et-logo-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6366F1"/>
              <stop offset="1" stopColor="#312E81"/>
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="10" fill="url(#et-logo-bg)"/>

          {/* Binder rings */}
          <rect x="12.5" y="6.5" width="2.5" height="5.2" rx="1.25" fill="#fff"/>
          <rect x="21" y="6.5" width="2.5" height="5.2" rx="1.25" fill="#fff"/>

          {/* Calendar body */}
          <rect x="8.5" y="10.5" width="19" height="18" rx="2.6"
                fill="none" stroke="#fff" strokeWidth="1.7"/>
          <line x1="8.5" y1="15.4" x2="27.5" y2="15.4" stroke="#fff" strokeWidth="1.4"/>

          {/* Date dots — one teal "scheduled" */}
          <circle cx="13" cy="19.5" r="1.25" fill="#fff" opacity="0.55"/>
          <circle cx="18" cy="19.5" r="1.25" fill="#fff" opacity="0.55"/>
          <circle cx="23" cy="19.5" r="1.7"  fill="#14B8A6"/>
          <circle cx="13" cy="24"   r="1.25" fill="#fff" opacity="0.55"/>
          <circle cx="18" cy="24"   r="1.25" fill="#fff" opacity="0.55"/>
          <circle cx="23" cy="24"   r="1.25" fill="#fff" opacity="0.55"/>
        </svg>
      </div>
      <span style={{
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em',
        color: dark ? '#F8FAFC' : '#0F172A'
      }}>E-timetable</span>
    </a>
  );
}

function LangSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const opts: { id: Locale; label: string; code: string }[] = [
    { id: 'uz', label: "O'zbekcha", code: 'UZ' },
    { id: 'ru', label: 'Русский',  code: 'RU' },
    { id: 'en', label: 'English',  code: 'EN' },
  ];
  const current = opts.find(o => o.id === locale) || opts[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13,
          color: '#334155', background: '#fff',
          border: '1px solid #E2E8F0', borderRadius: 999,
          padding: '7px 12px 7px 10px', cursor: 'pointer',
          transition: 'all 160ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ letterSpacing: '0.03em' }}>{current.code}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div role="listbox" style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          boxShadow: '0 20px 40px -12px rgba(15,23,42,0.20)',
          minWidth: 160, padding: 6, zIndex: 50,
          animation: 'et-lang-pop 160ms ease-out',
        }}>
          {opts.map(o => {
            const active = locale === o.id;
            return (
              <button key={o.id}
                role="option"
                aria-selected={active}
                onClick={() => { setLocale(o.id); setOpen(false); }}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                  padding: '9px 12px', borderRadius: 8, border: 0, cursor: 'pointer',
                  background: active ? '#EEF2FF' : 'transparent',
                  color: '#0F172A', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 13,
                  transition: 'background 140ms',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                    color: active ? '#4F46E5' : '#94A3B8',
                    background: active ? '#fff' : '#F1F5F9',
                    padding: '3px 7px', borderRadius: 5, letterSpacing: '0.04em',
                  }}>{o.code}</span>
                  {o.label}
                </span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes et-lang-pop {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Header({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useTranslation();
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
    { label: t('landing.nav.features'),      href: '#features' },
    { label: t('landing.nav.constraints'),   href: '#constraints' },
    { label: t('landing.nav.capabilities'),  href: '#capabilities' },
    { label: t('landing.nav.how'),           href: '#how' },
    { label: t('landing.nav.pricing'),       href: '#pricing' },
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
            <a key={x.label} href={x.href} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#475569', textDecoration: 'none', whiteSpace: 'nowrap' }}>{x.label}</a>
          ))}
        </nav>
        <div className="et-header-cta">
          <LangSwitcher />
          <button className="btn btn-primary" onClick={onSignIn}>{t('landing.nav.signIn')}</button>
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <LangSwitcher />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }} onClick={() => { setMobileOpen(false); onSignIn(); }}>{t('landing.nav.signIn')}</button>
          </div>
        </div>
      )}
    </header>
  );
}

function MiniTimetable() {
  const { t } = useTranslation();
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
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{t('landing.hero.mtTitle')}</div>
          <div style={{ fontFamily: 'Manrope', fontSize: 12, color: '#64748B', marginTop: 2 }}>{t('landing.hero.mtSub')}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDFA', color: '#0D9488', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#14B8A6' }} />
          {t('landing.hero.mtConflictFree')}
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
  const { t } = useTranslation();
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
            <span style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 600, color: '#334155' }}>{t('landing.hero.badge')}</span>
          </div>
          <h1 className="et-hero-h1" style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.025em',
            color: '#0F172A', margin: '20px 0 20px', textWrap: 'balance'
          }}>
            {t('landing.hero.h1a')}{' '}<span style={{ background: 'linear-gradient(90deg, #4F46E5 0%, #14B8A6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('landing.hero.h1b')}</span>
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: 18, lineHeight: 1.55, color: '#475569', maxWidth: 520, margin: 0 }}>
            {t('landing.hero.sub')}
          </p>
          <div className="et-hero-ctas" style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>{t('landing.hero.cta1')} →</button>
            <a href="#how" className="btn btn-secondary btn-lg">{t('landing.hero.cta2')}</a>
          </div>
          <div className="et-hero-stats" style={{ display: 'flex', gap: 28, marginTop: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stat value="200+" label={t('landing.hero.stat1')} />
            <div className="et-stat-divider" style={{ width: 1, height: 28, background: '#E2E8F0' }} />
            <Stat value="1.2 mln" label={t('landing.hero.stat2')} />
            <div className="et-stat-divider" style={{ width: 1, height: 28, background: '#E2E8F0' }} />
            <Stat value="0" label={t('landing.hero.stat3')} />
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
            <span>847 {t('landing.hero.toastLessons')} · <b style={{ color: '#14B8A6' }}>{t('landing.hero.toastTime')}</b></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useTranslation();
  const items = [
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      ),
      title: t('landing.features.f1t'), body: t('landing.features.f1b')
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2v10l7 4"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
      ),
      title: t('landing.features.f2t'), body: t('landing.features.f2b')
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      ),
      title: t('landing.features.f3t'), body: t('landing.features.f3b')
    }
  ];

  return (
    <section id="features" className="et-section" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.features.eyebrow')}</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            {t('landing.features.h2')}
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14, lineHeight: 1.55 }}>
            {t('landing.features.lead')}
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

interface ConstraintItemProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: 'hard' | 'smart';
}

function ConstraintItem({ icon, title, body, tone }: ConstraintItemProps) {
  const colors = tone === 'hard'
    ? { bg: '#EEF2FF', fg: '#4338CA' }
    : { bg: '#F0FDFA', fg: '#0D9488' };
  return (
    <div style={{ display: 'flex', gap: 14, padding: '16px 0' }}>
      <div style={{
        flex: 'none', width: 40, height: 40, borderRadius: 10,
        background: colors.bg, color: colors.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{
          fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15.5,
          color: '#0F172A', margin: '4px 0 6px', letterSpacing: '-0.005em'
        }}>{title}</h4>
        <p style={{ fontFamily: 'Manrope', fontSize: 14, lineHeight: 1.6, color: '#475569', margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

interface ConstraintColumnProps {
  tag: string;
  tone: 'hard' | 'smart';
  title: string;
  subtitle: string;
  items: { icon: React.ReactNode; title: string; body: string }[];
}

function ConstraintColumn({ tag, tone, title, subtitle, items }: ConstraintColumnProps) {
  const accent = tone === 'hard' ? '#4F46E5' : '#0D9488';
  const tagBg  = tone === 'hard' ? '#EEF2FF' : '#F0FDFA';
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 24,
      padding: 32,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent,
      }} />

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: tagBg, color: accent,
        fontFamily: 'Manrope', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '6px 12px', borderRadius: 999, marginBottom: 18,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />
        {tag}
      </div>

      <h3 style={{
        fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 24,
        color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.015em', lineHeight: 1.2
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'Manrope', fontSize: 15, lineHeight: 1.55,
        color: '#64748B', margin: '0 0 14px', maxWidth: 420,
      }}>
        {subtitle}
      </p>

      <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <ConstraintItem {...it} tone={tone} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Constraints() {
  const { t } = useTranslation();
  const hard = [
    {
      title: t('landing.constraints.h1t'), body: t('landing.constraints.h1b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
      )
    },
    {
      title: t('landing.constraints.h2t'), body: t('landing.constraints.h2b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
      )
    },
    {
      title: t('landing.constraints.h3t'), body: t('landing.constraints.h3b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      )
    },
  ];

  const smart = [
    {
      title: t('landing.constraints.s1t'), body: t('landing.constraints.s1b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-2 7.5V18a4 4 0 0 0 4 4h.5"/><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1 2 7.5V18a4 4 0 0 1-4 4h-.5"/><path d="M12 2v20"/></svg>
      )
    },
    {
      title: t('landing.constraints.s2t'), body: t('landing.constraints.s2b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      )
    },
    {
      title: t('landing.constraints.s3t'), body: t('landing.constraints.s3b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>
      )
    },
    {
      title: t('landing.constraints.s4t'), body: t('landing.constraints.s4b'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/></svg>
      )
    },
  ];

  return (
    <section id="constraints" className="et-section" style={{ background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 56px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.constraints.eyebrow')}</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            {t('landing.constraints.h2')}
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14, lineHeight: 1.55 }}>
            {t('landing.constraints.lead')}
          </p>
        </div>

        <div className="et-constraints-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start'
        }}>
          <ConstraintColumn
            tag={t('landing.constraints.hardTag')}
            tone="hard"
            title={t('landing.constraints.hardTitle')}
            subtitle={t('landing.constraints.hardSub')}
            items={hard}
          />
          <ConstraintColumn
            tag={t('landing.constraints.smartTag')}
            tone="smart"
            title={t('landing.constraints.smartTitle')}
            subtitle={t('landing.constraints.smartSub')}
            items={smart}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .et-constraints-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function PreflightMock() {
  const { t } = useTranslation();
  const rows = [
    { ok: true,  t: t('landing.capabilities.pf1t'), d: t('landing.capabilities.pf1d') },
    { ok: true,  t: t('landing.capabilities.pf2t'), d: t('landing.capabilities.pf2d') },
    { ok: false, t: t('landing.capabilities.pf3t'), d: t('landing.capabilities.pf3d') },
    { ok: true,  t: t('landing.capabilities.pf4t'), d: t('landing.capabilities.pf4d') },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>preflight.check</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FEF3C7', color: '#B45309', fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: '#F59E0B' }} />
          {t('landing.capabilities.pfWarn')}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: r.ok ? '#F8FAFC' : '#FFFBEB',
            border: r.ok ? '1px solid #F1F5F9' : '1px solid #FDE68A',
            padding: '8px 10px', borderRadius: 8,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, flex: 'none',
              background: r.ok ? '#D1FAE5' : '#FEF3C7', color: r.ok ? '#059669' : '#B45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r.ok
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>{r.t}</div>
              <div style={{ fontFamily: 'Manrope', fontSize: 10.5, color: '#64748B' }}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticsMock() {
  const { t } = useTranslation();
  const metrics = [
    { label: t('landing.capabilities.diagConflicts'), value: '0',   tone: 'good' },
    { label: t('landing.capabilities.diagGaps'),      value: '−8',  tone: 'good' },
    { label: t('landing.capabilities.diagMorning'),   value: '87%', tone: 'ok'   },
    { label: t('landing.capabilities.diagRooms'),     value: '94%', tone: 'ok'   },
  ];
  const toneColor = (tn: string) => tn === 'good' ? '#0D9488' : tn === 'ok' ? '#4338CA' : '#B45309';
  const toneBg    = (tn: string) => tn === 'good' ? '#F0FDFA' : tn === 'ok' ? '#EEF2FF' : '#FEF3C7';
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>schedule.diag</div>
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13, color: '#0F172A', marginTop: 2 }}>{t('landing.capabilities.diagTitle')}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDFA', color: '#0D9488', fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {t('landing.capabilities.diagOk')}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 10.5, color: '#64748B', marginBottom: 6, lineHeight: 1.3 }}>{m.label}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'baseline',
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16,
              color: toneColor(m.tone),
              background: toneBg(m.tone), padding: '2px 10px', borderRadius: 6,
            }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportExportMock() {
  return (
    <div style={{ position: 'relative', height: 160 }}>
      <div style={{
        position: 'absolute', left: 0, top: 18, width: 160,
        background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
        padding: 14, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.10)',
        transform: 'rotate(-3deg)'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#ECFCCB', color: '#4D7C0F',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13l3 3 5-5"/></svg>
        </div>
        <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>teachers.xlsx</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748B', marginTop: 2 }}>47 rows</div>
      </div>

      <div style={{
        position: 'absolute', left: 'calc(50% - 14px)', top: 56,
        color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 4
      }}>
        <div style={{ width: 28, height: 2, background: '#CBD5E1' }} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div style={{
        position: 'absolute', right: 0, top: 4, width: 160,
        background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
        padding: 14, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.10)',
        transform: 'rotate(3deg)'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', color: '#B91C1C',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>schedule-10A.pdf</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748B', marginTop: 2 }}>Ready to print</div>
      </div>
    </div>
  );
}

function LessonFormatsMock() {
  const { t } = useTranslation();

  const block = (label: string, span: number, bg: string, fg: string, key: string) => (
    <div key={key} style={{
      gridColumn: `span ${span}`,
      background: bg, color: fg,
      borderRadius: 6, padding: '7px 6px',
      fontFamily: 'Manrope', fontWeight: 700, fontSize: 11,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 26,
    }}>{label}</div>
  );
  const empty = (key: string) => (
    <div key={key} style={{ background: '#F8FAFC', borderRadius: 6, border: '1px dashed #E2E8F0', minHeight: 26 }} />
  );
  const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 };
  const labelStyle = { fontFamily: 'Manrope', fontWeight: 700, fontSize: 11, color: '#334155', marginBottom: 5 };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.10)' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        {t('landing.capabilities.lfTitle')}
      </div>

      {/* Pair (2 hours) */}
      <div style={{ marginBottom: 10 }}>
        <div style={labelStyle}>{t('landing.capabilities.lfPair')}</div>
        <div style={rowStyle}>
          {empty('p0')}
          {block('Fizika', 2, '#FCE7F3', '#9D174D', 'p1')}
          {empty('p3')}
          {empty('p4')}
          {empty('p5')}
        </div>
      </div>

      {/* Triple (3 hours) */}
      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>{t('landing.capabilities.lfTriple')}</div>
        <div style={rowStyle}>
          {empty('t0')}
          {block('Texnologiya', 3, '#ECFCCB', '#4D7C0F', 't1')}
          {empty('t4')}
          {empty('t5')}
        </div>
      </div>

      {/* A / B weeks */}
      <div>
        <div style={labelStyle}>{t('landing.capabilities.lfAB')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 10,
            color: '#4338CA', background: '#EEF2FF', padding: '4px 6px', borderRadius: 5, textAlign: 'center',
          }}>{t('landing.capabilities.lfWeekA')}</div>
          <div style={rowStyle}>
            {empty('wa0')}
            {empty('wa1')}
            {block('Ingliz', 1, '#F0FDFA', '#0D9488', 'wa2')}
            {empty('wa3')}
            {empty('wa4')}
            {empty('wa5')}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 6, alignItems: 'center' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 10,
            color: '#0D9488', background: '#F0FDFA', padding: '4px 6px', borderRadius: 5, textAlign: 'center',
          }}>{t('landing.capabilities.lfWeekB')}</div>
          <div style={rowStyle}>
            {empty('wb0')}
            {empty('wb1')}
            {block('Nemis', 1, '#FEF3C7', '#B45309', 'wb2')}
            {empty('wb3')}
            {empty('wb4')}
            {empty('wb5')}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CapabilityCardProps {
  tag: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  accent: string;
}

function CapabilityCard({ tag, title, body, visual, accent }: CapabilityCardProps) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
      boxShadow: '0 4px 12px -2px rgba(15,23,42,0.04)',
      transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(15,23,42,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(15,23,42,0.04)'; }}
    >
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #F1F5F9', borderRadius: 14, padding: 18,
        minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: '100%' }}>{visual}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          color: accent, letterSpacing: '0.06em',
        }}>{tag}</span>
      </div>

      <div>
        <h3 style={{
          fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 20,
          color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.01em', lineHeight: 1.2
        }}>{title}</h3>
        <p style={{ fontFamily: 'Manrope', fontSize: 14.5, lineHeight: 1.6, color: '#475569', margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function Capabilities() {
  const { t } = useTranslation();
  const items = [
    { tag: t('landing.capabilities.c1tag'), accent: '#D97706', title: t('landing.capabilities.c1t'), body: t('landing.capabilities.c1b'), visual: <PreflightMock /> },
    { tag: t('landing.capabilities.c2tag'), accent: '#0D9488', title: t('landing.capabilities.c2t'), body: t('landing.capabilities.c2b'), visual: <DiagnosticsMock /> },
    { tag: t('landing.capabilities.c3tag'), accent: '#4F46E5', title: t('landing.capabilities.c3t'), body: t('landing.capabilities.c3b'), visual: <ImportExportMock /> },
    { tag: t('landing.capabilities.c4tag'), accent: '#9D174D', title: t('landing.capabilities.c4t'), body: t('landing.capabilities.c4b'), visual: <LessonFormatsMock /> },
  ];

  return (
    <section id="capabilities" className="et-section" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.capabilities.eyebrow')}</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            {t('landing.capabilities.h2')}
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14, lineHeight: 1.55 }}>
            {t('landing.capabilities.lead')}
          </p>
        </div>

        <div className="et-capabilities-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
        }}>
          {items.map((it, i) => (
            <CapabilityCard key={i} {...it} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .et-capabilities-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { n: '01', t: t('landing.how.s1t'), d: t('landing.how.s1b') },
    { n: '02', t: t('landing.how.s2t'), d: t('landing.how.s2b') },
    { n: '03', t: t('landing.how.s3t'), d: t('landing.how.s3b') },
    { n: '04', t: t('landing.how.s4t'), d: t('landing.how.s4b') },
    { n: '05', t: t('landing.how.s5t'), d: t('landing.how.s5b') },
  ];
  return (
    <section id="how" className="et-section" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.how.eyebrow')}</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
            {t('landing.how.h2')}
          </h2>
        </div>
        <div className="et-how-grid" style={{ position: 'relative' }}>
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
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 17, margin: '0 0 8px', color: '#0F172A' }}>{s.t}</h3>
              <p style={{ fontFamily: 'Manrope', fontSize: 14, lineHeight: 1.55, color: '#64748B', margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  emoji: string;
  tier: string;
  desc: string;
  price: string;
  perks: string[];
  popular: boolean;
  cta: string;
  popularLabel: string;
  perMonth: string;
  onClick: () => void;
}

function PricingCard({ emoji, tier, desc, price, perks, popular, cta, popularLabel, perMonth, onClick }: PricingCardProps) {
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
        }}>{popularLabel}</div>
      )}
      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 22, color, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>{tier}
      </div>
      <p style={{ fontFamily: 'Manrope', fontSize: 13, color: sub, margin: '6px 0 22px' }}>{desc}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 40, color, letterSpacing: '-0.02em' }}>{price}</div>
        {price !== 'Bepul' && price !== 'Бесплатно' && price !== 'Free' && <div style={{ fontFamily: 'Manrope', fontSize: 13, color: sub }}>{perMonth}</div>}
      </div>
      <div style={{ height: 1, background: popular ? 'rgba(255,255,255,0.18)' : '#E2E8F0', margin: '22px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {perks.map((p, i) => (
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

function Pricing({ onGetStarted }: { onGetStarted: () => void }) {
  const { t } = useTranslation();

  const freePerks = [
    t('landing.pricing.freePerks.0'),
    t('landing.pricing.freePerks.1'),
    t('landing.pricing.freePerks.2'),
    t('landing.pricing.freePerks.3'),
  ];
  const miniPerks = [
    t('landing.pricing.miniPerks.0'),
    t('landing.pricing.miniPerks.1'),
    t('landing.pricing.miniPerks.2'),
    t('landing.pricing.miniPerks.3'),
    t('landing.pricing.miniPerks.4'),
  ];
  const maxPerks = [
    t('landing.pricing.maxPerks.0'),
    t('landing.pricing.maxPerks.1'),
    t('landing.pricing.maxPerks.2'),
    t('landing.pricing.maxPerks.3'),
    t('landing.pricing.maxPerks.4'),
    t('landing.pricing.maxPerks.5'),
  ];

  const tiers = [
    {
      key: 'free',
      emoji: '🎁', tier: t('landing.pricing.freeT'), desc: t('landing.pricing.freeD'), price: t('landing.pricing.free'),
      perks: freePerks, cta: t('landing.pricing.freeCta')
    },
    {
      key: 'mini',
      emoji: '🚀', tier: t('landing.pricing.miniT'), desc: t('landing.pricing.miniD'), price: '149 000',
      perks: miniPerks, cta: t('landing.pricing.miniCta')
    },
    {
      key: 'max',
      emoji: '🏢', tier: t('landing.pricing.maxT'), desc: t('landing.pricing.maxD'), price: '349 000',
      perks: maxPerks, cta: t('landing.pricing.maxCta')
    }
  ];

  return (
    <section id="pricing" className="et-section" style={{ background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 72px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.pricing.eyebrow')}</div>
          <h2 className="et-h2" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
            {t('landing.pricing.h2')}
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: 17, color: '#64748B', marginTop: 14 }}>
            {t('landing.pricing.lead')}
          </p>
        </div>
        <div className="et-grid-3" style={{ alignItems: 'start' }}>
          {tiers.map(({ key, ...rest }) => (
            <PricingCard key={key} {...rest} popular={key === 'mini'} popularLabel={t('landing.pricing.popular')} perMonth={t('landing.pricing.perMonth')} onClick={onGetStarted} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Feedback() {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('taklif');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const max = 600;
  const remaining = max - feedback.length;
  const canSend = feedback.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    try {
      const list = JSON.parse(localStorage.getItem('et_feedback') || '[]');
      list.push({ feedback, contact, category, at: Date.now() });
      localStorage.setItem('et_feedback', JSON.stringify(list));
    } catch (err) {}
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFeedback('');
      setContact('');
      setCategory('taklif');
    }, 3200);
  }

  const cats = [
    { id: 'taklif',   label: t('landing.feedback.cTaklif') },
    { id: 'xato',     label: t('landing.feedback.cXato') },
    { id: 'boshqa',   label: t('landing.feedback.cBoshqa') },
  ];

  const inputBase = {
    fontFamily: 'Manrope, sans-serif', fontSize: 15, color: '#0F172A',
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1px solid #E2E8F0', background: '#fff', outline: 'none',
    transition: 'border-color 180ms, box-shadow 180ms',
    boxSizing: 'border-box' as const,
  };
  const focusedStyle = (key: string) => focused === key ? {
    borderColor: '#4F46E5', boxShadow: '0 0 0 4px rgba(79,70,229,0.12)'
  } : {};

  return (
    <section id="feedback" className="et-section" style={{ background: '#fff', paddingTop: 64, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.2fr)', gap: 56,
          alignItems: 'start',
        }} className="et-feedback-grid">
          {/* Left — intro */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t('landing.feedback.eyebrow')}</div>
            <h2 className="et-h2" style={{
              fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.1,
              letterSpacing: '-0.02em', margin: 0, color: '#0F172A'
            }}>
              {t('landing.feedback.h2a')}<br/>{t('landing.feedback.h2b')}
            </h2>
            <p style={{ fontFamily: 'Manrope', fontSize: 16, lineHeight: 1.6, color: '#475569', marginTop: 18, maxWidth: 380 }}>
              {t('landing.feedback.lead')}
            </p>

            <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{t('landing.feedback.trust1t')}</div>
                  <div style={{ fontFamily: 'Manrope', fontSize: 12, color: '#64748B' }}>{t('landing.feedback.trust1b')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#F0FDFA', color: '#0D9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{t('landing.feedback.trust2t')}</div>
                  <div style={{ fontFamily: 'Manrope', fontSize: 12, color: '#64748B' }}>{t('landing.feedback.trust2b')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <form onSubmit={handleSubmit} style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {cats.map(c => {
                const active = category === c.id;
                return (
                  <button type="button" key={c.id} onClick={() => setCategory(c.id)}
                    style={{
                      fontFamily: 'Manrope', fontSize: 13, fontWeight: 600,
                      padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                      border: '1px solid ' + (active ? '#4F46E5' : '#E2E8F0'),
                      background: active ? '#4F46E5' : '#fff',
                      color: active ? '#fff' : '#475569',
                      transition: 'all 180ms',
                    }}>
                    {c.label}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 13, color: '#334155' }}>
                  {t('landing.feedback.labelMsg')}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: remaining < 40 ? '#DC2626' : '#94A3B8' }}>
                  {remaining}
                </span>
              </div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value.slice(0, max))}
                onFocus={() => setFocused('feedback')}
                onBlur={() => setFocused(null)}
                placeholder={t('landing.feedback.placeMsg')}
                rows={5}
                style={{ ...inputBase, ...focusedStyle('feedback'), resize: 'vertical', minHeight: 120, lineHeight: 1.55 }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 13, color: '#334155' }}>
                  {t('landing.feedback.labelContact')}
                </span>
                <span style={{
                  fontFamily: 'Manrope', fontSize: 11, fontWeight: 600,
                  color: '#64748B', background: '#E2E8F0', padding: '2px 8px', borderRadius: 999,
                }}>
                  {t('landing.feedback.optional')}
                </span>
              </div>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                onFocus={() => setFocused('contact')}
                onBlur={() => setFocused(null)}
                placeholder={t('landing.feedback.placeContact')}
                style={{ ...inputBase, ...focusedStyle('contact') }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Manrope', fontSize: 12, color: '#94A3B8', maxWidth: 280, lineHeight: 1.5 }}>
                {t('landing.feedback.privacy')}
              </span>
              <button
                type="submit"
                disabled={!canSend}
                style={{
                  fontFamily: 'Manrope', fontWeight: 700, fontSize: 14,
                  padding: '12px 22px', borderRadius: 10, border: 0,
                  background: canSend ? '#4F46E5' : '#CBD5E1',
                  color: '#fff', cursor: canSend ? 'pointer' : 'not-allowed',
                  boxShadow: canSend ? '0 8px 18px -6px rgba(79,70,229,0.45)' : 'none',
                  transition: 'all 180ms',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                {t('landing.feedback.send')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>

            {sent && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.96)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 28, textAlign: 'center', animation: 'et-fb-pop 220ms ease-out',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 999, background: '#0D9488',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, boxShadow: '0 12px 28px -8px rgba(13,148,136,0.5)'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 22, color: '#0F172A', margin: 0 }}>
                  {t('landing.feedback.okTitle')}
                </h3>
                <p style={{ fontFamily: 'Manrope', fontSize: 14, color: '#475569', marginTop: 8, maxWidth: 320 }}>
                  {t('landing.feedback.okBody')}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @keyframes et-fb-pop {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 860px) {
          .et-feedback-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}

function CTA({ onGetStarted }: { onGetStarted: () => void }) {
  const { t } = useTranslation();
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
            {t('landing.cta.h2a')}<br/>{t('landing.cta.h2b')}
          </h2>
          <div className="et-cta-buttons" style={{ display: 'inline-flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={onGetStarted} style={{
              background: '#fff', color: '#4338CA', border: 0, cursor: 'pointer',
              fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, padding: '14px 24px', borderRadius: 10,
              boxShadow: '0 8px 20px -4px rgba(0,0,0,0.25)'
            }}>{t('landing.cta.btn1')} →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const c1 = [
    t('landing.footer.c1.0'),
    t('landing.footer.c1.1'),
    t('landing.footer.c1.2'),
    t('landing.footer.c1.3')
  ];
  const c2 = [
    t('landing.footer.c2.0'),
    t('landing.footer.c2.1'),
    t('landing.footer.c2.2'),
    t('landing.footer.c2.3')
  ];
  const c3 = [
    t('landing.footer.c3.0'),
    t('landing.footer.c3.1'),
    t('landing.footer.c3.2')
  ];

  const columns = [
    { h: t('landing.footer.c1h'), l: [
      { t: c1[0], h: '#features' },
      { t: c1[1], h: '#capabilities' },
      { t: c1[2], h: '#how' },
      { t: c1[3], h: '#pricing' },
    ]},
    { h: t('landing.footer.c2h'), l: c2.map(x => ({ t: x, h: '#' })) },
    { h: t('landing.footer.c3h'), l: c3.map(x => ({ t: x, h: '#' })) },
  ];

  return (
    <footer style={{ background: '#0B0F1A', color: '#CBD5E1', padding: '64px 20px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="et-footer-grid" style={{ paddingBottom: 48, borderBottom: '1px solid #1E293B' }}>
          <div>
            <Logo dark />
            <p style={{ fontFamily: 'Manrope', fontSize: 14, color: '#94A3B8', marginTop: 16, maxWidth: 320, lineHeight: 1.6 }}>
              {t('landing.footer.tag')}
            </p>
          </div>
          {columns.map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 16, letterSpacing: '0.02em' }}>{col.h}</div>
              {col.l.map((i, idx) => (
                <a key={idx} href={i.h} style={{ display: 'block', fontFamily: 'Manrope', fontSize: 14, color: '#94A3B8', textDecoration: 'none', padding: '6px 0' }}>{i.t}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="et-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, fontFamily: 'Manrope', fontSize: 13, color: '#64748B', flexWrap: 'wrap', gap: 16 }}>
          <div>{t('landing.footer.copyright')}</div>
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
      <Header onSignIn={onSignIn} />
      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Constraints />
      <Capabilities />
      <HowItWorks />
      <Pricing onGetStarted={onGetStarted} />
      <Feedback />
      <CTA onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}