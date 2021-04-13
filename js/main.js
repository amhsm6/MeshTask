const video = document.getElementById('video');
const canvas = document.getElementById('cnv');
const showVideoBtn = document.getElementById('showVideo');

const width = 560;
const height = 400;

showVideoBtn.addEventListener('click', async () => {
    try {
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
    // TODO: detecting writing
    if (true) {
        video.pause();
        video.classList.add('hidden');


    }
});