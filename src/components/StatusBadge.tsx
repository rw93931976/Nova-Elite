import React from 'react';

interface StatusBadgeProps {
    label: string;
    status: 'online' | 'offline' | 'connecting';
    icon?: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status, icon, className = '' }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'online': return 'text-charcoal bg-aqua border-aqua/20 shadow-[0_0_15px_rgba(11,249,234,0.3)]';
            case 'connecting': return 'text-aqua bg-charcoal/40 border-aqua/10';
            case 'sovereign' as any: return 'text-charcoal bg-aqua border-aqua shadow-lg';
            default: return 'text-white bg-rose-600 border-rose-400';
        }
    };

    const getStatusDot = () => {
        switch (status) {
            case 'online': return 'bg-charcoal shadow-[0_0_8px_rgba(18,18,18,0.5)]';
            case 'connecting': return 'bg-aqua animate-pulse shadow-[0_0_8px_rgba(11,249,234,0.8)]';
            case 'sovereign' as any: return 'bg-charcoal shadow-[0_0_12px_rgba(18,18,18,0.8)] animate-pulse';
            default: return 'bg-white';
        }
    };


    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase backdrop-blur-md ${getStatusColor()} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`} />
            {icon && <span className="mr-1">{icon}</span>}
            <span>{label}</span>
        </div>
    );
};
