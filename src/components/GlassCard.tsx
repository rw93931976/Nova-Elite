import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
    return (
        <div className={`glass-card p-6 shadow-2xl ${className}`}>
            {children}
        </div>
    );
};
