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
            case 'online': return 'text-white bg-emerald-600 border-emerald-400';
            case 'connecting': return 'text-black bg-yellow-400 border-yellow-600';
            case 'sovereign' as any: return 'text-white bg-cyan-600 border-cyan-400 shadow-lg';
            default: return 'text-white bg-rose-600 border-rose-400';
        }
    };

    const getStatusDot = () => {
        switch (status) {
            case 'online': return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]';
            case 'connecting': return 'bg-black animate-pulse';
            case 'sovereign' as any: return 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-pulse';
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
