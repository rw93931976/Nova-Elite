// Key routing logic from useNova.ts - CURRENT IMPLEMENTATION

// Bridge URLs
const LOCAL_BRIDGE_URL = 'http://localhost:3000';
const VPS_BRIDGE_URL = 'https://nova.mysimpleaihelp.com';

// Routing logic: determine which bridge to use based on query content
const determineBridge = (query: string): 'local' | 'vps' => {
    const lowerQuery = query.toLowerCase();

    // File-related keywords → local bridge
    const fileKeywords = [
        'desktop', 'files', 'folder', 'directory', 'txt', 'pdf', 'doc', 'jpg', 'png',
        'how many', 'find file', 'search file', 'list files', 'my files', 'local'
    ];

    // Internet/search keywords → VPS bridge
    const internetKeywords = [
        'search', 'weather', 'news', 'information', 'internet', 'web', 'online',
        'what is', 'who is', 'when did', 'where is', 'tell me about', 'look up'
    ];

    const isFileQuery = fileKeywords.some(keyword => lowerQuery.includes(keyword));
    const isInternetQuery = internetKeywords.some(keyword => lowerQuery.includes(keyword));

    // Default to VPS for internet queries, local for file queries
    if (isFileQuery && !isInternetQuery) return 'local';
    if (isInternetQuery && !isFileQuery) return 'vps';

    // If ambiguous, default to VPS (more reliable)
    return 'vps';
};

// Bridge request implementation
if (to === 'bridge') {
    const bridgeType = determineBridge(content);
    const bridgeUrl = bridgeType === 'local' ? LOCAL_BRIDGE_URL : VPS_BRIDGE_URL;

    console.log(`[Bridge Routing] Using ${bridgeType} bridge for: "${content}"`);

    // Send to appropriate bridge via HTTP
    fetch(`${bridgeUrl}/deep-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: content,
            context: '',
            options: { maxDepth: 5 }
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(`[Bridge Response] ${bridgeType}:`, data);
            // Add bridge response as a message
            const responseMessage: Message = {
                id: (Date.now() + 1).toString(),
                from: 'bridge',
                to: 'user',
                content: data.success ?
                    `Found ${data.count || 0} items${data.count > 0 ? ': ' + data.results.slice(0, 3).map((r: any) => r.Name).join(', ') : ''}` :
                    `Error: ${data.error}`,
                timestamp: Date.now(),
                type: 'received',
                status: 'delivered'
            };
            setMessages(prev => [...prev, responseMessage]);
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
        })
        .catch(error => {
            console.error(`[Bridge Error] ${bridgeType}:`, error);
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'failed' } : m));
        });

    return;
}
