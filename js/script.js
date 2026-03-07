let mic, fft;
let mode = "NEUTRAL";
let particles = [];
let smoothedCentroid = 0;
let appStarted = false;

// Inicialización de iconos Lucide
lucide.createIcons();

function toggleSettings() {
    document.getElementById('config-modal').classList.toggle('open');
}

function startApp() {
    if (appStarted) return;
    // p5.js función para habilitar audio en móviles
    userStartAudio().then(() => {
        appStarted = true;
        document.getElementById('splash-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
        }, 800);
    });
}

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.8, 1024);
    fft.setInput(mic);

    const setupZone = (id, targetMode) => {
        const el = document.getElementById(id);
        const start = (e) => {
            if (!document.getElementById('auto-mode').checked) {
                e.preventDefault();
                mode = targetMode;
            }
        };
        const end = (e) => {
            if (!document.getElementById('auto-mode').checked) {
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
    if (!appStarted) return;

    let vol = mic.getLevel();
    fft.analyze();
    let centroid = fft.getCentroid();

    // Lógica Automática (opcional)
    // Lógica Automática Mejorada
    if (document.getElementById('auto-mode').checked && vol > 0.008) {
        smoothedCentroid = lerp(smoothedCentroid, centroid, 0.1);
        // Ajustamos umbrales: si la voz es aguda o fuerte, es LIE
        mode = (smoothedCentroid > 2200 || vol > 0.25) ? "LIE" : "TRUTH";
    } else if (document.getElementById('auto-mode').checked) {
        mode = "NEUTRAL";
    }

    translate(width / 2, height / 2);

    let targetColor = color(212, 175, 55, 120);
    // Umbral más bajo para detectar voz (0.005 en lugar de 0.01)
    let targetText = vol > 0.005 ? "Analizando energía..." : "Escuchando el silencio...";

    // Feedback visual de sensibilidad (opcional, para que el mago sepa que el mic funciona)
    if (vol > 0.005 && mode === "NEUTRAL") {
        targetColor = color(212, 175, 55, 180 + sin(frameCount * 0.1) * 50);
    }

    if (mode === "TRUTH") {
        targetColor = color(150, 255, 200, 180);
        targetText = "Sincronía: " + document.getElementById('forced-value').value;
    } else if (mode === "LIE") {
        targetColor = color(255, 100, 50, 200);
        targetText = "Disonancia detectada";
    }

    const st = document.getElementById('status-text');
    st.innerText = targetText;
    st.style.color = targetColor.toString();

    // Dibujado del Aura
    noFill();
    stroke(targetColor);
    strokeWeight(mode === "NEUTRAL" ? 1 : 2.5);

    beginShape();
    for (let i = 0; i < 360; i += 3) {
        let angle = radians(i);
        let noiseVal = noise(i * (mode === "LIE" ? 0.3 : 0.05), frameCount * 0.02);
        let r = 140 + map(noiseVal, 0, 1, -25, 25) + (vol * (mode === "LIE" ? 350 : 150));
        vertex(r * cos(angle), r * sin(angle));
    }
    endShape(CLOSE);

    // Partículas
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