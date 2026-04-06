const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Store word frequencies
let wordCounts = {};

// 🛑 여기에 차단하고 싶은 단어(욕설, 비속어, 스팸 등)를 자유롭게 추가/수정하세요.
const FORBIDDEN_WORDS = [
    '바보', '멍청이', '씨발', '개새끼', '존나', '섹스', 'ㅅㅂ', 'ㅄ',
    '테스트', 'test'
];

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

app.get('/api/clear', (req, res) => {
    wordCounts = {};
    io.emit('update_data', wordCounts);
    res.json({ success: true, message: 'Data cleared' });
});

app.get('/api/qr', async (req, res) => {
    try {
        // Render.com 같은 클라우드에서는 자동으로 RENDER_EXTERNAL_URL 값을 제공합니다.
        const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://${getLocalIp()}:${PORT}`;
        const url = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#111827', // 이제 완벽한 검정 컬러로 생성됩니다!
                light: '#ffffff'
            }
        });
        res.json({ url, qr: qrCodeDataUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Send initial data to the newly connected client
    socket.emit('init_data', wordCounts);

    socket.on('submit_word', (word) => {
        if (!word || typeof word !== 'string') return;
        
        const cleanWord = word.trim().substring(0, 25);
        if (cleanWord.length === 0) return;

        // 금지어 검열
        const isBanned = FORBIDDEN_WORDS.some(banned => cleanWord.toLowerCase().includes(banned.toLowerCase()));
        if (isBanned) {
            socket.emit('error_message', '부적절한 단어가 포함되어 있어 등록할 수 없습니다.');
            return;
        }

        // 성공적으로 등록
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;

        socket.emit('submit_success');
        io.emit('update_data', wordCounts);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`[Health Wordcloud Server]`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Network Access URL: http://${ip}:${PORT}`);
    console.log(`Display URL: http://localhost:${PORT}/display.html`);
});
