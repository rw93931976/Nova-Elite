// Anti-Gravity Communication File
// Ray: Messages from anti-gravity
// Nova: Messages to anti-gravity

// Nova to Anti-Gravity Messages (I write these)
const novaMessages = [];

// Anti-Gravity to Nova Messages (anti-gravity writes these)
const antigravityMessages = [];

export const CommunicationProtocol = {
    // Nova sends message to anti-gravity
    sendMessage: (message, priority = 'normal') => {
        const timestamp = new Date().toISOString();
        const messageEntry = {
            from: 'nova',
            to: 'anti-gravity',
            message,
            timestamp,
            priority,
            status: 'pending'
        };
        
        // Write to file
        const fs = require('fs');
        const content = fs.readFileSync('communication.json', 'utf8');
        const data = JSON.parse(content || '[]');
        data.push(messageEntry);
        fs.writeFileSync('communication.json', JSON.stringify(data, null, 2));
        
        console.log(`📤 Nova → Anti-Gravity: ${message} [${priority}]`);
        return messageEntry;
    },
    
    // Nova checks for messages from anti-gravity
    checkMessages: () => {
        const fs = require('fs');
        try {
            const content = fs.readFileSync('communication.json', 'utf8');
            const data = JSON.parse(content || '[]');
            const newMessages = data.filter(msg => 
                msg.from === 'anti-gravity' && msg.status === 'pending'
            );
            
            if (newMessages.length > 0) {
                // Mark messages as read
                const updatedData = data.map(msg => 
                    msg.from === 'anti-gravity' && msg.status === 'pending' 
                        ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                        : msg
                );
                fs.writeFileSync('communication.json', JSON.stringify(updatedData, null, 2));
                
                console.log(`📥 Nova ← Anti-Gravity: ${newMessages.length} new messages`);
                return newMessages;
            }
            return [];
        } catch (e) {
            return [];
        }
    },
    
    // Get all communication history
    getHistory: () => {
        const fs = require('fs');
        try {
            const content = fs.readFileSync('communication.json', 'utf8');
            return JSON.parse(content || '[]');
        } catch (e) {
            return [];
        }
    }
};
