function test(input) {
    const patterns = [
        /(?:called|named)\s+(['"]?)([a-zA-Z0-9._\s'-]+(?:\.[a-zA-Z0-9]+)?)\1/i,
        /([a-zA-Z0-9._\s'-]+\.[a-zA-Z0-9]{2,4})/i,
        /(?:the|a)\s+(['"]?)([a-zA-Z0-9._\s'-]+)\1\s+file/i
    ];

    for (let i = 0; i < patterns.length; i++) {
        const match = input.match(patterns[i]);
        if (match) {
            if (i === 0 || i === 2) return match[2].trim();
            return match[1].trim();
        }
    }
    return null;
}

const inputs = [
    'Is there a file named Nova?',
    'The file name is Nova',
    'Find the Nova file',
    'Look for Nova.txt',
    'show the "I\'ll examine Nova\'s current code se.txt" file'
];

inputs.forEach(input => {
    console.log(`Input: "${input}" -> Name: "${test(input)}"`);
});
