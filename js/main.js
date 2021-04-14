onload = async () => {
  await drawMainScreen(); 
}


function clearScreen() {
  ROOT.innerHTML = '';
}


async function drawMainScreen() {
  clearScreen();

  ROOT.innerHTML = `
<nav class="navbar is-transparent my-nav">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://uchebnik.mos.ru">
      МЭШ
    </a>
  </div>

  <div class="navbar-menu is-active">
    <div class="navbar-end">
      <div class="navbar-item">
        <a id="CAMERAS_BUTTON">Cameras</a>

        </div>
      </div>
    </div>
  </div>
</nav>
<div id="cameras_container" class="section container hidden"><div id="cameras" class="panel my-panel"></div></div>
<canvas class="fullsize" id="cnv"></cnv>
<video id="video" class="hidden"></video>
  `;

  const video = document.getElementById('video');
  const canvas = document.getElementById('cnv');
  const cameras = document.getElementById('cameras');
  const camerasContainer = document.getElementById('cameras_container');
  const camerasButton = document.getElementById('CAMERAS_BUTTON');
  camerasButton.onclick = () => {
    camerasContainer.classList.toggle('hidden');
  };

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    let idx = 1;
    devices.forEach((device) => {
      if (device.kind === 'videoinput') {
        cameras.insertAdjacentHTML(
          'beforeend', 
          `
            <a id=${ device.deviceId } class="panel-block">
              Camera ${ idx }
            </a>
          `
        );
        idx++;
        document.getElementById(device.deviceId).addEventListener('click', async () => {
          camerasContainer.classList.toggle('hidden'); 
          await processCamera(device.deviceId, ctx);
        });
      }
    });


    await processCamera(null, ctx);
  } catch (e) {
    console.error(e);

    const foo = document.createElement('p');
    foo.style.position = 'absolute';
    document.body.appendChild(foo);
    foo.innerHTML = `${e.message}`;
  }
}

async function processCamera(deviceId, ctx) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId }, audio: false });
  video.srcObject = stream;
  video.play();

  const { width, height } = video.srcObject.getVideoTracks()[0].getSettings();
  const ratio = width / height;
  
  video.addEventListener('timeupdate', () => {
    ctx.drawImage(video, ctx.canvas.width / 2 - ratio * ctx.canvas.height / 2, 0, ratio * ctx.canvas.height, ctx.canvas.height);
    const im = cv.imread(canvas);

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
