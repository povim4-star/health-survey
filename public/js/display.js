const socket = io();

// Ensure DOM Elements
const canvas = document.getElementById('wordcloud-canvas');
const emptyState = document.getElementById('emptyState');

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (confirm('모든 단어를 삭제하고 화면을 초기화하시겠습니까?')) {
            // Stop any ongoing drawing
            if (drawTimeout) clearTimeout(drawTimeout);
            
            fetch('/api/clear')
                .then(res => res.json())
                .then(data => console.log(data))
                .catch(err => console.error('Error clearing data:', err));
        }
    });
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    if (Object.keys(wordData).length > 0) scheduleDraw();
});
// Set initial size
resizeCanvas();

let wordData = {};
let drawTimeout = null;

const colorPalette = [
    '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', 
    '#000000', '#171717', '#262626', '#404040', '#525252'
];

function getStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function drawWordCloud() {
    // If width/height hasn't updated yet, cancel
    if (canvas.width === 0 || canvas.height === 0) {
        resizeCanvas();
    }

    const words = Object.entries(wordData).map(([word, weight]) => {
        return [word, weight]; 
    });

    if (words.length > 0) {
        emptyState.classList.add('hidden');
        
        WordCloud(canvas, {
            list: words,
            gridSize: 12,
            weightFactor: function (size) {
                // Return a pixel size for the font based on canvas width
                const baseSize = canvas.width > 800 ? 30 : 20;
                const scale = size * (canvas.width > 800 ? 15 : 10);
                return Math.min(baseSize + scale, 150);
            },
            fontFamily: 'Pretendard, -apple-system, sans-serif',
            color: function (word) {
                const index = getStringHash(word) % colorPalette.length;
                return colorPalette[index];
            },
            rotateRatio: 0, // Keep all words horizontal for a clean look
            backgroundColor: 'transparent',
            drawOutOfBound: false,
            shrinkToFit: true,
            minSize: 12
        });
    } else {
        emptyState.classList.remove('hidden');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function scheduleDraw() {
    if (drawTimeout) {
        clearTimeout(drawTimeout);
    }
    drawTimeout = setTimeout(() => {
        drawWordCloud();
    }, 500); 
}

socket.on('init_data', (data) => {
    wordData = data || {};
    scheduleDraw();
});

socket.on('update_data', (data) => {
    wordData = data || {};
    scheduleDraw();
});
