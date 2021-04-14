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
        <a id="CAMERAS_BUTTON"><i class="big-font fa fa-video-camera"></i></a>
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
  
  const callback = () => {
    ctx.drawImage(video, ctx.canvas.width / 2 - ratio * ctx.canvas.height / 2, 0, ratio * ctx.canvas.height, ctx.canvas.height);
    const im = cv.imread(ctx.canvas);

    const mask = new cv.Mat();
    const low = new cv.Mat(im.rows, im.cols, im.type(), [150, 50, 50, 0]);
    const high = new cv.Mat(im.rows, im.cols, im.type(), [255, 255, 255, 255]);
    cv.inRange(im, low, high, mask);
  
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    if (!contours.size() || true) { 
      // let max_area_idx = 0;
      // for (let i = 0; i < contours.size(); i++) {
      //   if (cv.contourArea(contours[i]) > cv.contourArea(max_area_idx)) {
      //     max_area_idx = i;
      //   }
      // }
      video.pause();
      showResult();
    }
  }

  video.addEventListener('timeupdate', callback); 
}

function showResult() {
  clearScreen();

  ROOT.innerHTML = `
<nav class="navbar is-transparent my-nav">
  <div class="navbar-brand">
    <a style="margin-left: 20px; margin-top: 10px;" class "navbar-item" id="back"><i class="fa fa-times big-font"></i></a> 
  </div>
</nav>
<div class="container"
</div>
  `;
}
