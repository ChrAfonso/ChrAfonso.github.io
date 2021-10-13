// @ts-check

// Violin against Aliens interactive music player (in progress)
// (c) 2021 Christian Afonso

// TODO: Split into specialist files:
// main (only for user interaction, page updates)
// -> player (load segments, start etc. functions - add functions to modify segments)
// -> (common graph/node base classes?)
//    -> live graph (show currently playing, next queued segments) [needed in edit view?]
//    -> edit graph (nodes are editable/connectable, add/remove/(save/load) functions)

// TODO map triggers (here: dramatic, stop) to segments where they are active?

var defaultProject = "projects/violins-against-aliens";

// Settings
var edit = false;

// Page
var contentDiv;
var logDiv;
var filterDiv;
var graphDiv;

// Player
var player = null;

// Editor
var editor = null;

// TODO: (re)build array/elements on project (re)load
var parameterSliders = [];

// Synced video
var video;

// debug logging: sound loading, queueing etc.
var loggingEnabled = true;

window.addEventListener('load', onLoad);
function onLoad()
{
  edit = (window.location.search.substr(1).indexOf("edit=true") != -1);
  if(edit) {
    console.log("Edit mode enabled!");
  }
}

// audio can only start on interaction
window.onclick = () => { init(); }; 
window.ontouchstart = () => { init(); };

// setup AudioContext and screen elements
function init()
{
  window.onclick = null;
  window.ontouchstart = null;

  // init output elements
  contentDiv = document.getElementById("content");
  logDiv = document.getElementById("log");
  let logSBDiv = document.getElementById("logSB");
  // if(loggingEnabled) logSBDiv.style.visibility = "visible";

  // Menu elements - TODO later
  // let loadButton = document.getElementById("bt_loadproject");
  // if(loadButton) {
  //   loadButton.onchange = () => {
  //     // TODO allow file system read, 
  //     let path = loadButton.value;
  //     player.loadProject(path);
  //   }
  // }

  video = document.getElementById("video"); // TODO not used currently - needs preload + sync

  log("Init player...", true);
  player = new Player(); // (logSBDiv)
  player.init();

  player.addEventListener(Player.EVENT_PLAYBACK_READY, () => { playbackReady(); });
  player.addEventListener(Player.EVENT_PLAYBACK_STARTED, () => { onPlaybackStarted(); });
  player.addEventListener(Player.EVENT_SEGMENT_STARTED, () => { onSegmentStarted(); });
  player.addEventListener(Player.EVENT_PLAYBACK_STOPPED, () => { onStop(); });
  player.loadProject(defaultProject); // default - TODO via load button?
}

function playbackReady()
{
  log("Playback ready!", true);
  
  // TODO move this to generic class also? PlayerGui?

  // create buttons
  var buttons = document.getElementById("buttons");
  if(!buttons) {
    buttons = document.createElement("div");
    buttons.id = "buttons-general";
    buttons.className = "buttons";
    contentDiv.insertBefore(buttons, contentDiv.children[0]);
  }
  
  // general player buttons
  var playButton = document.createElement("button");
  playButton.id = "playButton";
  playButton.className = "button";
  playButton.innerHTML = "Start";
  playButton.onclick = () => { onPlayButtonClick(); };
  buttons.appendChild(playButton);
  
  var stopButton = document.createElement("button");
  stopButton.id = "stopButton";
  stopButton.className = "button";
  stopButton.innerHTML = "Stop";
  stopButton.onclick = () => { onStopButtonClick(); };
  buttons.appendChild(stopButton);
  
  // second row, project-specific buttons from triggers
  buttons = document.createElement("div");
  buttons.id = "buttons-triggers";
  buttons.className = "buttons";
  contentDiv.insertBefore(buttons, contentDiv.children[1]);
  
  for(let trigger of player.project.triggers) {
    let triggerButton = document.createElement("button");
    triggerButton.id = "trigger_" + trigger.name;
    triggerButton.innerHTML = trigger.description;
    triggerButton.onclick = () => {
      player.trigger(trigger.name);
      if(trigger.next) {
        for(let t of player.project.triggers) {
          disableButton("trigger_" + t.name, true); // TODO disable all triggers until next bar/segment?
        }
      } // else it's only a stinger
    }
    buttons.appendChild(triggerButton);
    disableButton(triggerButton.id, true);
  }
  
  // populate slider div from project parameters
  let sliderDiv = document.getElementById('sliderDiv');
  if(!sliderDiv) {
    sliderDiv = document.createElement("div");
    sliderDiv.id = "sliderDiv";
    contentDiv.insertBefore(sliderDiv, contentDiv.children[2]);
  }
  if(sliderDiv) sliderDiv.style.visibility = "visible";

  for(let parameter of player.project.parameters) {
    let parameterDiv = document.createElement("div");
    parameterDiv.id = "parameter_" + parameter.name;
    parameterDiv.className = "parameterDiv";
    sliderDiv.appendChild(parameterDiv);

    let parameterLabel = document.createElement("div");
    parameterLabel.id = parameter.name + "Label";
    parameterLabel.innerHTML = parameter.description + ":";
    parameterDiv.appendChild(parameterLabel);

    let sliderContainer = document.createElement("div");
    sliderContainer.className = "slidecontainer";
    parameterDiv.appendChild(sliderContainer);

    let parameterSlider = document.createElement("input");
    parameterSlider.type = "range";
    parameterSlider.className = "slider";
    parameterSlider.id = parameter.name;
    parameterSlider.min = parameter.min;
    parameterSlider.max = parameter.max;
    parameterSlider.value = parameter.default;
    sliderContainer.appendChild(parameterSlider);

    parameterSlider.oninput = function() {
      let newValue = parseFloat(parameterSlider.value) / parseFloat(parameterSlider.max); // percent to ratio
      if(player) {
        player.updateParameter(parameter.name, newValue);
      }
    };
    parameterSliders.push(parameterSlider); // not used yet
  }

  if(edit) {
    // div to show node graph
    graphDiv = document.createElement("div");
    graphDiv.id = "graphDiv";
    contentDiv.insertBefore(graphDiv, contentDiv.children[0]);

    let editCanvas = document.createElement("canvas");
    editCanvas.id = "editCanvas";
    graphDiv.appendChild(editCanvas);
    
    editor = new Editor(player, editCanvas);
  }
}

function onPlayButtonClick()
{
  player.start();
}

function onStopButtonClick()
{
  player.stop();
}

// TODO ==== read state from player, too much introspection
function onAnimationFrame(timestamp)
{
  let playState = player.getPlayState();
  // let percentage = playState.percentages[0];

  // TODO duplicated in player.getPlayState
  let duration = (player.currentSegmentEndTime - player.lastSegmentStartTime);
  let progress = (player.context.currentTime - player.lastSegmentStartTime);
  let percentage = progress / duration; // technically not percentage... Can also be read from playState

  let progressInfo = "";
  if(player.isPlaying) progressInfo = " (" + progress.toFixed(2) + " / " + duration.toFixed(2) + ")";
  let segmentInfo = "current Segment: " + player.currentSegment.name + progressInfo + "<br/>";
  
  if(player.isPlaying) logDiv.innerHTML = segmentInfo;

  // TEST draw visualization
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  
  // some defaults
  let margin = 10;
  let nodeWidth = 300;
  let nodeHeight = 50;
  let offset = 50;

  // size for centering
  if(player.currentSegment["next"] || player.nextQueuedSegmentName) {
    CanvasUtil.setCanvasSize(canvas, 2*nodeWidth + offset + 2*margin);
  } else {
    CanvasUtil.setCanvasSize(canvas, nodeWidth + 2*margin);
  }

  CanvasUtil.clearCanvas(ctx);
  if(player.isPlaying) {
    // current
    CanvasUtil.drawSegment(ctx, player.currentSegment, percentage, margin, margin, nodeWidth, nodeHeight);

    // next?
    if(player.currentSegment["next"]) {
      CanvasUtil.drawArrow(ctx, margin + nodeWidth, margin + 0.5*nodeHeight, margin + nodeWidth + offset, margin + 0.5*nodeHeight, player.nextQueuedSegmentName ? "#AAAAAA" : "#FFFFFF", player.nextQueuedSegmentName);
      CanvasUtil.drawSegment(ctx, player.getNextSegment(player.currentSegment), -1, margin + nodeWidth + offset, margin, nodeWidth, nodeHeight, true, true);
    }

    // queued trigger?
    if(player.nextQueuedSegmentName) {
      CanvasUtil.drawArrow(ctx, margin + nodeWidth, margin + 0.5*nodeHeight, margin + nodeWidth + offset - 2, margin + 1.6*nodeHeight, "#FFFFFF");
      CanvasUtil.drawSegment(ctx, player.getSegmentForName(player.nextQueuedSegmentName), -1, margin + nodeWidth + offset, margin + 1.1*nodeHeight, nodeWidth, nodeHeight, true, true, true);
    }
  }

  // Edit - TODO listen in Editor itself?
  if(edit) {
    editor.updatePlayState(playState);
  }

  // queue next frame call, if still playing
  if(player.isPlaying) window.requestAnimationFrame(onAnimationFrame);
}

function onPlaybackStarted()
{
  console.log("[main] onPlaybackStarted");

  disableButton("playButton", true);
  disableButton("stopButton", false);
  
  // TODO enable all triggers?
  disableButton("outroButton", false);
  
  window.requestAnimationFrame(onAnimationFrame);
}

function onSegmentStarted()
{
  this.log("Segment started");

  for(let trigger of player.project.triggers) {
    let triggerActive = player.isTriggerActive(trigger.name);
    disableButton("trigger_" + trigger.name, !triggerActive);
  }

  // WIP synced video
  if(video) {
    if(player.currentSegment.video) {
      video.src = videoFolder + player.currentSegment.video;
      video.load();
      video.play(); // TODO wait for load finish? preload in separate "buffer" tag and swap?
      video.style.visibility = 'visible';
    } else {
      video.pause();
      video.style.visibility = 'hidden';
    }
  }
}

function onStop()
{
  if(video) video.pause();

  log("no segment playing", true);
  
  disableButton("playButton", false);
  disableButton("stopButton", true);

  // disable all trigger buttons
  for(let trigger of player.project.triggers) {
    disableButton("trigger_" + trigger.name, true);
  }
}

// Util

function disableButton(name, disabled)
{
  let button = document.getElementById(name);
  if(button) button.disabled = disabled;
}

// DEBUG logging

function log(text, clear)
{
  if(!loggingEnabled) return;
  if(!logDiv) return;

  if(clear) logDiv.innerHTML = '';
  logDiv.innerHTML += (text.replace(/ /g, '&nbsp;') + "<br/>");

  // also:
  console.log("[main] " + text);
}
