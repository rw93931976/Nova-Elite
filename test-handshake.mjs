import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();

var KEY = process.env.GEMINI_API_KEY;
var MODEL = 'models/gemini-2.5-flash-native-audio-latest';
var url = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' + KEY;

console.log('Test 1: using ' + MODEL);
var ws = new WebSocket(url);

ws.on('open', function () {
    console.log('Connected. Sending setup...');
    ws.send(JSON.stringify({
        setup: {
            model: MODEL,
            generationConfig: {
                responseModalities: ['AUDIO']
            }
        }
    }));
});

ws.on('message', function (data) {
    try {
        var msg = JSON.parse(data.toString());
        console.log('MSG KEYS: ' + Object.keys(msg).join(', '));
        if (msg.setupComplete !== undefined) {
            console.log('SETUP COMPLETE!!! Session ready.');
        }
        if (msg.serverContent) {
            console.log('SERVER CONTENT received');
        }
        if (msg.error) {
            console.log('ERROR: ' + JSON.stringify(msg.error));
        }
    } catch (e) {
        console.log('RAW: ' + data.toString().substring(0, 200));
    }
});

ws.on('error', function (e) { console.log('WS ERROR: ' + e.message); });
ws.on('close', function (code, reason) {
    console.log('CLOSED: ' + code + ' ' + reason.toString());

    // Test 2: try gemini-3.1-flash-live-preview without systemInstruction
    console.log('---');
    console.log('Test 2: using models/gemini-3.1-flash-live-preview');
    var ws2 = new WebSocket(url);
    ws2.on('open', function () {
        console.log('Connected. Sending setup...');
        ws2.send(JSON.stringify({
            setup: {
                model: 'models/gemini-3.1-flash-live-preview',
                generationConfig: {
                    responseModalities: ['AUDIO']
                }
            }
        }));
    });
    ws2.on('message', function (data) {
        try {
            var msg = JSON.parse(data.toString());
            console.log('MSG KEYS: ' + Object.keys(msg).join(', '));
            if (msg.setupComplete !== undefined) {
                console.log('SETUP COMPLETE!!! Session ready.');
            }
            if (msg.error) {
                console.log('ERROR: ' + JSON.stringify(msg.error));
            }
        } catch (e) {
            console.log('RAW');
        }
    });
    ws2.on('error', function (e) { console.log('WS ERROR: ' + e.message); });
    ws2.on('close', function (code, reason) {
        console.log('CLOSED: ' + code + ' ' + reason.toString());
        process.exit(0);
    });
    setTimeout(function () { ws2.close(); process.exit(0); }, 8000);
});

setTimeout(function () { ws.close(); }, 8000);
