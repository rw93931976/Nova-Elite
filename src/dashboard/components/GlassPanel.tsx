import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'cyan' | 'amber' | 'rose' | 'emerald';
  title?: string;
  subtitle?: string;
}

const accentBorder: Record<NonNullable<GlassPanelProps['accent']>, string> = {
  cyan: 'border-cyan-400/40',
  amber: 'border-amber-400/40',
  rose: 'border-rose-400/40',
  emerald: 'border-emerald-400/40',
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  accent = 'cyan',
  title,
  subtitle,
}) => (
  <section className={`glass-panel ${accentBorder[accent]} ${className}`}>
    {(title || subtitle) && (
      <header className="glass-panel__header">
        {title && <h3 className="glass-panel__title">{title}</h3>}
        {subtitle && <p className="glass-panel__subtitle">{subtitle}</p>}
      </header>
    )}
    {children}
  </section>
);
