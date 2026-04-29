import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, type Locale } from '@/i18n/index';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Check,
  Globe,
  Grid3x3,
  Layers,
  Menu,
  Play,
  Plug,
  Settings2,
  Sparkles,
  X,
  ArrowRight,
  Sigma,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import '@/styles/landing.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

/* ---------------------------------------------------------------- */
/* Logo                                                              */
/* ---------------------------------------------------------------- */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          background: 'var(--lp-indigo)',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(15,23,42,0.08)',
        }}
      >
        <Grid3x3 className="h-4 w-4 text-white" strokeWidth={1.75} />
      </div>
      <span
        className="lp-display text-slate-900"
        style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}
      >
        E-timetable
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Language switch                                                   */
/* ---------------------------------------------------------------- */

const LANGUAGES: Locale[] = ['uz', 'ru', 'en'];

function LangSwitch() {
  const { locale, setLocale } = useTranslation();
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {LANGUAGES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={
              active
                ? 'lp-indigo-text uppercase'
                : 'lp-nav-link uppercase'
            }
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontWeight: active ? 700 : 500,
              fontSize: 12,
              letterSpacing: '0.08em',
              background: active ? 'var(--lp-indigo-soft)' : 'transparent',
            }}
            aria-pressed={active}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Landing nav                                                       */
/* ---------------------------------------------------------------- */

interface NavProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

function LandingNav({ onGetStarted, onSignIn }: NavProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const navItems = useMemo(
    () => [
      { href: '#benefits', label: t('landing.nav.benefits') },
      { href: '#integrations', label: t('landing.nav.integrations') },
      { href: '#pricing', label: t('landing.nav.pricing') },
      { href: '#faq', label: t('landing.nav.faq') },
    ],
    [t],
  );

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md"
      style={{
        borderBottom: scrolled ? '1px solid var(--lp-slate-200)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
        transition: 'box-shadow 200ms, border-color 200ms',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center" aria-label="E-timetable">
            <Logo />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((it) => (
              <a key={it.href} href={it.href} className="lp-nav-link">
                {it.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LangSwitch />
            <button type="button" onClick={onSignIn} className="lp-nav-link">
              {t('app.signIn')}
            </button>
            <button type="button" onClick={onGetStarted} className="lp-btn-primary">
              {t('app.getStarted')}
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" strokeWidth={1.75} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden py-4"
            style={{ borderTop: '1px solid var(--lp-slate-200)' }}
          >
            <div className="flex flex-col gap-4">
              {navItems.map((it) => (
                <a
                  key={it.href}
                  href={it.href}
                  className="lp-nav-link"
                  onClick={closeMobile}
                >
                  {it.label}
                </a>
              ))}
              <div className="flex items-center justify-between pt-2">
                <LangSwitch />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    onSignIn();
                  }}
                  className="lp-btn-secondary justify-center"
                >
                  {t('app.signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    onGetStarted();
                  }}
                  className="lp-btn-primary justify-center"
                >
                  {t('app.getStarted')}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Hero grid preview                                                 */
/* ---------------------------------------------------------------- */

interface HeroCell {
  subject: string;
  teacher: string;
  bg: string;
  fg: string;
  state?: 'drag' | 'conflict';
}

const HERO_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function HeroGridPreview() {
  const { t } = useTranslation();

  const cells: (HeroCell | null)[][] = useMemo(
    () => [
      [
        { subject: 'Math', teacher: 'A.K.', bg: '#EEF2FF', fg: '#4338CA' },
        { subject: 'Physics', teacher: 'N.S.', bg: '#F0FDFA', fg: '#0F766E' },
        { subject: 'Math', teacher: 'A.K.', bg: '#EEF2FF', fg: '#4338CA' },
        { subject: 'Lit.', teacher: 'M.R.', bg: '#FEF3C7', fg: '#92400E' },
        { subject: 'PE', teacher: 'S.T.', bg: '#FCE7F3', fg: '#9D174D' },
      ],
      [
        { subject: 'Chem.', teacher: 'Z.B.', bg: '#F0FDFA', fg: '#0F766E' },
        {
          subject: 'Math',
          teacher: 'A.K.',
          bg: '#EEF2FF',
          fg: '#4338CA',
          state: 'drag',
        },
        { subject: 'Hist.', teacher: 'D.I.', bg: '#FEF3C7', fg: '#92400E' },
        { subject: 'Eng.', teacher: 'J.P.', bg: '#F0FDFA', fg: '#0F766E' },
        null,
      ],
      [
        { subject: 'Bio.', teacher: 'L.O.', bg: '#F0FDFA', fg: '#0F766E' },
        { subject: 'Geo.', teacher: 'V.K.', bg: '#FEF3C7', fg: '#92400E' },
        {
          subject: 'Eng.',
          teacher: 'J.P.',
          bg: '#F0FDFA',
          fg: '#0F766E',
          state: 'conflict',
        },
        { subject: 'Math', teacher: 'A.K.', bg: '#EEF2FF', fg: '#4338CA' },
        { subject: 'CS', teacher: 'R.U.', bg: '#EEF2FF', fg: '#4338CA' },
      ],
      [
        { subject: 'Art', teacher: 'F.B.', bg: '#FCE7F3', fg: '#9D174D' },
        { subject: 'Lit.', teacher: 'M.R.', bg: '#FEF3C7', fg: '#92400E' },
        { subject: 'PE', teacher: 'S.T.', bg: '#FCE7F3', fg: '#9D174D' },
        null,
        { subject: 'Eng.', teacher: 'J.P.', bg: '#F0FDFA', fg: '#0F766E' },
      ],
    ],
    [],
  );

  return (
    <div
      className="lp-card relative overflow-hidden"
      style={{ padding: 20, background: '#FFFFFF' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div
            className="lp-display text-slate-900"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {t('landing.hero.previewTitle')}
          </div>
          <div
            className="lp-body"
            style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}
          >
            {t('landing.hero.previewMeta')}
          </div>
        </div>
        <span className="lp-teal-pill lp-mono" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999 }}>
          {t('landing.bento.abweeks.badgeB')}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {HERO_DAYS.map((d) => (
          <div
            key={d}
            className="lp-mono text-center"
            style={{
              fontSize: 10,
              color: '#94A3B8',
              padding: '4px 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {d}
          </div>
        ))}

        {cells.flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            if (!cell) {
              return (
                <div
                  key={key}
                  style={{
                    height: 54,
                    background: '#F8FAFC',
                    border: '1px dashed var(--lp-slate-200)',
                    borderRadius: 8,
                  }}
                />
              );
            }
            const stateClass =
              cell.state === 'drag'
                ? ' lp-cell-drag'
                : cell.state === 'conflict'
                ? ' lp-cell-conflict'
                : '';
            return (
              <div
                key={key}
                className={`lp-mono relative${stateClass}`}
                style={{
                  height: 54,
                  background: cell.bg,
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: cell.fg,
                    lineHeight: 1.1,
                  }}
                >
                  {cell.subject}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: cell.fg,
                    opacity: 0.7,
                    lineHeight: 1.1,
                  }}
                >
                  {cell.teacher}
                </div>
                {cell.state === 'conflict' && (
                  <span className="sr-only">{t('landing.hero.conflictSr')}</span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Hero                                                              */
/* ---------------------------------------------------------------- */

function LandingHero({ onGetStarted }: NavProps) {
  const { t } = useTranslation();
  const onDemo = useCallback(
    () => console.info('E-timetable demo requested'),
    [],
  );

  return (
    <section className="relative overflow-hidden">
      <div
        className="lp-grid-bg absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="lp-eyebrow inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('landing.hero.eyebrow')}
            </span>
            <h1
              className="lp-display mt-5 text-slate-900"
              style={{
                fontSize: 'clamp(36px, 5.5vw, 60px)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {t('landing.hero.titleLead')}{' '}
              <span className="lp-gradient-text">
                {t('landing.hero.titleHighlightNew')}
              </span>{' '}
              {t('landing.hero.titleTail')}
            </h1>
            <p
              className="lp-body mt-6 text-slate-600 max-w-xl"
              style={{ fontSize: 18, lineHeight: 1.55 }}
            >
              {t('landing.hero.subtitleNew')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={onGetStarted} className="lp-btn-primary">
                {t('landing.hero.ctaPrimary')}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button type="button" onClick={onDemo} className="lp-btn-secondary">
                <Play className="h-4 w-4" strokeWidth={1.75} />
                {t('landing.hero.ctaSecondary')}
              </button>
            </div>
          </div>

          <div className="relative">
            <HeroGridPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Trust bar                                                         */
/* ---------------------------------------------------------------- */

function TrustBar() {
  const { t } = useTranslation();
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="lp-eyebrow">{t('landing.trust.eyebrow')}</span>
          <p className="lp-body mt-3 text-slate-600 max-w-2xl mx-auto" style={{ fontSize: 15 }}>
            {t('landing.trust.subtitle')}
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
          {/* Logo 1: circle */}
          <svg className="h-8 w-auto" viewBox="0 0 96 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="10" fill="#94A3B8" />
            <text x="34" y="21" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="14" fill="#94A3B8">
              Nexa
            </text>
          </svg>
          {/* Logo 2: two rectangles */}
          <svg className="h-8 w-auto" viewBox="0 0 96 32" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="10" height="16" rx="2" fill="#94A3B8" />
            <rect x="18" y="8" width="10" height="16" rx="2" fill="#CBD5E1" />
            <text x="34" y="21" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="14" fill="#94A3B8">
              Lyceum
            </text>
          </svg>
          {/* Logo 3: e-maktab.uz accent */}
          <span className="lp-indigo-text lp-display font-semibold" style={{ fontSize: 16 }}>
            e-maktab.uz
          </span>
          {/* Logo 4: triangle */}
          <svg className="h-8 w-auto" viewBox="0 0 96 32" fill="none" aria-hidden="true">
            <polygon points="16,4 28,28 4,28" fill="#94A3B8" />
            <text x="34" y="21" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="14" fill="#94A3B8">
              Peak
            </text>
          </svg>
          {/* Logo 5: chevron */}
          <svg className="h-8 w-auto" viewBox="0 0 96 32" fill="none" aria-hidden="true">
            <path d="M4 20 L14 8 L24 20 L18 20 L14 14 L10 20 Z" fill="#94A3B8" />
            <text x="30" y="21" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="14" fill="#94A3B8">
              Apex
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Bento features                                                    */
/* ---------------------------------------------------------------- */

interface FeatureTileProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  className?: string;
  children?: React.ReactNode;
}

function FeatureTile({ icon: Icon, title, desc, className, children }: FeatureTileProps) {
  return (
    <div className={`lp-card p-8 flex flex-col ${className ?? ''}`}>
      <div className="lp-icon-tile mb-5">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3
        className="lp-display text-slate-900"
        style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}
      >
        {title}
      </h3>
      <p
        className="lp-body mt-3 text-slate-600"
        style={{ fontSize: 15, lineHeight: 1.55 }}
      >
        {desc}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

function BentoFeatures() {
  const { t } = useTranslation();
  return (
    <section id="benefits" className="lp-anchor py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="lp-eyebrow">{t('landing.bento.eyebrow')}</span>
          <h2
            className="lp-display mt-3 text-slate-900"
            style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {t('landing.bento.heading')}
          </h2>
          <p className="lp-body mt-4 text-slate-600" style={{ fontSize: 17 }}>
            {t('landing.bento.subtitle')}
          </p>
        </div>

        <div id="integrations" className="lp-anchor mt-14 grid md:grid-cols-6 gap-6">
          <FeatureTile
            icon={Plug}
            title={t('landing.bento.sync.title')}
            desc={t('landing.bento.sync.desc')}
            className="md:col-span-4"
          >
            <span
              className="lp-teal-pill inline-flex items-center gap-2 lp-mono"
              style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12 }}
            >
              <span
                className="lp-teal-dot inline-block"
                style={{ width: 6, height: 6, borderRadius: 999 }}
              />
              {t('landing.bento.sync.pill')}
            </span>
          </FeatureTile>

          <FeatureTile
            icon={Sigma}
            title={t('landing.bento.solver.title')}
            desc={t('landing.bento.solver.desc')}
            className="md:col-span-2"
          >
            <div
              className="lp-mono lp-indigo-bg-soft lp-indigo-text"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 12,
                letterSpacing: '0.02em',
              }}
            >
              {t('landing.bento.solver.mono')}
            </div>
          </FeatureTile>

          <FeatureTile
            icon={Layers}
            title={t('landing.bento.abweeks.title')}
            desc={t('landing.bento.abweeks.desc')}
            className="md:col-span-6"
          >
            <div className="flex items-center gap-3">
              <span
                className="lp-mono lp-indigo-bg-soft lp-indigo-text"
                style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}
              >
                {t('landing.bento.abweeks.badgeA')}
              </span>
              <span
                className="lp-mono lp-teal-pill"
                style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}
              >
                {t('landing.bento.abweeks.badgeB')}
              </span>
            </div>
          </FeatureTile>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* How it works                                                      */
/* ---------------------------------------------------------------- */

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      num: '01',
      icon: Plug,
      title: t('landing.how.s1.title'),
      desc: t('landing.how.s1.desc'),
    },
    {
      num: '02',
      icon: Settings2,
      title: t('landing.how.s2.title'),
      desc: t('landing.how.s2.desc'),
    },
    {
      num: '03',
      icon: Sparkles,
      title: t('landing.how.s3.title'),
      desc: t('landing.how.s3.desc'),
    },
  ];

  return (
    <section className="lp-anchor py-20" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="lp-eyebrow">{t('landing.how.eyebrow')}</span>
          <h2
            className="lp-display mt-3 text-slate-900"
            style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {t('landing.how.heading')}
          </h2>
          <p className="lp-body mt-4 text-slate-600" style={{ fontSize: 17 }}>
            {t('landing.how.subtitle')}
          </p>
        </div>

        <div className="relative mt-14">
          <div
            className="hidden md:block absolute top-16 left-[12%] right-[12%] border-t border-dashed"
            style={{ borderColor: '#CBD5E1' }}
            aria-hidden="true"
          />
          <div className="relative grid md:grid-cols-3 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  className="lp-card p-8 text-left"
                  style={{ position: 'relative' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="lp-mono lp-indigo-text" style={{ fontSize: 14, fontWeight: 500 }}>
                      {s.num}
                    </span>
                    <div className="lp-icon-tile">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  </div>
                  <h3
                    className="lp-display mt-6 text-slate-900"
                    style={{ fontSize: 20, fontWeight: 700 }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="lp-body mt-2 text-slate-600"
                    style={{ fontSize: 15, lineHeight: 1.55 }}
                  >
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Pricing                                                           */
/* ---------------------------------------------------------------- */

interface PricingProps {
  onGetStarted: () => void;
}

function PricingCard({
  name,
  price,
  period,
  tagline,
  features,
  ctaLabel,
  onClick,
  highlighted,
  popularLabel,
}: {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  onClick: () => void;
  highlighted?: boolean;
  popularLabel?: string;
}) {
  return (
    <div
      className={`lp-card p-8 relative flex flex-col ${
        highlighted ? 'lp-indigo-ring md:-translate-y-2' : ''
      }`}
    >
      {highlighted && popularLabel && (
        <span
          className="lp-mono absolute -top-3 left-1/2"
          style={{
            transform: 'translateX(-50%)',
            background: 'var(--lp-indigo)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
          }}
        >
          {popularLabel}
        </span>
      )}
      <div
        className="lp-display text-slate-900"
        style={{ fontSize: 18, fontWeight: 700 }}
      >
        {name}
      </div>
      <div
        className="lp-body text-slate-500 mt-1"
        style={{ fontSize: 13 }}
      >
        {tagline}
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span
          className="lp-display font-extrabold text-5xl text-slate-900"
          style={{ letterSpacing: '-0.02em' }}
        >
          {price}
        </span>
        <span className="lp-body text-slate-500" style={{ fontSize: 13 }}>
          {period}
        </span>
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span
              className="lp-teal-pill inline-flex items-center justify-center shrink-0"
              style={{ width: 20, height: 20, borderRadius: 999, padding: 0 }}
            >
              <Check className="lp-teal-text h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="lp-body text-slate-700" style={{ fontSize: 14 }}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        className={`mt-8 justify-center ${
          highlighted ? 'lp-btn-primary' : 'lp-btn-secondary'
        }`}
        style={{ width: '100%' }}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Pricing({ onGetStarted }: PricingProps) {
  const { t } = useTranslation();
  return (
    <section id="pricing" className="lp-anchor py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="lp-eyebrow">{t('landing.pricing.eyebrow')}</span>
          <h2
            className="lp-display mt-3 text-slate-900"
            style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {t('landing.pricing.heading')}
          </h2>
          <p className="lp-body mt-4 text-slate-600" style={{ fontSize: 17 }}>
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 md:gap-8">
          <PricingCard
            name={t('landing.pricing.free.name')}
            price={t('landing.pricing.free.price')}
            period={t('landing.pricing.free.period')}
            tagline={t('landing.pricing.free.tagline')}
            features={[
              t('landing.pricing.free.features.1'),
              t('landing.pricing.free.features.2'),
              t('landing.pricing.free.features.3'),
              t('landing.pricing.free.features.4'),
            ]}
            ctaLabel={t('landing.pricing.free.cta')}
            onClick={onGetStarted}
          />
          <PricingCard
            name={t('landing.pricing.mini.name')}
            price={t('landing.pricing.mini.price')}
            period={t('landing.pricing.mini.period')}
            tagline={t('landing.pricing.mini.tagline')}
            features={[
              t('landing.pricing.mini.features.1'),
              t('landing.pricing.mini.features.2'),
              t('landing.pricing.mini.features.3'),
              t('landing.pricing.mini.features.4'),
              t('landing.pricing.mini.features.5'),
            ]}
            ctaLabel={t('landing.pricing.mini.cta')}
            onClick={onGetStarted}
            highlighted
            popularLabel={t('landing.pricing.mini.popular')}
          />
          <PricingCard
            name={t('landing.pricing.max.name')}
            price={t('landing.pricing.max.price')}
            period={t('landing.pricing.max.period')}
            tagline={t('landing.pricing.max.tagline')}
            features={[
              t('landing.pricing.max.features.1'),
              t('landing.pricing.max.features.2'),
              t('landing.pricing.max.features.3'),
              t('landing.pricing.max.features.4'),
              t('landing.pricing.max.features.5'),
            ]}
            ctaLabel={t('landing.pricing.max.cta')}
            onClick={onGetStarted}
          />
        </div>

        <p
          className="lp-body text-slate-500 text-center mt-8"
          style={{ fontSize: 13 }}
        >
          {t('landing.pricing.note')}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* FAQ                                                               */
/* ---------------------------------------------------------------- */

const FAQ_KEYS = [
  'privacy',
  'abweeks',
  'manual',
  'emaktab',
  'ortools',
  'freeLimits',
  'migration',
] as const;

function FAQ() {
  const { t } = useTranslation();
  return (
    <section id="faq" className="lp-anchor py-20" style={{ background: '#F8FAFC' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="lp-eyebrow">{t('landing.faq.eyebrow')}</span>
          <h2
            className="lp-display mt-3 text-slate-900"
            style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {t('landing.faq.heading')}
          </h2>
        </div>

        <div className="lp-card mt-10 px-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_KEYS.map((k) => (
              <AccordionItem key={k} value={k}>
                <AccordionTrigger className="lp-display text-slate-900" style={{ fontSize: 16, fontWeight: 600 }}>
                  {t(`landing.faq.items.${k}.q`)}
                </AccordionTrigger>
                <AccordionContent className="lp-body text-slate-600" style={{ fontSize: 15, lineHeight: 1.6 }}>
                  {t(`landing.faq.items.${k}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Final CTA                                                         */
/* ---------------------------------------------------------------- */

function FinalCta({ onGetStarted }: { onGetStarted: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden lp-surface-dark">
      <div
        className="lp-grid-bg-dark absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="lp-eyebrow lp-teal-text">
          {t('landing.finalCta.eyebrow')}
        </span>
        <h2
          className="lp-display mt-4 text-white"
          style={{
            fontSize: 'clamp(30px, 4vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {t('landing.finalCta.heading')}
        </h2>
        <p
          className="lp-body mt-5 mx-auto"
          style={{ fontSize: 17, color: '#CBD5E1', maxWidth: 560 }}
        >
          {t('landing.finalCta.subtitle')}
        </p>
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onGetStarted}
            className="lp-btn-primary lp-btn-inverted"
          >
            {t('landing.finalCta.cta')}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Footer                                                            */
/* ---------------------------------------------------------------- */

function LandingFooter() {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('landing.footer.product.title'),
      items: [
        { href: '#benefits', label: t('landing.footer.product.features') },
        { href: '#pricing', label: t('landing.footer.product.pricing') },
        { href: '#', label: t('landing.footer.product.demo') },
      ],
    },
    {
      title: t('landing.footer.company.title'),
      items: [
        { href: '#', label: t('landing.footer.company.about') },
        { href: '#', label: t('landing.footer.company.contact') },
      ],
    },
    {
      title: t('landing.footer.legal.title'),
      items: [
        { href: '#', label: t('landing.footer.legal.privacy') },
        { href: '#', label: t('landing.footer.legal.terms') },
      ],
    },
    {
      title: t('landing.footer.connect.title'),
      items: [
        { href: '#', label: t('landing.footer.connect.telegram') },
        { href: '#', label: t('landing.footer.connect.email') },
      ],
    },
  ];

  return (
    <footer className="lp-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--lp-indigo)',
                  borderRadius: 8,
                }}
              >
                <Grid3x3 className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <span
                className="lp-display text-white"
                style={{ fontSize: 17, fontWeight: 700 }}
              >
                E-timetable
              </span>
            </div>
            <p
              className="lp-body mt-4 max-w-sm"
              style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.6 }}
            >
              {t('landing.footer.tagline')}
            </p>
            <div className="mt-4 flex items-center gap-2" style={{ color: '#94A3B8', fontSize: 13 }}>
              <Globe className="h-4 w-4" strokeWidth={1.75} />
              <span className="lp-body">Tashkent, Uzbekistan</span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div
                className="lp-display text-white"
                style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                {col.title}
              </div>
              <ul className="mt-4 space-y-2">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      className="lp-body"
                      style={{ color: '#CBD5E1', fontSize: 14, transition: 'color 200ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--lp-slate-800)' }}
        >
          <p className="lp-body" style={{ color: '#94A3B8', fontSize: 13 }}>
            {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center gap-2 lp-mono" style={{ color: '#94A3B8', fontSize: 12 }}>
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- */
/* Main export                                                       */
/* ---------------------------------------------------------------- */

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white lp-body text-slate-700">
      <LandingNav onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <LandingHero onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <TrustBar />
      <BentoFeatures />
      <HowItWorks />
      <Pricing onGetStarted={onGetStarted} />
      <FAQ />
      <FinalCta onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
}
