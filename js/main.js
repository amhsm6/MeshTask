onload = async () => {
  await drawMainScreen(); 
}


function clearScreen() {
  ROOT.innerHTML = '';
}


let CTX = null;
let CAMERAS_NOT_FOUND = false;

async function drawMainScreen() {
  clearScreen();

  ROOT.innerHTML = `
<nav class="navbar is-transparent my-nav">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://uchebnik.mos.ru">
      <img src="assets/logo.png" class="logo" alt="МЭШ">
    </a>
    <div class="navbar-item menu-separated is-hidden-desktop">
      <a class="about"><i class="big-font fa fa-question"></i></a>
    </div>
    <div class="navbar-item is-hidden-desktop">
      <a class="cameras_button"><i class="big-font fa fa-video-camera"></i></a>
    </div>

  </div>


  <div class="navbar-menu">
    <div class="navbar-end">
      <div class="navbar-item">
        <a class="about"><i class="big-font fa fa-question"></i></a>
      </div>
      <div class="navbar-item">
        <a class="cameras_button"><i class="big-font fa fa-video-camera"></i></a>
      </div>
    </div>
  </div>

</nav>
<div id="cameras_container" class="section container hidden"><div id="cameras" class="panel my-panel"></div></div>
<canvas class="fullsize" id="cnv"></canvas>
<video id="video" class="hidden"></video>
  `;

  const canvas = document.getElementById('cnv');
  const cameras = document.getElementById('cameras');
  const camerasContainer = document.getElementById('cameras_container');

  for (const el of document.getElementsByClassName('about')) {
    el.onclick = () => {
      showAbout();
    };
  }
  
  for (const el of document.getElementsByClassName('cameras_button')) {
    el.onclick = async () => {
      cameras.innerHTML = '';

      const devices = await navigator.mediaDevices.enumerateDevices();
      let idx = 1;

      devices.forEach((device) => {
        if (device.kind === 'videoinput') {
          const button = document.createElement('a');
          button.id = `DEV_${device.deviceId}`;
          button.className = 'panel-block';
          button.innerHTML = `Камера №${idx}`;
          idx++;
          button.onclick = async () => {
            camerasContainer.classList.toggle('hidden', true); 
            try { await processCamera(device.deviceId, ctx); }
            catch (err) { document.body.innerHTML = `${err.message}`; }
          };
          cameras.appendChild(button);
        }
      });

      camerasContainer.classList.toggle('hidden', idx == 1); 
    };
  }


  CTX = canvas.getContext('2d');
  const ctx = CTX;
  
  processResize();
  

  try {
    await processCamera(null, ctx);
  } catch (e) {
    console.error(e);
    CAMERAS_NOT_FOUND = true;
    processResize();
  }


}


async function processCamera(deviceId, ctx) {
  const videoMode = deviceId === null 
    ? { facingMode: 'environment' }
    : { deviceId: { exact: deviceId } };

  const video = document.getElementById("video");
  if (video.srcObject) {
    video.srcObject.getVideoTracks().forEach(track => track.stop());
  }

  const stream = await navigator.mediaDevices.getUserMedia({ 
      video: videoMode, 
      audio: false 
  });


  video.srcObject = stream;
  video.play();

  processResize();

  const callback = () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //ctx.drawImage(video, ctx.canvas.width / 2 - ratio * ctx.canvas.height / 2, 0, ratio * ctx.canvas.height, ctx.canvas.height);
    ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

    const foundSomething = analyzePhoto(
      ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    );
    
    if (foundSomething) { showResult(foundSomething); }
  }

  video.ontimeupdate = () => { 
    try { callback(); }
    catch (err) {
      ctx.fillStyle = 'red';
      ctx.font = '12px serif';
      ctx.fillText(err.message, 50, 100);
    }
  };
}


function analyzePhoto(photo) {
    const rr = 12000;
    const threshold = 0.15;

    const { width, height, data } = photo;

    const r = 37;
    const g = 100;
    const b = 200;

    const size = width * height;

    let total = 0;

    for (let i = 0; i < size; i += 4) {
        const myR = data[i+0];
        const myG = data[i+1];
        const myB = data[i+2];

        const dr = myR - r;
        const dg = myG - g;
        const db = myB - b;
       
        const dd = dr*dr + dg*dg + db*db;

        if (dd < rr) { total += 1; }
    }

    if (total > threshold * size) { return {}; }

    return null;
}



function showResult() {
  showInfo( el => {
    el.innerHTML = `
<div class="content">
  <h3>Вы навели камеру на уравнение</h3>

  <input type="text" value="x^2+3x+2=0">

  <h3>Оно решается так</h3>

  <p>Берёте и решаете!</p>
</div>
    `;
  });
}

function showAbout() {
  showInfo( el => el.innerHTML = `
<div class="content">
  <h2>Инструкция по использования</h2>
  <ul>
    <li>При необходимости выберите правильную камеру</li>
    <li>Наведите экран на уравнение (сейчас &mdash; синее пятно)</li>
    <li>Поздравляем: Вы &mdash; молодец!</li>
  </ul>
</div>` );
}



function showInfo(setup) {
  clearScreen();

  ROOT.innerHTML = `
<nav class="navbar is-transparent my-nav">
  <div class="navbar-brand">
    <a class="navbar-item" href="https://uchebnik.mos.ru">
      <img src="assets/logo.png" class="logo" alt="МЭШ">
    </a>
    <div class="navbar-item menu-separated is-hidden-desktop">
      <a class="navbar-item back_button"><i class="fa fa-times med-font"></i></a>
    </div>
  </div>
  
  <div class="navbar-menu">
    <div class="navbar-end">
      <div class="navbar-item">
        <a class="navbar-item back_button"><i class="fa fa-times med-font"></i></a>
      </div>
    </div>
  </div>

</nav>
<div class="container">
  <div class="section">
    <div id="info_element" class="notification is-primary"></div>
  </div>
</div>
  `;

  for (const el of document.getElementsByClassName('back_button')) {
    el.onclick = () => {
      drawMainScreen();
    };
  }

  if (setup) { setup(document.getElementById('info_element')); }
}



function processResize() {
  const canvas = document.getElementById('cnv');
  if (!canvas) { return; }

  const video = document.getElementById('video');

  if (!video.srcObject) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  } else {
    const { width, height } = video.srcObject.getVideoTracks()[0].getSettings();
    canvas.width = width;
    canvas.height = height;
  }

  if (CTX) { initCanvas(); }
}

onresize = () => { processResize(); };



function initCanvas() {
  CTX.fillStyle = 'white';
  CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  
  if (CAMERAS_NOT_FOUND) {
    CTX.fillStyle = 'red';
    CTX.font = '48px serif';
    CTX.fillText('Камер не обнаружено!', 50, 100);
  }
}

