/** 
 * vps-bridge.cjs
 * RUN THIS ON THE TELEPORT VPS (74.249.170.8)
 * 
 * This script bridges 'localhost' tunnel ports to the public internet
 * so your phone can connect to the Nova Bridge while you are on the road.
 * 
 * Usage: npx pm2 start vps-bridge.cjs --name vps-bridge
 */

const net = require('net');

function createBridge(publicPort, localPort) {
    net.createServer((publicSocket) => {
        const localClient = net.createConnection({ port: localPort, host: '127.0.0.1' });

        publicSocket.pipe(localClient);
        localClient.pipe(publicSocket);

        publicSocket.on('error', (err) => {
            console.log(`[Public Port ${publicPort}] Socket error:`, err.message);
            localClient.destroy();
        });

        localClient.on('error', (err) => {
            console.log(`[Local Port ${localPort}] Tunnel unreachable:`, err.message);
            publicSocket.destroy();
        });

    }).listen(publicPort, '0.0.0.0', () => {
        console.log(`✅ Road Mode Active: Public :${publicPort} -> Tunnel :${localPort}`);
    });
}

// Bridge from PUBLIC port (39922) to INTERNAL tunnel port (44922)
createBridge(39922, 44922);
createBridge(39925, 44925);


// End of bridge mappings (Sensory Link active on 31922)
