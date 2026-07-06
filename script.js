const logo = new Image();
logo.src = "img/logo-aircraft.png";

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const shotImg = document.getElementById('shotImg');
const uploadSrc = document.getElementById('uploadSrc');
const hint = document.getElementById('hint');
const camBtn = document.getElementById('camBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const refreshBtn = document.getElementById("refreshBtn");
const statusEl = document.getElementById('status');
const frameWrap = document.getElementById('frameWrap');
const backBtn = document.getElementById("backBtn");

const idSelect = document.getElementById('idSelect');
const idCustom = document.getElementById('idCustom');
const locSelect = document.getElementById('locSelect');
const locCustom = document.getElementById('locCustom');
const dateInput = document.getElementById('dateInput');
const fp = flatpickr(dateInput, {
    dateFormat: "d/m/Y",
    defaultDate: "today"
});
console.log("Isi:", `"${dateInput.value}"`);

const openOptionBtn = document.getElementById('openOptionBtn');
const optionMenu = document.getElementById('optionMenu');
const defaultAspectRatio = getComputedStyle(frameWrap).aspectRatio;

const today = new Date();
dateInput.value = today.toISOString().split("T")[0];

let originalDataUrl = null;
let cameraImage = null;
let currentSource = null;
let stream = null;
let finalDataUrl = null;

// ==============================
// LOCK SCREEN
// ==============================

const app = document.getElementById("app");
const lockScreen = document.getElementById("lockScreen");

const pinDots = document.querySelectorAll(".pin-dots span");
const pinButtons = document.querySelectorAll(".pin-btn");

const pinDelete = document.getElementById("pinDelete");
const pinEnter = document.getElementById("pinEnter");
const pinStatus = document.getElementById("pinStatus");

const PIN = "123456";

let currentPin = "";

openOptionBtn.addEventListener('click', () => {

    // Kalau kamera sudah aktif → tombol menjadi Ambil Foto
    if(stream){

        const id = getId();
        const loc = getLoc();
        

        if(!id){
            statusEl.textContent = "Pilih ID terlebih dahulu.";
            return;
        }

        if(!loc){
            statusEl.textContent = "Pilih lokasi terlebih dahulu.";
            return;
        }

        // Simpan frame terakhir dari kamera
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;

        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(video, 0, 0);

        // Buat Image dari frame kamera
        cameraImage = new Image();

        cameraImage.onload = () => {

            currentSource = cameraImage;

            takeShot(id, loc, cameraImage);

        };

        cameraImage.src = tempCanvas.toDataURL("image/jpeg", 0.95);

        return;
    }

    // Kalau kamera belum aktif → tampilkan dropdown
    optionMenu.style.display =
        optionMenu.style.display === "flex"
            ? "none"
            : "flex";

});

idSelect.addEventListener('change', () => {
    if (idSelect.value === 'custom') {
        idCustomWrap.style.display = 'flex';
        idCustom.focus();
    } else {
        idCustomWrap.style.display = 'none';
        idCustom.value = '';
    }
});

// filter cuma angka doang yang bisa diketik
idCustom.addEventListener('input', function(e){
    e.target.value = e.target.value.replace(/\D/g, '');
});

locSelect.addEventListener('change', () => {
  locCustom.style.display = locSelect.value === 'custom' ? 'block' : 'none';
});

function getId(){
  return idSelect.value === 'custom'
    ? (idCustom.value.trim() ? '***' + idCustom.value.trim() : '')
    : idSelect.value;
}

function getLoc(){
  return locSelect.value === 'custom' ? locCustom.value.trim() : locSelect.value;
}

uploadBtn.addEventListener('click', () => {
  optionMenu.style.display="none";
  fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    // Cek apakah file asli adalah HEIC
    const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

    let imageFile = file;

    // Jika HEIC / HEIF
    if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif")
    ) {

        const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.95
        });

        imageFile = new File(
            [convertedBlob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            {
                type: "image/jpeg"
            }
        );
    }
  const id = getId();
  const loc = getLoc();
  if(!id){ statusEl.textContent = 'Pilih atau isi ID terlebih dahulu.'; fileInput.value=''; return; }
  if(!loc){ statusEl.textContent = 'Pilih atau isi lokasi terlebih dahulu.'; fileInput.value=''; return; }
  statusEl.textContent = '';

const reader = new FileReader();

reader.onload = (ev) => {

    const img = new Image();

    img.onload = () => {

        // Maksimal tinggi yang diizinkan
        const MAX_HEIGHT = 1280;

        let newWidth = img.width;
        let newHeight = img.height;

        // Hanya kompres jika resolusi terlalu tinggi
        if (img.height > MAX_HEIGHT) {

            const scale = MAX_HEIGHT / img.height;

            newWidth = Math.round(img.width * scale);
            newHeight = Math.round(img.height * scale);

            console.log("Gambar dikompres:", `${newWidth}x${newHeight}`);

        } else {

            console.log("Resolusi normal, tidak dikompres.");

        }

        const tempCanvas = document.createElement("canvas");

        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;

        const tempCtx = tempCanvas.getContext("2d");

        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = "high";

        tempCtx.drawImage(
            img,
            0,
            0,
            newWidth,
            newHeight
        );

        uploadSrc.onload = () => {

            if(stream){
                stream.getTracks().forEach(t => t.stop());
                stream = null;
            }

            currentSource = uploadSrc;

            takeShot(id, loc, uploadSrc);

        };

        uploadSrc.src = tempCanvas.toDataURL(
            "image/jpeg",
            0.90
        );

    };

    img.src = ev.target.result;
};

reader.readAsDataURL(imageFile);

    reader.readAsDataURL(imageFile);
    reader.readAsDataURL(imageFile);
    optionMenu.style.display = "none";
    fileInput.value = '';
});

camBtn.addEventListener('click', async () => {

    optionMenu.style.display = "none";

    try{

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",

                width: {
                    ideal: 1920
                },

                height: {
                    ideal: 1440
                },

                aspectRatio: {
                    ideal: 4 / 3
                }
            },

            audio: false
        });

        video.srcObject = stream;

        await video.play();

        frameWrap.style.aspectRatio =
            `${video.videoWidth}/${video.videoHeight}`;

        video.style.display = "block";

        hint.style.display="none";
        frameWrap.classList.add("live");

        openOptionBtn.textContent="📸 Ambil Foto";
        backBtn.style.display = "flex";

        statusEl.textContent="";

    }catch(err){

        statusEl.textContent="Tidak bisa mengakses kamera.";

    }

});

backBtn.addEventListener("click", () => {

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }

    video.pause();

    video.style.display = "none";
    shotImg.style.display = "none";

    frameWrap.style.aspectRatio = defaultAspectRatio;
    frameWrap.classList.remove("live");

    hint.style.display = "flex";

    openOptionBtn.style.display = "flex";
    openOptionBtn.textContent = "📤 Unggah Gambar";

    optionMenu.style.display = "none";
    backBtn.style.display = "none";

    statusEl.textContent = "";

});

// =========================
// RETAKE
// =========================
retakeBtn.addEventListener("click", () => {

    shotImg.style.display = "none";
    video.style.display = "block";

    frameWrap.style.aspectRatio = defaultAspectRatio;

    hint.style.display = "flex";

    openOptionBtn.style.display = "flex";
    openOptionBtn.textContent = "📤 Unggah Gambar";

    backBtn.style.display = "none";

    optionMenu.style.display = "none";

    retakeBtn.style.display = "none";
    refreshBtn.style.display = "none";
    downloadBtn.style.display = "none";

    finalDataUrl = null;
    statusEl.textContent = "";

});

// =========================
// DOWNLOAD
// =========================
downloadBtn.addEventListener("click", () => {

    if (!finalDataUrl) return;

    const a = document.createElement("a");
    a.href = finalDataUrl;
    a.download = `presensi_${Date.now()}.jpg`;
    a.click();

});
// =========================
// REFRESH
const refreshIcon = refreshBtn.querySelector("img");

refreshBtn.addEventListener("click", () => {

    if (!currentSource) return;

    const id = getId();
    const loc = getLoc();

    refreshBtn.classList.remove("spinning");
    void refreshIcon.offsetWidth; // reset animasi

    refreshBtn.classList.add("spinning");

    takeShot(id, loc, currentSource);

});

refreshIcon.addEventListener("animationend", () => {
    refreshBtn.classList.remove("spinning");
});

function drawLocation(ctx, text, x, bottom, maxWidth, lineHeight){

    // Pisahkan berdasarkan enter
    const paragraphs = text.split("\n");

    let lines = [];

    for (const paragraph of paragraphs) {

        const words = paragraph.split(" ");
        let line = "";

        for (const word of words) {

            const test = line + word + " ";

            if (ctx.measureText(test).width > maxWidth && line !== "") {
                lines.push(line.trim());
                line = word + " ";
            } else {
                line = test;
            }
        }

        if (line.trim() !== "") {
            lines.push(line.trim());
        }
    }

    let y = bottom - (lines.length * lineHeight);

    for (const l of lines) {
        ctx.fillText(l, x, y);
        y += lineHeight;
    }
}

// PIN LOCK SCREEN

function updateDots(){

    pinDots.forEach((dot,index)=>{

        dot.classList.toggle("active",index<currentPin.length);

    });

}

pinButtons.forEach(btn=>{

    btn.onclick=()=>{

        if(currentPin.length>=6) return;

        currentPin+=btn.dataset.num;

        updateDots();

    };

});

pinDelete.onclick=()=>{

    currentPin=currentPin.slice(0,-1);

    updateDots();

};

pinEnter.onclick=()=>{

    if(currentPin===PIN){

        lockScreen.style.display="none";

        app.style.display="block";

    }else{

        pinStatus.textContent = "PIN salah";
        pinStatus.classList.add("show");

        currentPin = "";
        updateDots();

        setTimeout(() => {

            pinStatus.classList.remove("show");
            pinStatus.textContent = "";

        }, 3000);

    }

};

// ==============================
// Layout Watermark
// ==============================
const layouts = {

    "3:4": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.45,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,
    },

    "4:3":{
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.45,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,

    },

    "16:9":{
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.20,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,

    },
    "9:16":{
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: -750,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 5,
    },
    "1920x1440": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,

    },

    "1:1":{

        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:20,
        fontId:20,
        fontLocation: 20,
    }

};

const customSizes = {

    // ======================
    // 4:3
    // ======================

    "480x640": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.45,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,
        // VGA
    },
    //     "720x1280": {
    //     infoX: -7,
    //     infoY: 22,
    //     infoGap: 8,

    //     logoX: -750,
    //     logoY: -35,
    //     logoScale:0.45,

    //     locationX: -7,
    //     locationY:-44,

    //     fontDate:12,
    //     fontId:12,
    //     fontLocation: 20,
    // },

    "768x1024": {
        // Tablet
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,
    },

    "960x1280": {
        // HD 4:3
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.45,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,
    },

    "1200x1600": {
        // 2 MP
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,
    },

    "1440x1920": {
        // iPhone Portrait
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 13,
    },
    // "1920x1440": {
    //     infoX: -7,
    //     infoY: 22,
    //     infoGap: 8,

    //     logoX: 30,
    //     logoY: -35,
    //     logoScale:0.45,

    //     locationX: -7,
    //     locationY:-44,

    //     fontDate:12,
    //     fontId:12,
    //     fontLocation: 8.95,
    // },

    "1536x2048": {
        // iPad
    },

    "1944x2592": {
        // 5 MP
    },

    "2448x3264": {
        // 8 MP
    },


    "3072x4096": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,
    },

    "3456x4608": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,
    },

    "4000x3000": {
        // 12 MP Landscape
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 30,
        logoY: -35,
        logoScale:0.45,

        locationX: -7,
        locationY:-44,

        fontDate:12,
        fontId:12,
        fontLocation: 8.75,
    },

    // ======================
    // 16:9
    // ======================

    "640x360": {},

    "854x480": {},

    "1280x720": {
        infoX: -7,
        infoY: 22,
        infoGap: 8,

        logoX: 24,
        logoY: -40,
        logoScale:0.35,

        locationX: -7,
        locationY:-46,

        fontDate:12,
        fontId:12,
        fontLocation: 8.95,
    },

    "1600x900": {},

    "1920x1080": {},

    "2560x1440": {},

    "3840x2160": {},

    // ======================
    // 1:1
    // ======================

    "1080x1080": {},

    "2048x2048": {},

    "3024x3024": {}

};

function getAspectRatio(w, h) {

    const ratio = w / h;

    if (Math.abs(ratio - 1) < 0.08)
        return "1:1";

    // 4:3 Landscape
    if (Math.abs(ratio - (4/3)) < 0.08)
        return "4:3";

    // 3:4 Portrait
    if (Math.abs(ratio - (3/4)) < 0.08)
        return "3:4";

    // 16:9 Landscape
    if (Math.abs(ratio - (16/9)) < 0.10)
        return "16:9";

    // 9:16 Portrait
    if (Math.abs(ratio - (9/16)) < 0.10)
        return "9:16";

    return "4:3";
}


function takeShot(id, loc, source){
    console.log(source);
    console.log(source.id);

    // =========================
    // Ukuran Gambar
    // =========================
    const w = source.videoWidth || source.naturalWidth;
    const h = source.videoHeight || source.naturalHeight;

    const ratioKey = getAspectRatio(w, h);

    let layout = { ...layouts[ratioKey] };

    const sizeKey = `${w}x${h}`;

    console.log(sizeKey);
    console.log(customSizes[sizeKey]);
    if (customSizes[sizeKey]) {
        layout = {
            ...layout,
            ...customSizes[sizeKey]
        };
    }

    // =========================
    // DEBUG
    // =========================
    console.log("Ukuran :", `${w} x ${h}`);
    console.log("Rasio  :", (w / h).toFixed(3));
    console.log("Layout :", ratioKey);
    console.log("Custom :", customSizes[sizeKey] ? sizeKey : "Tidak ada");

    let outW = w;
    let outH = h;

    // Jika resolusi kecil, naikkan 2x
    if (w <= 720 || h <= 720) {
        outW = w * 2;
        outH = h * 2;
    }

    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
        source,
        0,
        0,
        outW,
        outH
    );

    // =========================
    // Margin Responsif
    // =========================
    const marginX = outW * 0.03;
    const marginY = outH * 0.03;

    let infoX, infoY, infoGap;
    let logoX, logoY;
    let locationX, locationY;

    infoX = marginX + layout.infoX;
    infoY = marginY + layout.infoY;
    infoGap = layout.infoGap;

    logoX = marginX + layout.logoX;
    logoY = marginY + layout.logoY;

    locationX = marginX + layout.locationX;
    locationY = marginY + layout.locationY;

    // =========================
    // Ukuran Font
    // =========================
    let fontDate, fontId, fontLocation;

    if (ratioKey === "9:16") {

        fontDate = outW * 0.036;
        fontId = outW * 0.036;
        fontLocation = w * 0.070;

    } else {

        const base = Math.max(outW, outH);

        fontDate = Math.max(layout.fontDate, base * 0.025);
        fontId = Math.max(layout.fontId, base * 0.025);
        fontLocation = (base * 0.018) + layout.fontLocation;

    }

    console.log({
    fontDate,
    fontId,
    fillStyle: ctx.fillStyle,
    globalAlpha: ctx.globalAlpha
});

    // =========================
    // Canvas terpisah khusus watermark (transparan)
    // Digambar di ukuran LEBIH KECIL (scaleDown) lalu di-upscale
    // supaya efek blur-nya terasa "sub-pixel" (mis. ~1.5px) walau
    // StackBlur cuma bisa radius bulat (1, 2, 3, ...)
    // =========================
    const scaleDown = 1; // makin kecil nilai ini, makin halus/blur efeknya
    const smallW = Math.round(outW * scaleDown);
    const smallH = Math.round(outH * scaleDown);

    const wmCanvasSmall = document.createElement("canvas");
    wmCanvasSmall.width = smallW;
    wmCanvasSmall.height = smallH;
    const wctx = wmCanvasSmall.getContext("2d");

    // Semua koordinat & ukuran font watermark ikut di-scale
    // supaya posisi & proporsinya tetap sama persis seperti aslinya
    wctx.scale(scaleDown, scaleDown);

    // =========================
    // Shadow (untuk watermark)
    // =========================
    wctx.shadowColor = "rgba(0,0,0,.75)";
    wctx.shadowBlur = 30;
    wctx.shadowOffsetX = 0;
    wctx.shadowOffsetY = 0;

    // =========================
    // DATE & TIME
    // =========================
    // Jam realtime
    const now = new Date();
    console.log(dateInput.value);

    let selectedDate = fp.selectedDates[0] || now;

    const date = selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });

    wctx.textAlign = "left";
    wctx.fillStyle = "#D7DF2B";

    wctx.font = `${fontLocation}px Arial`;
    wctx.fillText(
        `${date}, ${time}`,
        infoX,
        infoY
    );

    // =========================
    // ID
    // =========================
    wctx.font = `${fontLocation}px Arial`;
    wctx.fillText(
        id,
        infoX,
        infoY + fontDate + infoGap
    );
    

    // =========================
    // LOGO PNG
    // =========================

    const logoWidth = outW * layout.logoScale;
    const logoHeight = logoWidth * (logo.height / logo.width);

    if (ratioKey === "9:16") {

        wctx.drawImage(
            logo,
            w - logoX - logoWidth,
            logoY,
            logoWidth,
            logoHeight
        );

    } else {

        wctx.drawImage(
            logo,
            outW - marginX - logoWidth + layout.logoX,
            infoY + layout.logoY,
            logoWidth,
            logoHeight
        );

    }


    // =========================
    // LOKASI
    // =========================

    wctx.fillStyle = "#D7DF2B";
    wctx.font = `${fontLocation}px Arial`;

    // Paksa Indonesia ke bawah
    const displayLocation = loc;

    drawLocation(
        wctx,
        displayLocation,
        locationX,
        outH - locationY,
        outW * 0.90,
        fontLocation * 1.3
    );

    // =========================
    // Blur di canvas KECIL (radius bulat, mis. 1)
    // =========================
    const blurRadius = 1;
    StackBlur.canvasRGBA(
        wmCanvasSmall,
        0,
        0,
        smallW,
        smallH,
        blurRadius
    );

    // =========================
    // Upscale watermark kecil (sudah blur) ke ukuran penuh
    // Proses upscale ini yang menghasilkan efek blur "sub-pixel"
    // =========================
    const wmCanvas = document.createElement("canvas");
    wmCanvas.width = outW;
    wmCanvas.height = outH;
    const wmFullCtx = wmCanvas.getContext("2d");
    wmFullCtx.imageSmoothingEnabled = true;
    wmFullCtx.imageSmoothingQuality = "high";
    wmFullCtx.drawImage(wmCanvasSmall, 0, 0, outW, outH);

    // =========================
    // Tempel watermark yang sudah di-blur ke atas foto asli
    // =========================
    ctx.drawImage(wmCanvas, 0, 0);

    // =========================
    // Simpan Hasil
    // =========================
    finalDataUrl = canvas.toDataURL("image/jpeg", 0.95);

    shotImg.onload = () => {
        frameWrap.style.aspectRatio =
            `${shotImg.naturalWidth}/${shotImg.naturalHeight}`;
    };

    shotImg.src = finalDataUrl;

    shotImg.style.display = "block";
    video.style.display = "none";
    hint.style.display = "none";

    openOptionBtn.style.display = "none";
    backBtn.style.display = "none";
    optionMenu.style.display = "none";
    

    retakeBtn.style.display = "flex";
    refreshBtn.style.display = "flex";
    downloadBtn.style.display = "flex";

    frameWrap.classList.remove("live");

    if(stream){
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }

    }

// ===== Disable zoom di seluruh app =====

// Block pinch-zoom (2 jari)
document.addEventListener('touchmove', function(e){
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Block gesturestart (Safari khusus)
document.addEventListener('gesturestart', function(e){
    e.preventDefault();
});

// Block ctrl+scroll zoom desktop
document.addEventListener('wheel', function(e){
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }
}, { passive: false });