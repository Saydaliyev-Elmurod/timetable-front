import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

export interface TipItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
}

interface TipsSidebarProps {
  pageKey: string;
  tips: TipItem[];
}

export function TipsSidebar({ pageKey, tips }: TipsSidebarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(`et_tips_sidebar_${pageKey}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(`et_tips_sidebar_${pageKey}`, JSON.stringify(isOpen));
  }, [isOpen, pageKey]);

  if (!isOpen) {
    return (
      <div 
        style={{
          width: 48,
          borderLeft: '1px solid #E2E8F0',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 24,
          gap: 16,
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#fff',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: 0,
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title="Maslahatlarni ochish"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.color = '#4F46E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div 
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            font: '700 12px Plus Jakarta Sans',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: 8,
            opacity: 0.8,
            cursor: 'pointer',
          }}
          onClick={() => setIsOpen(true)}
        >
          Maslahatlar
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 340,
        borderLeft: '1px solid #E2E8F0',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: '24px 24px 20px', 
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 10, 
              background: '#EEF2FF', 
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08)',
            }}
          >
            <Lightbulb size={20} className="animate-pulse" />
          </div>
          <div>
            <div style={{ font: '700 10px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              QO'LLANMA
            </div>
            <div style={{ font: '800 18px Plus Jakarta Sans', color: '#0F172A', marginTop: 1 }}>
              Maslahatlar
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#fff',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: 0,
            transition: 'all 0.2s',
          }}
          title="Maslahatlarni yopish"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.color = '#F43F5E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Content */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
        className="et-premium-scrollbar"
      >
        {tips.map((tip, index) => {
          const IconComponent = tip.icon || HelpCircle;
          return (
            <div 
              key={tip.id || index}
              style={{
                display: 'flex',
                gap: 16,
                padding: '12px',
                borderRadius: '12px',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div 
                style={{ 
                  color: '#64748B', 
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#F1F5F9',
                }}
              >
                <IconComponent size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h4 style={{ font: '700 13px Plus Jakarta Sans', color: '#1E293B', margin: 0 }}>
                  {tip.title}
                </h4>
                <p style={{ font: '500 12px Manrope', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                  {tip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div 
        style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid #F1F5F9',
          background: '#FCFDFE',
        }}
      >
        <a 
          href="#docs" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            font: '700 12px Plus Jakarta Sans',
            color: '#4F46E5',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3730A3';
            const icon = e.currentTarget.querySelector('.footer-arrow');
            if (icon) (icon as HTMLElement).style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#4F46E5';
            const icon = e.currentTarget.querySelector('.footer-arrow');
            if (icon) (icon as HTMLElement).style.transform = 'none';
          }}
        >
          <span>Barcha qo'llanmalar</span>
          <span 
            className="footer-arrow"
            style={{ 
              transition: 'transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            →
          </span>
        </a>
      </div>
    </div>
  );
}
