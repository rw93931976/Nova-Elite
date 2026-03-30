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
<<<<<<< HEAD
            case 'online': return 'text-white bg-emerald-600 border-emerald-400';
            case 'connecting': return 'text-black bg-yellow-400 border-yellow-600';
            case 'sovereign' as any: return 'text-white bg-cyan-600 border-cyan-400 shadow-lg';
            default: return 'text-white bg-rose-600 border-rose-400';
=======
            case 'online': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'connecting': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'sovereign' as any: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]';
            default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
>>>>>>> sovereign-elite-v3-6
        }
    };

    const getStatusDot = () => {
        switch (status) {
<<<<<<< HEAD
            case 'online': return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]';
            case 'connecting': return 'bg-black animate-pulse';
            case 'sovereign' as any: return 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-pulse';
            default: return 'bg-white';
=======
            case 'online': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
            case 'connecting': return 'bg-yellow-400 animate-pulse';
            case 'sovereign' as any: return 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse';
            default: return 'bg-rose-400';
>>>>>>> sovereign-elite-v3-6
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
