onload = async () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('cnv');

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    video.play();
  } catch (e) {
    console.error(e);

    const foo = document.createElement('p');
    foo.style.position = 'absolute';
    document.body.appendChild(foo);
    foo.innerHTML = `${e.message}`;
  }

  video.addEventListener('timeupdate', () => {
    ctx.drawImage(video, 0, 0, video.width, video.height); 
  });
}

/*
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
}*/
