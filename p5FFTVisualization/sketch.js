var fft;
var mic;
var button;

var w; //width of abnds
var bands; //number of bands
var ignored; //bands ignored
var micIsOn = false; //boolean for changing from visual/line
var finalSpectrum; //plotting the values
var gapFromTop; //screen adjustment for better visual
var maxVal; //max value for plot

function setup() {
  // put setup code here
  createCanvas(600 ,200); //this would usually be WindowWidth,height
  getAudioContext().suspend(); //mimicing the auto play policy
  // console.log(getAudioContext().state);
  bands = 64; //64 worked best, 128 is too many bands to plot plus we dont care for the information on pitch
  gapFromTop = 20; //In Pixels
  fft = new p5.FFT(0.9,bands); //smoothing the values to 0.8 thus getting a cleaner plot
  button = createButton("Start Mic"); //button
  button.mousePressed(micOn);
  ignored = 25; //ignoring first 25 out of bands
  w = Math.floor((width) / (2*(bands-ignored))); //calculating widths
  console.log("ignored = " + ignored);
  console.log("bandwidth = " + w);
}


function micOn() { // button toggle
  if(getAudioContext().state == 'running'){
    getAudioContext().suspend();
    micIsOn = false;
    mic.stop();
    button.html("Start Mic");
  }
  else {
    getAudioContext().resume();
    mic = new p5.AudioIn();
    fft.setInput(mic);
    micIsOn = true;
    mic.start();
    button.html("Stop Mic");
  }
}

function draw() {
  background(0)
  stroke(64,64,64);
  line(0,height/2,width,height/2)
  var spectrum = fft.analyze();
  var spectrumFinal = spectrum.slice(0,bands - ignored);
  // console.log(spectrumFinal);
  maxVal = max(spectrumFinal);
  minVal = min(spectrumFinal);
  // console.log("min = " + minVal + " max = " + maxVal);
  var st = 0;
  var newGap;
  if(micIsOn) {
    var micLevel = mic.getLevel();
    if(micLevel < 0.0005){
      spectrumFinal = spectrumFinal.map(function(x) { return Math.floor(random(10,15)); }); // mimicing when the mic is on but no audio
      maxVal = 255;
      newGap = 0;
    }
    noStroke();
    var mid = Math.floor(spectrumFinal.length/2);
    //color -  #D2EDD4 ---- prog - '#46B54D'
    for (let i = 0; i < spectrumFinal.length; i++){
      var amp = spectrumFinal[i];
      if(micLevel > 0.0005){
        amp += random(10,15);
        newGap = gapFromTop;
        if(i <= mid){  //dampening the first half of the pitches
          amp *= 0.75;
        }
        // }else if(i > mid && i < spectrumFinal.length - 5){
        //   // amp *= 1.5;
        //   amp *= 2;
        // }
        else if(i > spectrumFinal.length - 5) { //amplifying the middle part
          amp *= 2; 
        }
      }
      var x = map(i, 0, spectrumFinal.length - 1, gapFromTop, width/2) //mapping the x value for the rectangle
      var y = -height/2 + map(amp, 0, 255, height/2 - newGap, newGap); //mapping the bar height
      var gre = map(i,0,64 - ignored,150,255);
      var blu = map(i,0,64 - ignored,50,160);
      fill(255,gre,blu); // color gradient
      rect(x, height/2, w - 1, y); // left half rectangle
      rect((width - x), height/2, w - 1, y); //right half rectangle
    }
    // console.log(spectrum);
  }
}