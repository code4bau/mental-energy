// --- CONFIGURACIÓN DEL LOGO ---
// Pon aquí la ruta de tu imagen, ej: "assets/logo_mental.png"
const MI_LOGO_URL = "";

if (MI_LOGO_URL !== "") {
    const imgEl = document.getElementById('logo-img');
    imgEl.src = MI_LOGO_URL;
    imgEl.onload = () => {
        imgEl.style.display = 'block';
        document.getElementById('logo-icon').style.display = 'none';
    };
}

// --- CONFIGURACIÓN PWA ---
const manifest = {
    "name": "MentalEnergy",
    "short_name": "MentalEnergy",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#050505",
    "theme_color": "#050505"
};
const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
document.querySelector('#manifest-link').setAttribute('href', URL.createObjectURL(blob));

// Registro de Service Worker para habilitar instalación
if ('serviceWorker' in navigator) {
    const swCode = `self.addEventListener('fetch', function(event) {});`;
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(() => { });
}

lucide.createIcons();

function toggleSettings() {
    const modal = document.getElementById('config-modal');
    modal.classList.toggle('open');
}

// --- LÓGICA DE VISUALIZACIÓN (p5.js) ---
let mic, fft;
let mode = "NEUTRAL";
let statusText;
let particles = [];
let forcedInput;
let autoModeCheckbox;

let smoothedCentroid = 0;
let stressThreshold = 2400;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(document.body);

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.8, 1024);
    fft.setInput(mic);

    statusText = document.getElementById('status-text');
    forcedInput = document.getElementById('forced-value');
    autoModeCheckbox = document.getElementById('auto-mode');

    const setupZone = (id, targetMode) => {
        const el = document.getElementById(id);
        const start = (e) => {
            if (!autoModeCheckbox.checked) {
                e.preventDefault();
                mode = targetMode;
            }
        };
        const end = (e) => {
            if (!autoModeCheckbox.checked) {
                e.preventDefault();
                mode = "NEUTRAL";
            }
        };
        el.addEventListener('touchstart', start);
        el.addEventListener('touchend', end);
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', end);
    };

    setupZone('truth-zone', 'TRUTH');
    setupZone('lie-zone', 'LIE');
}

function draw() {
    background(5, 5, 5, 45);

    let vol = mic.getLevel();
    fft.analyze();
    let centroid = fft.getCentroid();

    if (autoModeCheckbox.checked && vol > 0.02) {
        smoothedCentroid = lerp(smoothedCentroid, centroid, 0.1);
        if (smoothedCentroid > stressThreshold || vol > 0.35) {
            mode = "LIE";
        } else {
            mode = "TRUTH";
        }
    } else if (autoModeCheckbox.checked) {
        mode = "NEUTRAL";
        smoothedCentroid = lerp(smoothedCentroid, 1000, 0.05);
    }

    translate(width / 2, height / 2);

    let targetColor;
    let targetText;
    let intensity = map(vol, 0, 0.4, 40, 350);

    if (mode === "TRUTH") {
        targetColor = color(150, 255, 200, 180);
        targetText = "Sincronía detectada: " + forcedInput.value;
        intensity *= 0.7;
    } else if (mode === "LIE") {
        targetColor = color(255, 100, 50, 200);
        targetText = "Disonancia en la esencia";
        intensity *= 3.5;
    } else {
        targetColor = color(212, 175, 55, 120);
        targetText = vol > 0.01 ? "Analizando energía..." : "Escuchando el silencio...";
    }

    statusText.innerText = targetText;
    statusText.style.color = targetColor.toString();
    statusText.style.textShadow = mode !== "NEUTRAL" ? `0 0 15px ${targetColor.toString()}` : "none";

    // Aura de Energía
    noFill();
    stroke(targetColor);
    strokeWeight(mode === "NEUTRAL" ? 1 : 2.5);

    beginShape();
    for (let i = 0; i < 360; i += 3) {
        let angle = radians(i);
        let noiseFactor = mode === "LIE" ? 0.3 : 0.05;
        let noiseVal = noise(i * noiseFactor, frameCount * 0.02);
        let offset = map(noiseVal, 0, 1, -25, 25);

        if (mode === "LIE") {
            offset += random(-intensity * 0.6, intensity * 0.6);
        }

        let r = 140 + offset + (vol * intensity);
        let x = r * cos(angle);
        let y = r * sin(angle);

        if (i % 30 === 0) {
            fill(targetColor);
            ellipse(x, y, mode === "NEUTRAL" ? 2 : 5);
            noFill();
        }
        vertex(x, y);
    }
    endShape(CLOSE);

    if (vol > 0.01) particles.push(new Particle(targetColor));

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(mode === "LIE");
        particles[i].display();
        if (particles[i].finished()) particles.splice(i, 1);
    }
}

class Particle {
    constructor(col) {
        this.pos = p5.Vector.random2D().mult(140);
        this.vel = this.pos.copy().normalize().mult(random(1, 5));
        this.acc = createVector(0, 0);
        this.alpha = 255;
        this.color = col;
    }
    update(isChaos) {
        if (isChaos) this.acc = p5.Vector.random2D().mult(1.5);
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.alpha -= 5;
    }
    display() {
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        ellipse(this.pos.x, this.pos.y, random(1, 5));
    }
    finished() { return this.alpha < 0; }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }