var micL, micR, fft, samples, song, titles, timestamp, songLen, volume;
var timePaused = 0;
song = 0;
var loadSong;
var colorScale;
var gui;

// color scales
var interpolators = [
    // These are from d3-scale.
    "Inferno",
    "Viridis",
    "Magma",
    "Plasma",
    "Warm",
    "Cool",
    "Rainbow",
    "CubehelixDefault",
    // These are from d3-scale-chromatic
    "Blues",
    "Greens",
    "Greys",
    "Oranges",
    "Purples",
    "Reds",
    "BuGn",
    "BuPu",
    "GnBu",
    "OrRd",
    "PuBuGn",
    "PuBu",
    "PuRd",
    "RdPu",
    "YlGnBu",
    "YlGn",
    "YlOrBr",
    "YlOrRd"
];
var c;
var showWaveform = false;
var showColoredFullPan = false;
var showAdvPan = true;
var ignoredFreq = 25;
var ignoredFreqMax = 1225;
var showColoredFullPanOpacity = 109;
var showColoredFullPanOpacityMax = 250;
var myVolume = .5;
var myVolumeMax = 3.5;
var myVolumeStep = .1;
var myTheme = interpolators;
var Smoothing = 0.9;
var SmoothingMax = 0.99;
var SmoothingStep = 0.01;
var Sound = [
    "samples/stereo-test.mp3",
    "samples/AmbiPan.mp3",
    "samples/mallet.mp3",
    "samples/kzk.mp3",
    "samples/LRMonoPhase4.mp3",
    "samples/off.mp3",
];

var lineHeight = 1
var currentSound;

function preload() {
    timestamp = millis();
    setupFFT()
    loadAudio()

}

function loadAudio() {
    // snd = Sound;
    micR = loadSound(Sound);
    micL = loadSound(Sound, setupInput);

}

function playPause() {
    if (micL.isPlaying()) {
        micL.pause();
        micR.pause();
    } else {
        micL.play();
        micR.play();
    }
}

function setup() {
    c = createCanvas(windowWidth, windowHeight);
    c.mouseClicked(playPause);
    samples = windowHeight;
    colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, width / 2])
    gui = createGui('vEQ Visual');
    ignoredFreqMax = windowHeight;
    gui.addGlobals('myVolume', 'ignoredFreq', 'myTheme', 'Sound', 'Smoothing', 'showWaveform', 'showAdvPan', 'showColoredFullPan'); //'showColoredFullPanOpacity',
    currentSound = Sound
}

function draw() {
    micL.setVolume(myVolume);
    micR.setVolume(myVolume);
    samples = windowHeight //- ignoredFreq;
    lineHeight = windowHeight / (samples - ignoredFreq)
    if (fftLeft) fftLeft.smooth(Smoothing)
    if (fftRight) fftRight.smooth(Smoothing)
    colorScale = d3.scaleSequential(d3['interpolate' + myTheme]).domain([0, width / 2])
    if (currentSound != Sound) {
        console.log('changed', currentSound, Sound)
        micL.stop();
        micR.stop();
        currentSound = Sound
        loadAudio()
    }
    animate();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    samples = windowHeight // - ignoredFreq;
}

function setupFFT() {
    fftLeft = new p5.FFT(Smoothing, samples);
    fftRight = new p5.FFT(Smoothing, samples);
}

function setupInput() {
    console.log(micR)
    samples = windowHeight //- ignoredFreq;;
        // empty channel
    var buf = new Float32Array(micR.buffer.getChannelData(1).length);
    //l
    micL.setBuffer([buf, micL.buffer.getChannelData(0)])
    fftLeft.setInput(micL);
    //r
    micR.setBuffer([micR.buffer.getChannelData(1), buf])
    fftRight.setInput(micR);
    playPause();
}

function animate() {
    var spectrumLeft = fftLeft.analyze();
    var spectrumRight = fftRight.analyze();
    spectrumLeft = spectrumLeft.slice(0, samples - ignoredFreq);
    spectrumRight = spectrumRight.slice(0, samples - ignoredFreq);
    clear();
    background(colorScale(0));
    this.specCrop = samples;

    for (i = this.specCrop; i > 0; i--) {
        // Left
        var ampL = spectrumLeft[i];
        var xL = map(log(ampL), 0, 15, 0, width);
        // var xL = map(log(ampL), 0, log(spectrumLeft.length), 0, width);
        // 15 - strange second param
        // color spectre
        if (!isFinite(xL)) xL = 1;
        var clr = colorScale(xL);
        var lh = lineHeight * 0.5
        if (showColoredFullPan) {
            stroke(clr)
            strokeWeight(lineHeight)
            line(width / 2, this.specCrop - i * lineHeight, 0, this.specCrop - i * lineHeight);
        }

        if (showWaveform) {
            stroke(colorScale(0));
            strokeWeight(lh)
            line(width / 2, this.specCrop - i * lineHeight, width / 2 - xL, this.specCrop - i * lineHeight);
        }

        // Right
        var ampR = spectrumRight[i];
        var xR = map(log(ampR), 0, 15, 0, width);
        if (!isFinite(xR)) xR = 1;
        var clrR = colorScale(xR);

        if (showColoredFullPan) {
            stroke(clrR)
            strokeWeight(lineHeight)
            line(width / 2, this.specCrop - i * lineHeight, width, this.specCrop - i * lineHeight);
        }
        if (showWaveform) {
            stroke(colorScale(0));
            strokeWeight(lh)
            line(width / 2, this.specCrop - i * lineHeight, width / 2 + xR, this.specCrop - i * lineHeight);
        }

        //advanced pan eq
        if (showAdvPan) {
            if (xL > 1 && xR > 1) {
                // coloring
                var clrLR = colorScale((xR + xL) * 0.8)

                stroke(clrLR);
                strokeWeight(lh)
                line(width / 2 + xR, this.specCrop - i * lineHeight, width / 2 - xL, this.specCrop - i * lineHeight);
            } else {
                var clrLR = colorScale((xR + xL) * 1.3)
                stroke(clrLR);
                strokeWeight(lh)
                line(width / 2 + xR + xL / 3, this.specCrop - i * lineHeight, width / 2 - xL - xR / 3, this.specCrop - i * lineHeight);
            } //+ xL / 5 //- xR / 5
        }
    }

}