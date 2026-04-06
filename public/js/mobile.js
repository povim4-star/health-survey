const socket = io();

const form = document.getElementById('healthForm');
const input = document.getElementById('wordInput');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');

// 1. 페이지 로드 시 localStorage로 이미 제출했는지 확인
if (localStorage.getItem('healthCloudSubmitted')) {
    showCompletedState();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        if(input) input.focus();
    });
}

function showCompletedState() {
    if(form) {
        form.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #111827; font-size: 18px; font-weight: 600; line-height: 1.8;">참여가 완료되었습니다!<br><span style="font-size:14px; color:#6b7280; font-weight:400;">대형 스크린을 확인해주세요 🎉</span></div>';
    }
}

// 서버 에러(금지어 등) 처리 — alert() 대신 빨간 토스트로 표시
socket.on('error_message', (msg) => {
    showToast(msg, true);
});

// 성공적으로 제출됨
socket.on('submit_success', () => {
    localStorage.setItem('healthCloudSubmitted', 'true');
    if(input) input.value = '';
    showToast('소중한 의견 감사합니다! ✓');

    setTimeout(() => {
        showCompletedState();
    }, 1500);
});

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // localStorage로 중복 제출 차단
        if (localStorage.getItem('healthCloudSubmitted')) {
            showToast('이미 참여하셨습니다.', true);
            setTimeout(() => showCompletedState(), 1200);
            return;
        }

        const word = input.value.trim();
        if (word) {
            socket.emit('submit_word', word);
            submitBtn.style.transform = 'scale(0.95)';
            setTimeout(() => submitBtn.style.transform = '', 150);
        }
    });
}

let toastTimeout;
function showToast(message, isError) {
    if (!toast) return;
    toast.textContent = message || '전송 완료!';
    toast.classList.remove('error');
    if (isError) toast.classList.add('error');
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
