// Violin against Aliens interactive music player (in progress)
// (c) 2021 Christian Afonso

// TODO: Split into specialist files:
// main (only for user interaction, page updates)
// -> player (load segments, start etc. functions - add functions to modify segments)
// -> (common graph/node base classes?)
//    -> live graph (show currently playing, next queued segments) [needed in edit view?]
//    -> edit graph (nodes are editable/connectable, add/remove/(save/load) functions)

// TODO move segments definition into project file to be loaded
var segmentsFolder = 'segments/';
var videoFolder = 'video/';
var segments = {
  intro_action_master: {
    name: 'intro_action_master',
    file: 'AWAC_intro_action_MASTERTRACK.ogg',
    layers: [
      { name: 'base', segment: 'intro_action_BASE' },
      { name: 'intense', segment: 'intro_action_INTENSE' }
    ],
    next: 'loop_action_master',
    outro: 'outro_master'
  },
  intro_action_BASE: {
    name: 'intro_action_BASE',
    file: 'AWAC_intro_action_BASE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  intro_action_INTENSE: {
    name: 'intro_action_INTENSE',
    file: 'AWAC_intro_action_INTENSE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  loop_action_master: {
    name: 'loop_action_master',
    file: 'AWAC_loop_action_MASTERTRACK.ogg',
    layers: [
      { name: 'base', segment: 'loop_action_BASE' },
      { name: 'intense', segment: 'loop_action_INTENSE' }
    ],
    next: 'loop_action_master',
    outro: 'outro_master',
    stinger: 'stinger_gliss_master',
    tempo: 138,
    beat: '4/4',
    bars: [
      { number: 1, offset: 0 },
      { number: 2, offset: 1.739 },
      { number: 3, offset: 3.478 },
      { number: 4, offset: 5.217 },
      { number: 5, offset: 6.956 },
      { number: 6, offset: 8.695 },
      { number: 7, offset: 10.434 },
      { number: 8, offset: 12.173 },
      { number: 9, offset: 13.913 },
      { number: 10, offset: 15.652 },
      { number: 11, offset: 17.391 },
      { number: 12, offset: 19.130, beat: '5/4' },
      { number: 13, offset: 21.304 },
      { number: 14, offset: 23.043 },
      { number: 15, offset: 24.782 },
      { number: 16, offset: 26.521 },
      { number: 17, offset: 28.260 },
      { number: 18, offset: 30 },
      { number: 19, offset: 31.739 },
      { number: 20, offset: 33.478 },
      { number: 21, offset: 35.217 },
      { number: 22, offset: 36.956 },
      { number: 23, offset: 38.695 },
      { number: 24, offset: 40.434, beat: '5/4' },
      { number: 25, offset: 42.608, beat: '3/4' },
      { number: 26, offset: 43.913, beat: '3/4' },
      { number: 27, offset: 45.217, beat: '3/4' },
      { number: 28, offset: 46.521, beat: '3/4' },
      { number: 29, offset: 47.826, beat: '3/4' },
      { number: 30, offset: 49.130, beat: '3/4' },
      { number: 31, offset: 50.434, beat: '4/4' },
      { number: 32, offset: 52.173, beat: '4/4' }
    ]
  },
  loop_action_BASE: {
    name: 'loop_action_BASE',
    file: 'AWAC_loop_action_BASE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  loop_action_INTENSE: {
    name: 'loop_action_INTENSE',
    file: 'AWAC_loop_action_INTENSE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },

  intro_dramatic_master: {
    name: 'intro_dramatic_master',
    file: 'AWAC_intro_dramatic_MASTERTRACK.ogg',
    layers: [
      { name: 'base', segment: 'intro_dramatic_BASE' },
      { name: 'intense', segment: 'intro_dramatic_INTENSE' }
    ],
    next: 'segment_dramatic_master',
    outro: 'outro_master',
    stinger: 'stinger_dramatic_master'
    // stinger: 'stinger_gliss_fast_master'
  },
  intro_dramatic_BASE: {
    name: 'intro_dramatic_BASE',
    file: 'AWAC_intro_dramatic_BASE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  intro_dramatic_INTENSE: {
    name: 'intro_dramatic_INTENSE',
    file: 'AWAC_intro_dramatic_INTENSE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  segment_dramatic_master: {
    name: 'segment_dramatic_master',
    file: 'AWAC_segment_dramatic_MASTERTRACK.ogg',
    layers: [
      { name: 'base', segment: 'segment_dramatic_BASE' },
      { name: 'intense', segment: 'segment_dramatic_INTENSE' }
    ],
    // stinger: 'stinger_dramatic_master',
    next: 'loop_action_master',
    outro: 'outro_master',
    tempo: 138,
    beat: '4/4',
    bars: [
      { number: 1, offset: 0 },
      { number: 2, offset: 1.739 },
      { number: 3, offset: 3.478 },
      { number: 4, offset: 5.217 },
      { number: 5, offset: 6.956 },
      { number: 6, offset: 8.695 },
      { number: 7, offset: 10.434 },
      { number: 8, offset: 12.173 },
      { number: 9, offset: 13.913 },
      { number: 10, offset: 15.652 },
      { number: 11, offset: 17.391 },
      { number: 12, offset: 19.130 },
      { number: 13, offset: 20.869 },
      { number: 14, offset: 22.608 },
      { number: 15, offset: 24.347 },
      { number: 16, offset: 26.086 }
    ]
  },
  segment_dramatic_BASE: {
    name: 'segment_dramatic_BASE',
    file: 'AWAC_segment_dramatic_BASE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  segment_dramatic_INTENSE: {
    name: 'segment_dramatic_INTENSE',
    file: 'AWAC_segment_dramatic_INTENSE.ogg',
    next: 'loop_action_master',
    outro: 'outro_master',
    type: 'layer'
  },
  
  outro_master: {
    name: 'outro_master',
    file: 'AWAC_outro_MASTERTRACK.ogg',
    next: '',
    outro: '',
    type: 'outro',
    stinger: 'stinger_outro_master'
  },

  // stingers
  stinger_gliss_master: {
    name: 'stinger_gliss_master',
    file: 'AWAC_stinger_gliss_MASTERTRACK.ogg',
    next: '',
    outro: '',
    type: 'stinger',
    startOffset: 0.869
  },
  stinger_gliss_fast_master: {
    name: 'stinger_gliss_fast_master',
    file: 'AWAC_stinger_gliss_fast_MASTERTRACK.ogg',
    next: '',
    outro: '',
    type: 'stinger',
    startOffset: 0.434
  },
  stinger_dramatic_master: {
    name: 'stinger_dramatic_master',
    file: 'AWAC_stinger_dramatic_MASTERTRACK.ogg',
    next: '',
    outro: '',
    type: 'stinger',
    startOffset: 0.869
  },
  stinger_outro_master: {
    name: 'stinger_outro_master',
    file: 'AWAC_stinger_outro_MASTERTRACK.ogg',
    next: '',
    outro: '',
    type: 'stinger',
    startOffset: 0.869
  }
};

// Settings
var edit = false;

// Page
var logDiv;
var filterDiv;
var graphDiv;

// Audio
var context;
var source;
var source_INTENSE;
var gain_INTENSE;
var stingerSource;

// Intensity Slider
var intensitySlider;

// Editor
var editCanvas;
var editCanvasContext;

// Synced video
var video;

// Sounds
var soundBank;

// Sequencer
var startSegment = 'intro_action_master';
var currentSegment = null;
var nextQueuedSegmentName = null; // set this to override currentSegment's next
var queuedSegmentNode = null;

var isPlaying = false;
var lastSegmentStartTime = 0; // when last a segment was started
var currentSegmentEndTime = 0; // when the current segment naturally ends
var nextSegmentEndTime = 0; // when we want to jump out of current segment (may be earlier than above)

var intensity = 1; // default

// debug logging: sound loading, queueing etc.
var loggingEnabled = false;

window.addEventListener('click', init, false); // audio can only start on interaction
window.addEventListener('touchstart', init, false); // audio can only start on interaction
window.addEventListener('resize', onResize);
window.addEventListener('resume', _ => { if(context) context.resume(); })

window.addEventListener('load', onLoad);

function onLoad()
{
  edit = (window.location.search.substr(1).indexOf("edit=true") != -1);
  if(edit) {
    console.log("Edit mode enabled!");
  }
}

// setup AudioContext
function init()
{
  window.removeEventListener('click', arguments.callee);
  window.removeEventListener('touchstart', arguments.callee);

  logDiv = document.getElementById("log");
  let logSBDiv = document.getElementById("logSB");
  if(loggingEnabled) logSBDiv.style.visibility = "visible";

  intensitySlider = document.getElementById("intensity");
  if(intensitySlider) {
    intensitySlider.oninput = function() {
      intensity = intensitySlider.value / 100; // percent to ratio
      if(gain_INTENSE) {
        gain_INTENSE.gain.setValueAtTime(Math.min(intensity, 1), context.currentTime); // safeguard against invalid values
      }
      // console.log("intensity: " + intensity); // DEBUG
    };
  }

  video = document.getElementById("video");

  // onResize();

  log("Init...", true);
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.MozAudioContext;
    context = new AudioContext();
    context.onstatechange = function() { console.log("Audio context state changed: " + context.state); }
  } catch(e) {
    alert('No audio support');
  }
  
  if(context.state != "running") {
    context.resume().then(_ => { loadSegments(); });
  } else {
    loadSegments();
  }
}

function onResize()
{
  // setCanvasSize('100%', '100%') // ?
}

function setCanvasSize(canvas, width, height)
{
  canvas.style.width = width;
  canvas.style.height = height;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function loadSegments()
{
  log("Loading segments...");

  // HACK detect ogg capability
  let audio = document.createElement('audio');
  let canPlayOgg = audio.canPlayType("audio/ogg");

  let files = [];
  Object.keys(segments).forEach((key) => {
    let file = segments[key].file;
    if(!canPlayOgg) {
      console.log("Can't play ogg, try mp3...");
      segments[key].file = "mp3/"+ file.replace(".ogg", ".mp3");
    }
    files.push({
      name: segments[key].name,
      file: segments[key].file
    });
  });

  soundBank = new SoundBank(context);  // logSB
  soundBank.loadSounds(files, segmentsFolder, onSoundsLoaded, onError);
}

function generateNameFromPath(path) {
  return path.replace(/^.*\//g, "").replace(/\.[^.]*$/g, "");
}

function onError(e)
{
  log("Error!");
  console.log(e);
}

function onSoundsLoaded(trigger)
{
  //log("onSoundsLoaded: (triggered by "+trigger+")</br>");
  log("Sounds loaded.");
  playbackReady();
}

function playbackReady()
{
  log("Playback ready!");
  
  // create buttons
  var buttons = document.getElementById("buttons");
  if(!buttons) {
    buttons = document.createElement("div");
    buttons.id = "buttons";
    logDiv.parentElement.insertBefore(buttons, logDiv.parentElement.children[0]);
  }
  
  if(buttons) {
    var playButton = document.createElement("button");
    playButton.id = "playButton";
    playButton.className = "button";
    playButton.innerHTML = "Start";
    playButton.onclick = start;
    
    var trigger_dramatic = document.createElement("button");
    trigger_dramatic.id = "trigger_dramatic";
    trigger_dramatic.innerHTML = "Trigger dramatic event";
    trigger_dramatic.onclick = () => { triggerOnNextBar("intro_dramatic_master"); };
    disableButton("trigger_dramatic", true);
    trigger_dramatic.disabled = true; // activate on play
    
    var stopButton = document.createElement("button");
    stopButton.id = "stopButton";
    stopButton.innerHTML = "Trigger Stop";
    stopButton.onclick = () => {
      disableButton("stopButton", true);
      disableButton("trigger_dramatic", true);
      if(currentSegment && currentSegment.outro) {
        triggerOnNextBar(currentSegment.outro);
      } else {
        stop();
      }
    };
    stopButton.disabled = true; // activate on play
    
    // TODO if this works, move it out into own page!
//					var sequencerButton = document.createElement("button");
//					sequencerButton.id = "sequencer";
//					sequencerButton.innerHTML = "Sequencer Test";
//					sequencerButton.onclick = () => {
//						startSequencer();
//					};
    
    buttons.appendChild(playButton);
    buttons.appendChild(trigger_dramatic);
    buttons.appendChild(stopButton);
//					buttons.appendChild(sequencerButton);
  }
  
  let sliderDiv = document.getElementById('sliderDiv');
  if(sliderDiv) sliderDiv.style.visibility = "visible";

  if(edit) {
    // TODO move into separate file?

    // div to show node graph
    graphDiv = document.createElement("div");
    graphDiv.id = "graphDiv";
    logDiv.parentElement.insertBefore(graphDiv, logDiv.parentElement.children[0]);

    editCanvas = document.createElement("canvas");
    editCanvas.id = "editCanvas";
    editCanvasContext = editCanvas.getContext("2d");

    editCanvas.onmousedown = editCanvas_OnMouseDown;
    editCanvas.onmousemove = editCanvas_OnMouseMove;
    editCanvas.onmouseup = editCanvas_OnMouseUp;
    
    graphDiv.appendChild(editCanvas);

    reloadEditCanvas();
    updateEditCanvas(null);
  }
}

function start()
{
  playSegment(startSegment);
  
  disableButton("playButton", true);
  disableButton("stopButton", false);
  
  // TEST live display
  // TODO convert to setTimeout? Always set timeout one beat before end of bar to queue next one?
  window.requestAnimationFrame(onAnimationFrame);
}
let lastBar = "";
function onAnimationFrame(timestamp)
{
  if(!currentSegment) {
    // TODO clear?
    return;
  }

  let duration = (currentSegmentEndTime - lastSegmentStartTime).toFixed(2);
  let progress = (context.currentTime - lastSegmentStartTime).toFixed(2);
  let percentage = progress / duration; // technically not percentage...

  let progressInfo = "";
  if(isPlaying) progressInfo = " (" + progress + " / " + duration + ")";
  let segmentInfo = "current Segment: " + currentSegment.name + progressInfo + "<br/>";
  
  if(isPlaying) logDiv.innerHTML = segmentInfo;

  // TEST draw visualization
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  
  // some defaults
  let margin = 10;
  let nodeWidth = 300;
  let nodeHeight = 50;
  let offset = 50;

  // size for centering
  if(currentSegment["next"] || nextQueuedSegmentName) {
    setCanvasSize(canvas, 2*nodeWidth + offset + 2*margin);
  } else {
    setCanvasSize(canvas, nodeWidth + 2*margin);
  }

  clearCanvas(ctx);
  if(isPlaying) {
    // current
    drawSegment(ctx, currentSegment, percentage, margin, margin, nodeWidth, nodeHeight);

    // next?
    if(currentSegment["next"]) {
      drawArrow(ctx, margin + nodeWidth, margin + 0.5*nodeHeight, margin + nodeWidth + offset, margin + 0.5*nodeHeight, nextQueuedSegmentName ? "#AAAAAA" : "#FFFFFF", nextQueuedSegmentName);
      drawSegment(ctx, getNextSegment(currentSegment), -1, margin + nodeWidth + offset, margin, nodeWidth, nodeHeight, true, true);
    }

    // queued trigger?
    if(nextQueuedSegmentName) {
      drawArrow(ctx, margin + nodeWidth, margin + 0.5*nodeHeight, margin + nodeWidth + offset - 2, margin + 1.6*nodeHeight, "#FFFFFF");
      drawSegment(ctx, getSegmentForName(nextQueuedSegmentName), -1, margin + nodeWidth + offset, margin + 1.1*nodeHeight, nodeWidth, nodeHeight, true, true, true);
    }
  }

  // Edit
  if(edit) {
    let currentStinger = null;
    let stingerPercentage = null;
    if(queuedStingers.length > 0 && queuedStingers[0].startTime < context.currentTime) {
      currentStinger = getSegmentForName(queuedStingers[0].name);
      let endTime = nextSegmentEndTime;

      // TODO batch duration extraction for all loaded sounds at init?
      let soundElement = soundBank.getSound(currentStinger.name);
      if(soundElement) endTime = queuedStingers[0].startTime + soundElement.buffer.duration;

      let stingerDuration = (endTime - queuedStingers[0].startTime)
      stingerPercentage = (context.currentTime - queuedStingers[0].startTime)/stingerDuration;
    }

    // TODO bad perf if fetched each frame?
    let nextQueuedSegment = getSegmentForName(nextQueuedSegmentName);

    updateEditCanvas(null, { isPlaying, currentSegments:[currentSegment, currentStinger], percentages: [percentage, stingerPercentage], nextQueuedSegment });
  }

  // queue next frame call
  if(isPlaying) window.requestAnimationFrame(onAnimationFrame);
}

function clearCanvas(ctx, clearColor="#003F00")
{
  ctx.fillStyle = clearColor;
  ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

// TODO make only as wide/high as name/contents require?
function drawSegment(ctx, segment, percentage, x, y, w, h, enabled, active, flashing)
{
  if(!segment) {
    console.log("ERROR: Can't draw undefined segment!");
    return;
  }

  // defaults
  if(!x) x = 0;
  if(!y) y = 0;
  if(!w) w = 400;
  if(!h) h = 50;

  // colors
  let color_bg = "#AAAAAA"
  let color_foreground = "#007F00"
  
  if(segment == currentSegment || active) { // active?
    color_bg = "#FFFFFF";
    color_foreground = "#009F00";
  }
  
  // background
  ctx.fillStyle = color_bg;
  ctx.strokeStyle = color_foreground;
  ctx.roundRect(x, y, w, h, 10, true);
  
  if(flashing) {
    let flashValue = 127*(Math.sin(context.currentTime * 5) + 1);
    flashValue = parseInt(flashValue.toFixed(0)).toString(16);
    while(flashValue.length < 2) flashValue = "0" + flashValue;
    let color_flashing = "#00FF00" + flashValue;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color_flashing;
    ctx.roundRect(x, y, w, h, 10, false);
  }

  // foreground
  ctx.strokeStyle = color_foreground;
  ctx.fillStyle = color_foreground;

  // TODO draw bars? (position cached)

  // cursor
  if(percentage != -1) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + percentage * w, y);
    ctx.lineTo(x + percentage * w, y + h);
    ctx.stroke();
  }
  
  // show name
  ctx.font = "12pt Orbitron";
  ctx.fillText(segment.name.replace("_master", ""), x + 10, y + (h * 0.4));
  
  /*
  // DEBUG quarters
  ctx.strokeStyle = "#777777";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 0.25 * w, 0); // HACK magic number
    ctx.lineTo(i * 0.25 * w, h); // HACK magic numbers
    ctx.stroke();
  }

  // DEBUG show percentage
  ctx.font = "20px Orbitron";
  ctx.fillText((percentage * 100).toFixed(0) + "%", 10, h * 0.8);
  */
}

function drawArrow(ctx, x1, y1, x2, y2, color, nohead, minDistForStraight=0, dodgeHeight=0)
{
  ctx.strokeStyle = color;
  ctx.fillStyle = color; // for head
  
  // line
  ctx.lineWidth = 2;
  if(x2-x1 > minDistForStraight) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    let middleX = x1 + (x2-x1)/2;
    ctx.bezierCurveTo(middleX, y1, middleX, y2, x2 - (nohead ? 0 : 10), y2);
    // ctx.lineTo(x2 - 10, y2);
    ctx.stroke();
  } else { // wrap around
    let dodgeDirection = y2 >= y1 ? 1 : -1;
    let c1 = { x: x1 + dodgeHeight/2, y: y1 };
    let c2 = { x: x1 + dodgeHeight/2, y: y1 + dodgeHeight*dodgeDirection };
    let aux1 = { x: x1, y: y1 + dodgeHeight*dodgeDirection };
    let aux2 = { x: x2, y: y1 + dodgeHeight*dodgeDirection };
    let c3 = { x: x2 - Math.abs(y2 - aux2.y)/2, y: y1 + dodgeHeight*dodgeDirection };
    let c4 = { x: x2 - Math.abs(y2 - aux2.y)/2, y: y2 };

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, aux1.x, aux1.y);
    ctx.lineTo(aux2.x, aux2.y);
    ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, x2 - (nohead ? 0 : 10), y2);
    ctx.stroke();
  }
  
  // head?
  if(!nohead) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10, y2 - 5);
    ctx.lineTo(x2 - 10, y2 + 5);
    ctx.lineTo(x2, y2);
    ctx.fill();
    ctx.stroke();
  }
}

function findNextBar(segment, time)
{
  if(segment != currentSegment) {
    console.log("ERROR: findCurrentBar only works for currentSegment!");
    return null;
  };

  if(segment.bars) {
    let nextBar = null;
    for(let i=0; i < segment.bars.length; i++) // assumes chrono order
    {
      let bar = segment.bars[i];

      console.log("time: " + time + " - checking bar: " + bar.number); 
      let barStart = lastSegmentStartTime + bar.offset;
      console.log("  (start: " + barStart + ")");
      if(time < barStart) {
        console.log("Found next bar!");
        nextBar = bar;
        return nextBar;
      }
    }
    return null;
  } else return null;
}

// TODO comp. ineffective - replace with simple next-links when not jumping around?
function findCurrentBar(segment, time)
{
  if(segment != currentSegment) {
    console.log("ERROR: findCurrentBar only works for currentSegment!");
    return null;
  };

  if(segment.bars) {
    let currentBar = null;
    for(let i=0; i < segment.bars.length; i++)
    {
      let bar = segment.bars[i];

      //console.log("time: " + time + " - checking bar: " + bar.number); 
      let barStart = lastSegmentStartTime + bar.offset;
      let barDuration = getBarDuration(segment, bar);
      let barEnd = barStart + barDuration;
      //console.log("  (start: " + barStart + ", end: " + barEnd + ")");
      if(time > barStart && time < barEnd) {
        //console.log("Found current bar!");
        currentBar = bar;
        return currentBar;
      }
    }
    return null;
  } else return null;
}

function getBarDuration(segment, bar)
{
  if(segment != currentSegment) {
    console.log("ERROR: findCurrentBar only works for currentSegment!");
    return 0;
  };
  
  let tempo = segment.tempo;
  let beats = parseBeats(segment.beat);
  if(bar.beat) beats = parseBeats(bar.beat);
  if(bar.tempo) tempo = bar.tempo;
  
  // TODO consider denominator
  return beats * (60/tempo);
}

function parseBeats(beat)
{
  return beat.substring(0, beat.indexOf('/'));
}

// set safeTime to -1 to detect from stinger or segment end, 0 to not have at all, >0 to force
function triggerOnNextBar(segment, safeTime=-1) {
  nextQueuedSegmentName = segment;
  let nextQueuedSegment = getSegmentForName(nextQueuedSegmentName);
  if(nextQueuedSegment) {
    console.log("nextQueuedSegment: "+nextQueuedSegment.name);

    if(safeTime == -1) {
      // default: next bar or end of segment
      safeTime = 0;

      if(nextQueuedSegment.stinger) {
        let stingerSegment = getSegmentForName(nextQueuedSegment.stinger);
        if(stingerSegment) {
          safeTime = stingerSegment.startOffset;
        }
      }
    }
    console.log("safeTime: " + safeTime);

    if(currentSegment.bars) {
      let nextBar = findNextBar(currentSegment, context.currentTime + safeTime);
      console.log("nextBar: "+JSON.stringify(nextBar));
      
      if(nextBar) {
        nextSegmentEndTime = lastSegmentStartTime + nextBar.offset;
        let timeToSwitch = nextSegmentEndTime - context.currentTime;
        console.log("switching in " + timeToSwitch + "...");
        
        source.stop(nextSegmentEndTime);
        if(source_INTENSE) source_INTENSE.stop(nextSegmentEndTime);
      }
    }
    
    if(nextQueuedSegment.stinger) {
      if(nextSegmentEndTime - context.currentTime > safeTime) {
        playStinger(getSegmentForName(nextQueuedSegmentName).stinger, nextSegmentEndTime);
      }
    }
  }
}

let queuedStingers = [];
function removeQueuedStingersAfter(time = 0)
{
  for (let i=0; i < queuedStingers.length; i++) {
    let stinger = queuedStingers[i];
    if(stinger.source && stinger.startTime > time) {
      console.log("Stopping stinger " + stinger.name + " (" + (i + 1) + "/" + queuedStingers.length + ")");
      stinger.source.stop();
    }
  }
  queuedStingers = [];
}

// NOTE if stinger startOffset is longer than time to next segment,
//      it should only trigger one segment later... this is checked
//      in triggerOnNextBar
function playStinger(segmentName, time)
{
  // remove previous queued ones
  removeQueuedStingersAfter(context.currentTime); // any that have not yet started

  let stingerSegment = getSegmentForName(segmentName);
  if(!stingerSegment) {
    log("ERROR: Stinger segment not found: " + segmentName);
    return;
  }
  let soundElement = soundBank.getSound(stingerSegment.name);
  if(!soundElement) {
    log("ERROR: No soundElement found for name: " + segmentName + "");
    return;
  }
  
  // --------
  
  stingerSource = context.createBufferSource();
  stingerSource.buffer = soundElement.buffer;
  logSB("Created stinger source:"+stingerSource.buffer);

  stingerSource.connect(context.destination);
  
  if(!nextSegmentEndTime) nextSegmentEndTime = 0;
  logSB("nextSegmentEndTime:" + nextSegmentEndTime + ", stingerSegment.startOffset:" + stingerSegment.startOffset);
  
  let startTime = (time ? time : nextSegmentEndTime) - stingerSegment.startOffset;
  stingerSource.start(startTime);
  queuedStingers.push({ name: segmentName, source: stingerSource, startTime: startTime });
}

function playSegment(segmentName, offset)
{
  currentSegment = getSegmentForName(segmentName);
  if(!currentSegment) {
    log("ERROR: No segment found for name: " + segmentName + "");
    return;
  }
  let soundElement = soundBank.getSound(currentSegment.name);
  let soundElement_INTENSE = null;
  // --------
  
  // TEST layers
  if(currentSegment.layers) {
    let base = currentSegment.layers.find(layer => layer.name === "base");
    let intense = currentSegment.layers.find(layer => layer.name === "intense");
    if(base && intense) {
      console.log(intense.name + ": " + intense.segment);
      soundElement = soundBank.getSound(base.segment);
      soundElement_INTENSE = soundBank.getSound(intense.segment);
    }
  }

  if(!soundElement) {
    log("ERROR: No soundElement found for name: " + segmentName + "");
    return;
  }
  
  // -----------
  
  if(!offset) offset = 0;
  
  logSB("Play " + currentSegment.name + " in " + offset + "...");
  
  // TODO create new source each time? overlap?
  // TODO store logical duration so we can determine at which time position the next segment should be queued?
  source = context.createBufferSource();
  source.buffer = soundElement.buffer;
  logSB("Created buffer source node:<br/>&nbsp;&nbsp;"+source.buffer+"");
  
  // TODO handle pre-entry segments?
  source.onended = function() {
    playNextSegment();
  };
  
  source.connect(context.destination);
  
  source.start(offset); // TODO: able to unqueue it if not yet started? just call stop!
  isPlaying = true;
  
  // LAYERS
  if(soundElement_INTENSE) {
    source_INTENSE = context.createBufferSource();
    source_INTENSE.buffer = soundElement_INTENSE.buffer;
    
    if(!gain_INTENSE) {
      gain_INTENSE = context.createGain();
    }
    source_INTENSE.connect(gain_INTENSE);
    gain_INTENSE.connect(context.destination);
    gain_INTENSE.gain.setValueAtTime(intensity, context.currentTime);

    source_INTENSE.start(offset);
  }

  // store
  lastSegmentStartTime = context.currentTime + offset;
  nextSegmentEndTime = currentSegmentEndTime = context.currentTime + offset + source.buffer.duration;
  console.log("lastSegmentStartTime: " + lastSegmentStartTime);
  console.log("nextSegmentEndTime: " + nextSegmentEndTime);
  
  showTime();
  
  // Stinger for next? HAS TO BE AFTER nextSegmentTime setting!
  var nextSegment = getNextSegment(currentSegment);
  if(nextSegment && nextSegment.stinger) {
    // TODO is not cancelled when triggering another stinger, why?
    playStinger(nextSegment.stinger, nextSegmentEndTime);
  }
  
  // Handle button states special cases
  if(["intro_dramatic_master", "segment_dramatic_master", "outro_master"].indexOf(currentSegment.name) > -1) {
    trigger_dramatic.disabled = true;
    //stopButton.disabled = true;
  } else {
    trigger_dramatic.disabled = false;
    //stopButton.disabled = false;
  }

  // WIP synced video
  if(video) {
    if(currentSegment.video) {
      video.src = videoFolder + currentSegment.video;
      video.load();
      video.play(); // TODO wait for load finish? preload in separate "buffer" tag and swap?
      video.style.visibility = 'visible';
    } else {
      video.pause();
      video.style.visibility = 'hidden';
    }
  }
}

function showTime()
{
  if(!isPlaying) return;
  
  logSB("currentTime: " + context.currentTime + "</br>");
  //setTimeout(showTime, 0)
}

function queueSegment(segmentName)
{
  if(currentSegmentNode) {
    queuedSegmentNode = getSegmentForName(segmentName);
    if(queuedSegmentNode) {
      playSegment(queuedSegmentNode.name, offset);
    }
  }
}

function clearQueue()
{
  if(queuedSegmentNode) {
    queuedSegmentNode.onended = null;
    queuedSegmentNode.stop();
  }
}

// onended-handler, plays nextQueuedSegmentName immediately
function playNextSegment()
{
  if(nextQueuedSegmentName) {
    playSegment(nextQueuedSegmentName);
    nextQueuedSegmentName = null;
  } else if(currentSegment) {
    var nextSegment = getNextSegment(currentSegment);
    if(nextSegment && nextSegment != '') {
      playSegment(nextSegment.name);
    } else {
      stop();
    }
  } else {
    stop();
  }
}

function playOutro()
{
    if(currentSegment) {
    var nextSegment = getOutro(currentSegment);
    if(nextSegment) {
      playSegment(nextSegment.name);
    } else {
      stop();
    }
  } else {
    stop();
  }
}

function stop()
{
  log("Stop.");
  
  if(source) {
    source.onended = null;
    source.stop();
  }
  
  if(video) video.pause();

  clearQueue();
  
  isPlaying = false;

  log("no segment playing", true);
  
  disableButton("playButton", false);
  disableButton("trigger_dramatic", true);
}

function disableButton(name, disabled)
{
  let button = document.getElementById(name);
  if(button) button.disabled = disabled;
}

function log(text, clear)
{
  if(!logDiv) return;

  if(clear) logDiv.innerHTML = '';
  logDiv.innerHTML += (text.replace(/ /g, '&nbsp;') + "<br/>");
}

function logSB(text, clear) {
  if(!loggingEnabled) return; // TEMP DEBUG, hangs up app
  if(clear) document.getElementById("logSB").innerHTML = "";
  document.getElementById("logSB").innerHTML += (text.replace(/ /g, '&nbsp;') + "<br/>");
}

// Flow control

function getSegmentForName(segmentName)
{
  if(segments[segmentName]) {
    return segments[segmentName];
  } else {
    return null;
  }
}

function getNextSegment(currentSegment)
{
  if(currentSegment["next"]) {
    return segments[currentSegment["next"]];
  } else {
    return null;
  }
}

function getOutro(currentSegment)
{
  if(currentSegment["outro"]) {
    return segments[currentSegment["outro"]];
  } else {
    return null;
  }
}

// // TEST SEQUENCER - uses same SoundBank as before
// function startSequencer()
// {
//   let sequencer = new Sequencer(context, log);
  
//   // first test track: all sounds in sequence
//   let track = sequencer.createTrack(0);
//   let position = 0;
//   Object.keys(soundBank.soundElements).forEach(name => {
//     let seqEl = track.addElement(soundBank.getSound(name), position);
//     log("Add sound "+name+" at position "+position);
//     position += seqEl.duration;
//   });

//   sequencer.play(0);
// }

// Util
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r, filled, left, right) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  
  let rl = left ? 0 : r;
  let rr = right ? 0 : r;

  this.beginPath();
  this.moveTo(x+rl, y);
  this.arcTo(x+w, y,   x+w, y+h, rr);
  this.arcTo(x+w, y+h, x,   y+h, rr);
  this.arcTo(x,   y+h, x,   y,   rl);
  this.arcTo(x,   y,   x+w, y,   rl);
  this.closePath();
  if(filled) this.fill();
  this.stroke();
  return this;
}

// EDITOR ----------------------------------------------------------------

// Editor display
var editNodeGraph = new NodeGraph('100%', 400);
editNodeGraph.nodeWidth = 200;

// maybe only needed specifically in load function? (other modifications done on live graph)
function reloadEditCanvas()
{
  editNodeGraph.clearNodes();
  
  for(let key in segments) {
    if(segments[key].type != 'layer') {
      editNodeGraph.addNode(segments[key]);
    }
  }
}

// TODO move canvas into nodegraph? or separate visualization graph class?
function updateEditCanvas(evt=null, playingState=null)
{
  setCanvasSize(editCanvas, '100%', 400);
  clearCanvas(editCanvasContext, editNodeGraph.backgroundColor);

  // HACK - just see if this works to separate the lines. More intelligent resolution solution needed later
  let lineLanes = {
    stinger: editNodeGraph.nodeHeight - 6,
    segment: editNodeGraph.nodeHeight - 6,
    outro: editNodeGraph.nodeHeight + 3
  }

  // draw nodes and connections
  for(let node of editNodeGraph.nodes) {
    // default state
    let percentage = -1;
    let active = isEditMouseOver(node.x, node.y, node.width ?? editNodeGraph.nodeWidth, node.height ?? editNodeGraph.nodeHeight);
    let flashing = false;

    // inject play state
    if(playingState && playingState.isPlaying) {
      let index = playingState.currentSegments.indexOf(node.segment);
      if(index > -1) {
        active = true;
        percentage = playingState.percentages[index];
      } else if(node.segment === playingState.nextQueuedSegment) {
        active = true;
        flashing = true;
      }
    }

    // segment node
    let nodeWidth = node.width ?? editNodeGraph.nodeWidth;
    let nodeHeight = node.height ?? editNodeGraph.nodeHeight;
    drawSegment(editCanvasContext, node.segment, percentage, node.x, node.y, nodeWidth, nodeHeight, true, active, flashing);
    
    // TODO Init on node create?
    // TODO lots of magic numbers
    if(!node.widgets) {
      node.widgets = [];
      node.widgets.push({ name: "delete", label: "x", bounds: { x: nodeWidth - 15, y: 3, width: 12, height: 12 } });
      if(node.segment.type != "stinger") {
        node.widgets.push({ name: "stinger", label: "s", bounds: { x: 1, y: 5, width: 12, height: 12, left: true } });
      }
      if(node.segment.type != "outro") {
        node.widgets.push({ name: "next", label: "n", bounds: { x: nodeWidth - 13, y: -6 + 0.5*nodeHeight, width: 12, height: 12, right: true } });
      }
      if(["stinger", "outro"].indexOf(node.segment.type) == -1) {
        node.widgets.push({ name: "outro", label: "o", bounds: { x: nodeWidth - 13, y: -15 + nodeHeight, width: 12, height: 12, right: true } });
      }
    }

    for(let widget of node.widgets) {
      let globalWidgetBounds = localBounds(widget, node);
      let mouseOverWidget = isEditMouseOverRect(globalWidgetBounds);
      let fontColor = mouseOverWidget ? "#ffffff" : "#cccccc";
      drawButton(editCanvasContext, globalWidgetBounds, widget.label, 10, fontColor);
    }

    // connections
    if(node.segment.stinger) {
      let stingerNode = editNodeGraph.getNodeByName(node.segment.stinger);
      if(stingerNode) {
        drawNodeConnection(editCanvasContext, stingerNode, node, "yellow", lineLanes.stinger);
        lineLanes.stinger += 3;
      }
    }
    
    if(node.segment.next) {
      let nextNode = editNodeGraph.getNodeByName(node.segment.next);
      if(nextNode) {
        drawNodeConnection(editCanvasContext, node, nextNode, "white", lineLanes.segment);
        lineLanes.segment += 3;
      }
    }
    
    if(node.segment.outro) {
      let outroNode = editNodeGraph.getNodeByName(node.segment.outro);
      if(outroNode) {
        drawNodeConnection(editCanvasContext, node, outroNode, "red", lineLanes.outro);
        lineLanes.outro += 3;
      }
    }
  }

  // draw current dragging interaction
  if(dragStartNode) {
    let startX = (dragStartNode.x + editNodeGraph.nodeWidth);
    let startY = dragStartNode.y + (0.5*(dragStartNode.height ?? editNodeGraph.nodeHeight)) + dragStartYOffset;
    let endX = editMousePos.x;
    let endY = editMousePos.y;
    
    editCanvasContext.globalAlpha = 0.5;
    drawArrow(editCanvasContext, startX, startY, endX, endY, dragArrowColor, false, 10, editNodeGraph.nodeHeight);
    editCanvasContext.globalAlpha = 1;
  }
}

function drawNodeConnection(ctx, node1, node2, color, dodgeDistance)
{
  let startX = (node1.x + editNodeGraph.nodeWidth);
  let startY = node1.y + (0.5*(node1.height ?? editNodeGraph.nodeHeight)) + (node2.segment.type == "outro" ? 15 : 0); // TODO centralize type offsets
  let endX = node2.x;
  let endY = node2.y + (0.5*(node2.height ?? editNodeGraph.nodeHeight)) + (node1.segment.type == "stinger" ? -15 : 0); // TODO same
  
  // TODO dodge nodes in the middle?
  drawArrow(ctx, startX, startY, endX, endY, color ?? "white", false, 10, dodgeDistance ?? editNodeGraph.nodeHeight);
}

function drawButton(ctx, bounds, text, fontSize, fontColor)
{
  let color_bg = "#99bb00";
  let color_foreground = "#bbff00";
  fontColor = fontColor ?? "#ffffff";
  fontSize = fontSize ?? 12;

  // background
  ctx.fillStyle = color_bg;
  ctx.strokeStyle = color_foreground;
  ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 5, true, bounds.left, bounds.right);
  
  // text
  ctx.strokeStyle = fontColor;
  ctx.fillStyle = fontColor;
  ctx.font = fontSize + "px Orbitron";
  ctx.fillText(text, bounds.x + fontSize/4, bounds.y + fontSize*0.9);
}


// Editor interaction

// track mouse
var editMousePos = { x: 0, y: 0 };
var editMouseMovedEnoughToNotBeClick = 5; // px
var editMouseMoveDistance = 0;

// during dragging to connect
var dragStartNode = null;
var dragStartYOffset = 0;
var dragArrowColor = "white";

// drag around
var dragMoveNode = null;
var dragMouseOffsetInNode = null;

function editCanvas_OnMouseDown(event)
{
  console.log("edit mouse down");

  editMouseMoveDistance = 0;

  let node = findNodeUnderMouse(editCanvasContext);
  if(node) {
    if(node.widgets) {
      for(let widget of node.widgets) {
        if(isEditMouseOverRect(localBounds(widget, node))) {
          if(widget.name == "next") {
            dragStartNode = node;
            dragStartYOffset = 0;
            dragArrowColor = (node.segment.type == "stinger" ? "yellow" : "white");
          } else if(widget.name == "outro") {
            dragStartNode = node;
            dragStartYOffset = 15
            dragArrowColor = "red";
          }
          // TODO handle other special drag from widgets? (offset start arrow)
          return;
        }
      }
    }
    // else:
    dragMoveNode = node;

    let editMousePos = getElementLocalMousePosFromEvent(event, editCanvas);
    dragMouseOffsetInNode = { x: editMousePos.x - node.x, y: editMousePos.y - node.y };
  }
}

function editCanvas_OnMouseMove(event)
{
  editMousePos = getElementLocalMousePosFromEvent(event, editCanvas);
  // console.log("edit mouse pos: "+JSON.stringify(editMousePos));
  
  // update dangling connection arrow
  if(dragStartNode) {
    editMouseMoveDistance += (Math.abs(event.movementX) + Math.abs(event.movementY));
    console.log("editMouseMoveDistance: " + editMouseMoveDistance);
  }

  // move node
  if(dragMoveNode) {
    dragMoveNode.x = editMousePos.x - dragMouseOffsetInNode.x;
    dragMoveNode.y = editMousePos.y - dragMouseOffsetInNode.y;
  }

  updateEditCanvas(event);
}

function editCanvas_OnMouseUp(event)
{
  console.log("edit mouse up");
  
  if(!dragMoveNode) {
    if(editMouseMoveDistance < editMouseMovedEnoughToNotBeClick) {
      handleClick(event);
    } else {
      handleDragEnd(event);
    }
  }
  
  dragStartNode = null;
  dragMoveNode = null;
}

function handleDragEnd(event)
{
  if(!dragStartNode || !dragStartNode.segment) {
    return; // deleted
  }
  
  // find target
  let targetNode = findNodeUnderMouse(editCanvasContext);
  if(targetNode) {
    console.log("targetNode: "+targetNode.segment.name)
    let changed = false;
    
    // connect - TODO simplify allow-connection matrix?
    if(dragStartNode.segment.type == "stinger") {
      if(targetNode.segment.type != "stinger") {
        targetNode.segment.stinger = dragStartNode.segment.name;
        changed = true;
      }
    } else if(targetNode.segment.type == "outro") {
      if(dragStartNode.segment.type != "outro") {
        dragStartNode.segment.outro = targetNode.segment.name;
        changed = true;
      }
    } else if(dragStartNode.segment.type != "outro" && targetNode.segment.type != "stinger") {
      dragStartNode.segment.next = targetNode.segment.name;
      changed = true;
    }

    // update
    updateEditCanvas();
  }
}

function handleClick(event)
{
  console.log("edit mouse click");

  let node = findNodeUnderMouse(editCanvasContext);
  if(node) {
    if(node.widgets) {
      for(let widget of node.widgets) {
        if(isEditMouseOverRect(localBounds(widget, node))) {
          handleNodeWidgetClick(node, widget.name);
          return;
        }
      }
    }
    // else:
    // TODO anything on node click? show details? (better on doubleclick?)
  }
}

function handleNodeWidgetClick(node, widgetName)
{
  console.log("handle node widget click: "+node.segment.name+"."+widgetName);

  switch(widgetName) {
    case "delete":
      console.log("Delete segment node "+node.segment.name+"!");
      deleteNode(node);
      break;
    case "stinger":
      console.log("Remove stinger link from "+node.segment.name+"!");
      removeLink(node, "stinger");
      break;
    case "next":
      console.log("Remove next link from "+node.segment.name+"!");
      removeLink(node, "next");
      break;
    case "outro":
      console.log("Remove outro link from "+node.segment.name+"!");
      removeLink(node, "outro");
      break;
    default:
      break;
  }
}

function deleteNode(node)
{
  editNodeGraph.removeNodeWithName(node.segment.name);
  delete segments[node.segment.name];

  // remove links in other nodes
  for(let other of editNodeGraph.nodes)
  {
    if(other.segment.next == node.segment.name) {
      other.segment.next = '';
    }
    if(other.segment.stinger == node.segment.name) {
      other.segment.stinger = '';
    }
    if(other.segment.outro == node.segment.name) {
      other.segment.outro = '';
    }
  }

  updateEditCanvas();
}

function removeLink(node, type)
{
  if(["next", "stinger", "outro"].indexOf(type) == -1) return; // invalid param

  node.segment[type] = '';

  updateEditCanvas();
}

// Editor interaction utility

function isEditMouseOver(x, y, w, h)
{
  if(editMousePos.x > x && editMousePos.x < x + w && editMousePos.y > y && editMousePos.y < y + h) {
    return true;
  } else {
    return false;
  }
}

function isEditMouseOverRect(rect)
{
  return isEditMouseOver(rect.x, rect.y, rect.width, rect.height);
}

function findNodeUnderMouse(ctx)
{
  for(let node of editNodeGraph.nodes) {
    if(isEditMouseOver(node.x, node.y, node.width ?? editNodeGraph.nodeWidth, node.height ?? editNodeGraph.nodeHeight)) {
      return node;
    }
  }

  return null;
}

function getElementLocalMousePosFromEvent(event, element)
{
  let rect = (element ?? event.target).getBoundingClientRect();
  return { x: event.clientX - rect.x, y: event.clientY - rect.y }
}

function localBounds(widget, relativeTo)
{
  return moveRectBy(widget.bounds, { x: relativeTo.x, y: relativeTo.y });
}

// Geometry utility

function addPoints(p1, p2)
{
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function moveRectBy(rect, vector)
{
  return {
    x: rect.x + vector.x,
    y: rect.y + vector.y,
    width: rect.width,
    height: rect.height,
    // additional values for widgets
    left: rect.left,
    right: rect.right
  };
}
