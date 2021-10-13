// @ts-check

class Player extends EventTarget {
  static EVENT_PLAYBACK_READY = "playback_ready";
  static EVENT_PLAYBACK_STARTED = "playback_started";
  static EVENT_PLAYBACK_STOPPED = "playback_stopped";

  static EVENT_SEGMENT_STARTED = "segment_started";

  constructor(logDiv=null) {
    super();

    // Audio
    this.context;
    this.source;
    this.source_INTENSE; // TODO generalize layers
    this.gain_INTENSE; // TODO same
    this.stingerSource;
    this.currentLayers = [];

    // Sounds
    this.soundBank;

    // Sequencer
    this.currentSegment = null;
    this.nextQueuedSegmentName = null; // set this to override currentSegment's next
    this.queuedSegmentNode = null;
    
    this.isPlaying = false;
    this.lastSegmentStartTime = 0; // when last a segment was started
    this.currentSegmentEndTime = 0; // when the current segment naturally ends
    this.nextSegmentEndTime = 0; // when we want to jump out of current segment (may be earlier than above)
    this.queuedStingers = [];

    // Project
    this.project = null;
    this.projectFilename = "project.json"; // default
    this.segmentsFolder = "sounds/"; // default

    // read from project
    this.startSegment = ''; 
    this.defaultOutro = '';
    
    this.intensity = 1; // TODO make generic parameter
    this.parameters = {};
    // this.triggers = []; // needed?

    // DEBUG output
    this.logDiv = logDiv;
  }

  // setup AudioContext
  init()
  {
    this.log("Init...", true);
    try {
      // @ts-ignore
      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.MozAudioContext;
      this.context = new AudioContext();
      this.context.onstatechange = () => {
        this.log("Audio context state changed: " + this.context.state);
      } // DEBUG - TODO more?
    } catch(e) {
      alert('No audio support');
    }
    
    window.addEventListener('resume', _ => { if(this.context) this.context.resume(); })

    if(this.context.state != "running") {
      this.context.resume();
    }
  }

  // NOTE only loads host-relative files!
  loadProject(projectFilePath)
  {
    if(projectFilePath.indexOf(".json") == -1) {
      projectFilePath = projectFilePath.replace(new RegExp(/\/$/), "") + "/" + this.projectFilename; // strip redundant slash
    }

    this.log("Loading project "+projectFilePath+"...");
    
    var request = new XMLHttpRequest();
    request.onload = () => {
      // TODO return code / type checking?
      let projectJson = request.response;
      projectJson.info.basePath = projectFilePath.substring(0, projectFilePath.lastIndexOf('/'));
      this.initProject(projectJson);
    };

    request.onerror = this.onError;
    request.open('GET', projectFilePath, true); // NOTE: Only works via http from same origin - configure for file load!
    this.log("Opened request...");

    request.responseType = 'json';
    request.send();
    this.log("Sent request...");
  }

  /** private */
  initProject(project) {
    this.project = project;
    console.log("project:" + JSON.stringify(project)); // TEMP DEBUG
    
    this.startSegment = project.interface.startSegment;
    this.defaultOutro = project.interface.outro;
    
    this.loadSegments();
  
    this.parameters = {};
    for(let parameter of this.project.parameters) {
      this.parameters[parameter.name] = parseFloat(parameter.default);
    }
  }
  
  /** private */
  loadSegments()
  {
    if(!this.project) {
      this.log("ERROR: Need to set project first!");
      return;
    }

    this.log("Loading segments for project " + this.project.info.name + "...");

    // HACK detect ogg capability
    let audio = document.createElement('audio');
    let canPlayOgg = audio.canPlayType("audio/ogg");
    audio.remove();

    let fileType = "ogg";
    if(!canPlayOgg) {
      this.log("Can't play ogg, try mp3...");
      fileType = "mp3";
    }

    let files = [];
    for(let segment of this.project.segments) {
      if(!canPlayOgg) {
        segment.file = segment.file.replace(".ogg", ".mp3");
      }
      files.push({
        name: segment.name,
        file: segment.file
      });

      // TODO recursive for layers?
    }

    this.soundBank = new SoundBank(this.context, this.log); // TODO inject logging div logSB?
    this.soundBank.loadSounds(files, this.project.info.basePath + '/' + this.segmentsFolder + fileType + '/', (event) => { this.onSoundsLoaded(event) }, this.onError); // Load from sounds/ogg/ or sounds/mp3/
  }
  
  onError(e)
  {
    this.log("ERROR! " + e);
  }
  
  onSoundsLoaded(event)
  {
    //log("onSoundsLoaded: (triggered by "+trigger+")</br>");
    this.log("Sounds loaded.");
    this.dispatchEvent(new Event(Player.EVENT_PLAYBACK_READY));
  }


  // General Playback

  start()
  {
    this.playSegment(this.startSegment);
  }

  pause()
  {
    // TODO?
  }

  outroOrStop()
  {
    let outro = this.defaultOutro;
    if(this.currentSegment && this.currentSegment.outro) {
      outro = this.currentSegment.outro;
    } else if(this.currentSegment && this.currentSegment.type == "outro") {
      outro = null;
    }

    if(outro) {
      this.triggerOnNextBar(outro);
    } else {
      this.stop();
    }
  }

  stop()
  {
    this.log("Stop.");
    
    if(this.source) {
      this.source.onended = null;
      this.source.stop();
    }

    if(this.source_INTENSE)
    {
      this.source_INTENSE.stop();
    }
    
    // TODO clear array of layers - also intermittently, onended?
    for(let layer of this.currentLayers) {
      if(layer.source) layer.source.stop();
    }

    this.removeQueuedStingersAfter();
    
    this.isPlaying = false;
    this.dispatchEvent(new Event(Player.EVENT_PLAYBACK_STOPPED));
  }  

  // Event Triggers

  trigger(name)
  {
    let trigger = this.project.triggers.find(t => t.name === name);
    if(trigger) {
      this.log("trigger "+name);

      if(trigger.next) {
        let safetime = -1; // default: end of current segment or bar (if bars defined)
        if(trigger.urgency == "immediate") {
          safetime = 0;
        } // TODO else calculate specific minimum?
        this.triggerOnNextBar(trigger.next, safetime);
      }

      if(trigger.stinger) {
        let time = null; // defaults to end of segment
        if(trigger.urgency == "immediate") {
          time = 0;
        }
        this.playStinger(trigger.stinger, time, false);
      }
    }
  }

  // Parameters

  updateParameter(name, value) {
    if(this.parameters.hasOwnProperty(name)) {
      this.log("Updating parameter "+name+" to "+value);
      this.parameters[name] = parseFloat(value);

      for(let layer of this.getLayersForParameter(name)) {
        layer.gain.gain.setValueAtTime(Math.min(value, 1), this.context.currentTime);
      }
    }
  }

  // TODO reorganize this - cache complete playState object to access from anywhere?
  getPlayState()
  {
    let duration = (this.currentSegmentEndTime - this.lastSegmentStartTime);
    let progress = (this.context.currentTime - this.lastSegmentStartTime);
    let currentPercentage = progress / duration; // technically not percentage...

    let currentStinger = null;
    let stingerPercentage = null;
    if(this.queuedStingers.length > 0 && this.queuedStingers[0].startTime < this.context.currentTime) {
      currentStinger = this.getSegmentForName(this.queuedStingers[0].name);
      let endTime = this.nextSegmentEndTime;

      // TODO batch duration extraction for all loaded sounds at init?
      let soundElement = this.soundBank.getSound(currentStinger.name);
      if(soundElement) endTime = this.queuedStingers[0].startTime + soundElement.buffer.duration;

      let stingerDuration = (endTime - this.queuedStingers[0].startTime)
      stingerPercentage = (this.context.currentTime - this.queuedStingers[0].startTime)/stingerDuration;
    }
    
    // TODO bad perf if fetched each frame? Cache?
    let nextQueuedSegment = this.getSegmentForName(this.nextQueuedSegmentName);

    return {
      isPlaying: this.isPlaying,
      currentSegments: [this.currentSegment, currentStinger],
      percentages: [currentPercentage, stingerPercentage],
      nextQueuedSegment
    };
  }

  isTriggerActive(name)
  {
    // TODO differentiate more - via triggers_enabled (only these), triggers_disabled (all but these), defaults?
    if(this.currentSegment.triggers_enabled && this.currentSegment.triggers_enabled.indexOf(name) > -1) {
      return true;
    } else {
      return false;
    }
  }


  // Flow control - TODO private?

  playSegment(segmentName, offset)
  {
    if(!offset) offset = 0;
    
    this.currentLayers = [];

    // Find segment
    this.currentSegment = this.getSegmentForName(segmentName);
    if(!this.currentSegment) {
      this.log("ERROR: No segment found for name: " + segmentName + "");
      return;
    }

    // Find soundElements
    let soundElement = this.soundBank.getSound(this.currentSegment.name);
    let soundElement_INTENSE = null; // TODO generalize (soundElementsForLayers = [])
    
    // TEST layers - TODO generalize (find layers for parameters)
    if(this.currentSegment.layers) {
      let base = this.currentSegment.layers.find(layer => layer.name === "base");
      let intense = this.currentSegment.layers.find(layer => layer.name === "intense");
      if(base && intense) {
        this.log(intense.name + ": " + intense.segment);
        soundElement = this.soundBank.getSound(base.segment);
        soundElement_INTENSE = this.soundBank.getSound(intense.segment);
      }
    }

    if(!soundElement) {
      log("ERROR: No soundElement found for name: " + segmentName + "");
      return;
    }
    // TODO check layer elements here!
    
    // -----------
    
    this.log("Play " + this.currentSegment.name + " in " + offset + "...");
    
    // TODO extract function
    // TODO create new source each time? overlap? (pool)
    // TODO store logical duration so we can determine at which time position the next segment should be queued?
    this.source = this.context.createBufferSource();
    this.source.buffer = soundElement.buffer;
    this.log("Created buffer source node: "+this.source.buffer+"");
    
    // TODO handle pre-entry segments?
    this.source.onended = () => {
      this.playNextSegment();
    };
    
    this.source.connect(this.context.destination);
    this.source.start(offset); // TODO: able to unqueue it if not yet started? just call stop!
    
    // TODO generalize
    this.currentLayers.push({
      name: "base",
      parameter: null,
      soundElement: soundElement,
      source: this.source,
      gain: null
    });
    
    // LAYERS - TODO generalize
    if(soundElement_INTENSE) {
      this.source_INTENSE = this.context.createBufferSource();
      this.source_INTENSE.buffer = soundElement_INTENSE.buffer;
      
      if(!this.gain_INTENSE) {
        this.gain_INTENSE = this.context.createGain();
      }
      this.source_INTENSE.connect(this.gain_INTENSE);
      this.gain_INTENSE.connect(this.context.destination);
      this.gain_INTENSE.gain.setValueAtTime(this.intensity, this.context.currentTime);

      this.source_INTENSE.start(offset);

      this.currentLayers.push({
        name: "intense",
        parameter: "intensity",
        soundElement: soundElement_INTENSE,
        source: this.source_INTENSE,
        gain: this.gain_INTENSE
      });
    }
    
    // store flow state
    this.lastSegmentStartTime = this.context.currentTime + offset;
    this.currentSegmentEndTime = this.context.currentTime + offset + this.source.buffer.duration;
    this.nextSegmentEndTime =  this.currentSegmentEndTime; // can be overridden for early branch jump-out on trigger
    this.log("lastSegmentStartTime: " + this.lastSegmentStartTime);
    this.log("nextSegmentEndTime: " + this.nextSegmentEndTime);
    
    // Stinger for next?
    var nextSegment = this.getNextSegment(this.currentSegment);
    if(nextSegment && nextSegment.stinger) {
      this.playStinger(nextSegment.stinger, this.nextSegmentEndTime);
    }
    
    if(!this.isPlaying) {
      this.dispatchEvent(new Event(Player.EVENT_PLAYBACK_STARTED));
      this.isPlaying = true;
    }

    this.dispatchEvent(new Event(Player.EVENT_SEGMENT_STARTED));
  }

  // onended-handler, plays nextQueuedSegmentName immediately - TODO handle pre-entry?
  playNextSegment()
  {
    if(this.nextQueuedSegmentName) {
      // explicit override
      this.playSegment(this.nextQueuedSegmentName);
      this.nextQueuedSegmentName = null;
    } else if(this.currentSegment) {
      // default next from current
      var nextSegment = this.getNextSegment(this.currentSegment);
      if(nextSegment && nextSegment != '') {
        this.playSegment(nextSegment.name);
      } else {
        this.outroOrStop();
        // stop();
      }
    } else {
      this.outroOrStop();
      // stop();
    }
  }
  
  // NOTE if stinger startOffset is longer than time to next segment,
  //      it should only trigger one segment later... this is checked
  //      in triggerOnNextBar
  playStinger(segmentName, time=-1, removeQueued=true)
  {
    // remove previous queued ones
    if(removeQueued) this.removeQueuedStingersAfter(this.context.currentTime); // any that have not yet started
    
    let stingerSegment = this.getSegmentForName(segmentName);
    if(!stingerSegment) {
      log("ERROR: Stinger segment not found: " + segmentName);
      return;
    }
    let soundElement = this.soundBank.getSound(stingerSegment.name);
    if(!soundElement) {
      log("ERROR: No soundElement found for name: " + segmentName + "");
      return;
    }
    
    // --------
    
    this.stingerSource = this.context.createBufferSource();
    this.stingerSource.buffer = soundElement.buffer;
    this.log("Created stinger source: "+this.stingerSource.buffer);

    this.stingerSource.connect(this.context.destination);
    
    if(!this.nextSegmentEndTime) this.nextSegmentEndTime = 0; // start immediately
    this.log("nextSegmentEndTime:" + this.nextSegmentEndTime + ", stingerSegment.startOffset:" + stingerSegment.startOffset);
    
    let startTime = Math.max(0, (time != -1 ? time : this.nextSegmentEndTime) - stingerSegment.startOffset);
    this.log("stinger startTime: " + startTime);
    this.queuedStingers.push({ name: segmentName, source: this.stingerSource, startTime: startTime });
    this.stingerSource.start(startTime);
  }

  removeQueuedStingersAfter(time = 0)
  {
    for (let i=0; i < this.queuedStingers.length; i++) {
      let stinger = this.queuedStingers[i];
      if(stinger.source && stinger.startTime > time) {
        this.log("Stopping stinger " + stinger.name + " (" + (i + 1) + "/" + this.queuedStingers.length + ")");
        stinger.source.stop();
      }
    }
    this.queuedStingers = [];
  }
  
  // TODO generalize, like: triggerWithUrgency(segment, safetime, URGENCY_IMMEDIATE||URGENCY_BEAT||URGENCY_BAR||URGENCY_NONE)
  // set safeTime to -1 to detect from stinger or segment end, 0 to not have at all, >0 to force
  triggerOnNextBar(segmentName, safeTime=-1) {
    this.nextQueuedSegmentName = segmentName;
    let nextQueuedSegment = this.getSegmentForName(this.nextQueuedSegmentName);
    if(nextQueuedSegment) {
      this.log("nextQueuedSegment: "+nextQueuedSegment.name);

      if(safeTime == -1) {
        // default: next bar or end of segment
        safeTime = 0;

        if(nextQueuedSegment.stinger) {
          let stingerSegment = this.getSegmentForName(nextQueuedSegment.stinger);
          if(stingerSegment) {
            safeTime = stingerSegment.startOffset;
          }
        }
      }
      this.log("safeTime: " + safeTime);

      if(this.currentSegment.bars) {
        let nextBar = this.findNextBar(this.currentSegment, this.context.currentTime + safeTime);
        this.log("nextBar: "+JSON.stringify(nextBar));
        
        if(nextBar) {
          this.nextSegmentEndTime = this.lastSegmentStartTime + nextBar.offset;
          let timeToSwitch = this.nextSegmentEndTime - this.context.currentTime;
          this.log("switching in " + timeToSwitch + "...");
          
          this.source.stop(this.nextSegmentEndTime); // TODO triggers playNextSegment - change to manual if preentry needed!
          if(this.source_INTENSE) this.source_INTENSE.stop(this.nextSegmentEndTime); // TODO generalize layers
        }
      }
      
      if(nextQueuedSegment.stinger) {
        if(this.nextSegmentEndTime - this.context.currentTime > safeTime) {
          this.playStinger(nextQueuedSegment.stinger, this.nextSegmentEndTime);
        }
      }
    }
  }


  // Utility

  // TODO from cached current bar?
  findNextBar(segment, time)
  {
    if(segment != this.currentSegment) {
      this.log("ERROR: findCurrentBar only works for currentSegment!");
      return null;
    };

    if(segment.bars) {
      let nextBar = null;
      for(let i=0; i < segment.bars.length; i++) // assumes chrono order
      {
        let bar = segment.bars[i];

        this.log("time: " + time + " - checking bar: " + bar.number); 
        let barStart = this.lastSegmentStartTime + bar.offset;
        this.log("  (start: " + barStart + ")");
        if(time < barStart) {
          this.log("Found next bar!");
          nextBar = bar;
          return nextBar;
        }
      }
      return null;
    } else return null;
  }

  // TODO comp. ineffective - replace with simple next-links when not jumping around?
  findCurrentBar(segment, time)
  {
    if(segment != this.currentSegment) {
      this.log("ERROR: findCurrentBar only works for currentSegment!");
      return null;
    };

    if(segment.bars) {
      let currentBar = null;
      for(let i=0; i < segment.bars.length; i++)
      {
        let bar = segment.bars[i];

        //console.log("time: " + time + " - checking bar: " + bar.number); 
        let barStart = this.lastSegmentStartTime + bar.offset;
        let barDuration = this.getBarDuration(segment, bar);
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

  getBarDuration(segment, bar)
  {
    if(segment != this.currentSegment) {
      console.log("ERROR: findCurrentBar only works for currentSegment!");
      return 0;
    };
    
    let tempo = segment.tempo;
    let beats = this.parseBeats(segment.beat);
    if(bar.beat) beats = this.parseBeats(bar.beat);
    if(bar.tempo) tempo = bar.tempo;
    
    // TODO consider denominator
    return beats * (60/tempo);
  }

  parseBeats(timeSignature)
  {
    return timeSignature.substring(0, timeSignature.indexOf('/'));
  }
  parseBeatNotevalue(timeSignature)
  {
    return timeSignature.substring(timeSignature.indexOf('/') + 1);
  }

  getSegmentForName(segmentName)
  {
    let segment = this.project.segments.find(s => s.name === segmentName); // TODO create segmentsMap hash object if this takes too long
    return segment;
  }

  getNextSegment(currentSegment)
  {
    if(this.currentSegment && this.currentSegment["next"]) {
      return this.getSegmentForName(this.currentSegment["next"]);
    } else {
      return null;
    }
  }

  getOutro(currentSegment)
  {
    if(this.currentSegment && this.currentSegment["outro"]) {
      return this.getSegmentForName(this.currentSegment["outro"]);
    } else {
      return null;
    }
  }

  getLayersForParameter(parameter)
  {
    // let type="gain"; // default
    return this.currentLayers.filter(layer => layer.parameter == parameter);
  }

  // NOTE unused
  generateNameFromPath(path) {
    return path.replace(/^.*\//g, "").replace(/\.[^.]*$/g, "");
  }

  // DEBUG output

  log(text, clear)
  {
    if(this.logDiv) {
      if(clear) this.logDiv.innerHTML = '';
      this.logDiv.innerHTML += (text.replace(/ /g, '&nbsp;') + "<br/>");
    }

    // also:
    console.log("[player] " + text);
  }
}