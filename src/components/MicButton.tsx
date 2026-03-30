import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
    isListening: boolean;
    onClick: () => void;
    unlockAudio?: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ isListening, onClick, unlockAudio }) => {
    return (
        <button
            onClick={() => {
                if (unlockAudio) unlockAudio();
                onClick();
            }}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
        >
            {isListening ? (
                <Square className="text-white w-8 h-8 fill-white animate-pulse" />
            ) : (
                <Mic className="text-white w-8 h-8" />
            )}
        </button>
    );
};
