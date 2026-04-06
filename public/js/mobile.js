const socket = io();

const form = document.getElementById('healthForm');
const input = document.getElementById('wordInput');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');

// 1. 페이지 로드 시 이미 제출했는지 확인
if (localStorage.getItem('healthCloudSubmitted')) {
    showCompletedState();
} else {
    // 포커스 이동
    window.addEventListener('DOMContentLoaded', () => {
        if(input) input.focus();
    });
}

function showCompletedState() {
    if(form) {
        form.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #10b981; font-size: 18px; font-weight: 600; line-height: 1.5;">참여가 완료되었습니다!<br>대형 스크린을 확인해주세요 🎉</div>';
    }
}

// 서버 에러(금지어, 중복 아이피) 처리
socket.on('error_message', (msg) => {
    alert(msg);
    if (msg.includes('이미 참여하셨습니다')) {
        localStorage.setItem('healthCloudSubmitted', 'true');
        showCompletedState();
    }
});

// 성공적으로 제출됨
socket.on('submit_success', () => {
    // 로컬스토리지에 저장하여 다음에 켰을때도 못하게 막음
    localStorage.setItem('healthCloudSubmitted', 'true');
    if(input) input.value = '';
    showToast();
    
    // 잠깐 토스트를 보여주고 완료 상태로 변경
    setTimeout(() => {
        showCompletedState();
    }, 1200);
});

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const word = input.value.trim();
        
        if (word) {
            // 서버로 단어 전송
            socket.emit('submit_word', word);
            
            // 버튼 클릭 애니메이션
            submitBtn.style.transform = 'scale(0.95)';
            setTimeout(() => submitBtn.style.transform = '', 150);
        }
    });
}

let toastTimeout;
function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
