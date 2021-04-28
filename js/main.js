const MODEL = null;

onload = async () => {
	MODEL = tf.LoadLayersModel('model.h5');
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

function in_range(min, max, photo) {
	const { width, height, data } = photo;
    const size = width * height;

    const mask = [];
    for (let i = 0; i < 4*size; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];

		if (r > min[0] && r <= max[0] && 
		    g > min[1] && g <= max[1] && 
			b > min[2] && b <= max[2]) {
            mask.push(255);
        } else {
            mask.push(0);
        }
    }

	return mask;
}

function findLetters(photo) {
   	const min = [0, 0, 0];
    const max = [255, 255, 255];

	const bw_image = in_range(min, max, photo);

	const { width, height } = photo;
	const size = width*height;

	const components = new Map();
	const unprocessed = [];

	const toI = (x,y) => { if (x < 0 || x >= width || y < 0 || y >= height) { throw null; } return width*y + x; };
	const get = (x,y) => y === undefined ? bw_image[x] : bw_image[toI(x,y)];
	const toXY = i => [i%width, Math.floor(i/width)];

	for (let i = 0; i < size; i++) { if (get(i) > 0) { unprocessed.push(i); components.set(i, 0); } }

	let componentNum = 0;
	while (unprocessed.length > 0) {
		componentNum += 1;

		const queue = [unprocessed.pop()];

		// START DFS
		while (queue.length > 0) {
			const i = queue.pop();
	
			const component = components.get(i);
			if (component === undefined) { continue; } // цвет чёрный
			if (component > 0) { continue; }           // мы там были

			components.set(i, componentNum);
			

			const [x,y] = toXY(i);

			const neighbors = [ 
				[x-1,y-1], [x,y-1], [x+1,y-1], 
				[x-1,y], /*[x,y],*/ [x+1,y], 
				[x-1,y+1], [x,y+1], [x+1,y+1], 
			];

			for (const [nx, ny] of neighbors) {
				try { queue.push(toI(nx, ny)); } catch(err){}
			}
		} // END DFS
	}

	const result = new Map();

	for (const [i, n] of components) {
		let array = result.get(n);
		if (array === undefined) { array = []; result.set(n, array); }
		array.push(toXY(i));
	}

	for (const [i, ctr] of resut) {
		CTX.fillStyle = 'black';
		CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
		CTX.fillStyle = 'white';

		let minx, maxx, miny, maxy;
		for (const p of ctr) {
			minx = Math.min(minx, p[0]);
			maxx = Math.max(maxx, p[0]);
			miny = Math.min(miny, p[1]);
			maxy = Math.max(maxy, p[1]);

			CTX.fillRect(p[0], p[1], 1, 1);
		}

		const { data } = CTX.getImageData(0, 0, CTX.canvas.width, CTX.canvas.height);
		const letter = [];
		let i = toI(minx, miny);
		while (i <= toI(maxx, maxy)) {
			letter.push(data[i] > 0 ? 1 : 0)

			i += 4;
		}
	}
}

function decode(prediction) {
	return 0;
}

function analyzePhoto(photo) {
    const letters = findLetters(photo);
	const gray_img = to_gray(photo);
	
	const letters_res = []
	for ([s_x, s_y, w, h] of letters) {
		const letter = [];
		let x = s_x, y = s_y;
		for (let i = 0; i < w * h; i++) {
			letter.push(gray_img[y * width + x]);

			x += 1;
        	if (x >= w) {
            	x = s_x;
           		y += 1;
        	}
		}

		letters_res.push(decode(MODEL.predict(tf.tensor(letter))));
	}

	let a = 0, b = 0, c = 0, op = null;
	for (let i = 0; i < letters_res.size(); i++) {
		if (letters_res[i] == 'x') {
			const k_arr = [];
			for (let j = i; j >= 0; j--) {
				k_arr.unshift(letters_res[j]);
			}

			if (k_arr) {
				a = Number.parseInt(k_arr.join());
			}
		else if (letters_res[i] = '+' | letters_res[i] == '-') {
		 	op = letters_res[i];

			const k_arr = [];
			let j = i + 1;
			while (letters_res[j] != '=' && j < letters_res.size()) {
				k_arr.push(letters_res[j]);
				j++;
			}

			if (k_arr) {
				b = Number.parseInt(k_arr.join());
			}
		}
	}
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

