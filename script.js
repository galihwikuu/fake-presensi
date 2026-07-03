const logo = new Image();
logo.src = "logo-putih.png";

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

        takeShot(id, loc, video);
        return;
    }

    // Kalau kamera belum aktif → tampilkan dropdown
    optionMenu.style.display =
        optionMenu.style.display === "flex"
            ? "none"
            : "flex";

});
 

const idCustomWrap = document.getElementById('idCustomWrap');

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

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const id = getId();
  const loc = getLoc();
  if(!id){ statusEl.textContent = 'Pilih atau isi ID terlebih dahulu.'; fileInput.value=''; return; }
  if(!loc){ statusEl.textContent = 'Pilih atau isi lokasi terlebih dahulu.'; fileInput.value=''; return; }
  statusEl.textContent = '';

  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadSrc.onload = () => {
      // stop camera if running
      if(stream){
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      takeShot(id, loc, uploadSrc);
    };
    uploadSrc.src = ev.target.result;
  };
  reader.readAsDataURL(file);
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
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.45,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "4:3":{
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.30,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,

    },

    "16:9":{
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -20,
        logoScale:0.35,

        locationX: -3,
        locationY: -20,

        fontDate:15,
        fontId:15,
        fontLocation:15,

    },
    "9:16":{
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: -15,
        logoY: -30,
        logoScale:0.45,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },
    "1920x1440": {
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.30,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,

    },

    "1:1":{

        infoX: 20,
        infoY: 30,
        infoGap: 8,

        logoX:-12,
        logoY: -40,
        logoScale:0.4,

        locationX: 20,
        locationY:-17,

        fontDate:16,
        fontId:15,
        fontLocation:15
    }

};

const customSizes = {

    // ======================
    // 4:3
    // ======================

    "480x640": {
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 20,
        logoY: -15,
        logoScale:0.47,

        locationX: -3,
        locationY:-17,

        fontDate:15,
        fontId:15,
        fontLocation:15,
        // VGA
    },
        "720x1280": {
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: -10,
        logoY: -15,
        logoScale:0.45,

        locationX: -3,
        locationY: -35,

        fontDate:30,
        fontId:30,
        fontLocation:30,
    },

    "768x1024": {
        // Tablet
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -29,
        logoScale:0.47,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "960x1280": {
        // HD 4:3
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.30,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "1200x1600": {
        // 2 MP
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.30,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "1440x1920": {
        // iPhone Portrait
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: 25,
        logoY: -35,
        logoScale:0.47,

        locationX: -3,
        locationY: -35,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },
    "1920x1440": {
        infoX: -3,
        infoY: 10,
        infoGap: 8,

        logoX: -10,
        logoY: -25,
        logoScale:0.45,

        locationX: -3,
        locationY: -35,

        fontDate:30,
        fontId:30,
        fontLocation:30,
    },

    "1536x2048": {
        // iPad
    },

    "1944x2592": {
        // 5 MP
    },

    "2448x3264": {
        // 8 MP
    },

    "3024x4032": {
        // 12 MP (banyak Android/iPhone)
        infoX: -3,
        infoY: 50,
        infoGap: 8,

        logoX: 25,
        logoY: -70,
        logoScale:0.47,

        locationX: -3,
        locationY: -55,

        fontDate:15,
        fontId:15,
        fontLocation:15,
        
    },
    "2268x4032": {
        // Full Iphone
        infoX: -3,
        infoY: 50,
        infoGap: 8,

        logoX: 25,
        logoY: -70,
        logoScale:0.47,

        locationX: -3,
        locationY: -55,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "3072x4096": {
        infoX: -3,
        infoY: 50,
        infoGap: 8,

        logoX: 25,
        logoY: -70,
        logoScale:0.47,

        locationX: -3,
        locationY: -55,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "3456x4608": {
        infoX: -3,
        infoY: 50,
        infoGap: 8,

        logoX: 25,
        logoY: -70,
        logoScale:0.47,

        locationX: -3,
        locationY: -55,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    "4000x3000": {
        // 12 MP Landscape
        infoX: -3,
        infoY: 50,
        infoGap: 8,

        logoX: 25,
        logoY: -70,
        logoScale:0.47,

        locationX: -3,
        locationY: -55,

        fontDate:15,
        fontId:15,
        fontLocation:15,
    },

    // ======================
    // 16:9
    // ======================

    "640x360": {},

    "854x480": {},

    "1280x720": {},

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

    // =========================
    // Ukuran Gambar
    // =========================
    const w = source.videoWidth || source.naturalWidth;
    const h = source.videoHeight || source.naturalHeight;

    const ratioKey = getAspectRatio(w, h);

    let layout = { ...layouts[ratioKey] };

    const sizeKey = `${w}x${h}`;

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

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, w, h);

    // =========================
    // Margin Responsif
    // =========================
    const marginX = w * 0.03;
    const marginY = h * 0.03;

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

        fontDate = w * 0.030;
        fontId = w * 0.030;
        fontLocation = w * 0.030;

    } else {

        const base = Math.max(w, h);

        fontDate = Math.max(layout.fontDate, base * 0.020);
        fontId = Math.max(layout.fontId, base * 0.018);
        fontLocation = Math.max(layout.fontLocation, base * 0.018);

    }

    // =========================
    // Shadow
    // =========================
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

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

    ctx.textAlign = "left";
    ctx.fillStyle = "#e7eb10";

    ctx.font = `${fontDate}px Arial`;
    ctx.fillText(
        `${date}, ${time}`,
        infoX,
        infoY
    );

    // =========================
    // ID
    // =========================
    ctx.font = `${fontId}px Arial`;

    ctx.fillText(
        id,
        infoX,
        infoY + fontDate + infoGap
    );

    // =========================
    // LOGO PNG
    // =========================

    const logoWidth = w * layout.logoScale;
    const logoHeight = logoWidth * (logo.height / logo.width);

    ctx.drawImage(
        logo,
        w - marginX - logoWidth + layout.logoX,
        infoY + layout.logoY,
        logoWidth,
        logoHeight
    );

    // Kembalikan filter agar tidak mempengaruhi elemen lain
    ctx.filter = "none";

    // =========================
    // LOKASI
    // =========================

    ctx.fillStyle = "#e7eb10";
    ctx.font = `${fontLocation}px Arial`;

    // Paksa Indonesia ke bawah
    const displayLocation =
        loc.replace(", Indonesia", ",\nIndonesia");

    drawLocation(
        ctx,
        displayLocation,
        locationX,
        h - locationY,
        w - locationX * 2,
        fontLocation * 1.2
    );

    // =========================
    // Reset Shadow
    // =========================
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

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

