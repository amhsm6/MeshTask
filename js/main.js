const video = document.getElementById('video');
const canvas = document.getElementById('cnv');
const showVideoBtn = document.getElementById('showVideo');
const problemInput = document.getElementById('problem');
const calcBtn = document.getElementById('calc');
const out = document.getElementById('output');

const width = 560;
const height = 400;

showVideoBtn.addEventListener('click', async () => {
    try {
        video.classList.remove('hidden');
        video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width, height }, audio: false });
        video.play();
    } catch (e) {
        console.error(e);
    }
});

video.addEventListener('timeupdate', () => {
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const im = cv.imread(canvas);
    if (true) {
        video.pause();
        video.classList.add('hidden');

        problemInput.value = '2x - 3 = 0';
    }
});

calcBtn.addEventListener('click', () => {
    const problem = problemInput.value;

    out.innerHTML = 'x = -3 / 2';
});