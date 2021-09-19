/*
//// Live playback handling

// Who handles queued/playing Nodes?
// - track would be good at least, so removing/muting it can handle gain/node remove directly
// - maybe even element? muting/(re)moving one can immediately update individual node.
// - track/global events will just delegate down

// TODO: Pan nodes

Sequencer:
    // transport
    start(time=current)
    pause()
    stop()
    
    // element management
    clearAll()
    clearTrack(track)
    queuePlayback(element, time, track)
      // createBufferSource(element.buffer), connect(track mix), start(time)
      // without track: default (0)
    // without time: queue at end (after last element in track)

    -tracks[]

SequencerTrack:
    getElements()
    getElementsStartingInTimeRange(start,end)
    getElement(index)
    removeElement(index)
    
    -elements

SequencerElement:
    -SoundElement
    -timepos
    -params
*/

class Sequencer {
    constructor(context, logFunction)
    {
        this.context = context;

        if(logFunction) {
			this.log = logFunction;
		} else {
			this.log = console.log;
        }
        
        this.tracks = [];

        this.volume = 1;
        this.startTime = 0; // current start time set on play
        
        this.timebase = Sequencer.TIMEBASE_TIME;
        this.tempo = 120;
        this.timesig = '4/4';

        this.nodes = {};
        this.nodes.gainNode = this.context.createGain();
        this.nodes.gainNode.connect(this.context.destination);
    }

    // Track contents
    createTrack(index, name)
    {  
        let track = new SequencerTrack(context, this.log);
        if(name) track.name = name;

        if(index && this.tracks.length > index) {
            this.tracks.splice(index, 0, track);
        } else {
            this.tracks.push(track);
        }
        
        track.connectNodes(this.nodes.gainNode);

        return track;
    }

    addElementToTrack(trackIndex, soundElement, position, loopStart, loopEnd)
    {
        let track = this.tracks[trackIndex];
        track.addElement(soundElement, this.getTimeForPosition(position), loopStart, loopEnd);
    }

    getTrack(index)
    {
        if(index < this.tracks.length) {
            return this.tracks[index];
        } else {
            this.log("WARNING: Track "+index+" does not exists");
        }
    }

    clearTrack(index)
    {
        let track = this.tracks[index];
        track.clear();
    }

    removeTrack(index)
    {
        clearTrack(index);
        let track = this.tracks.splice(index, 1);
        track.disconnectNodes();
    }

    // Track state
    muteTrack(index, muted)
    {
        let track = this.tracks[index];
        track.mute(muted);
    }

    // Flow control: timer, callback?
    play(position)
    {
        this.startTime = this.context.currentTime;
        this.log("play (contextTime: "+this.startTime+")");

        this.tracks.forEach(track => {
            track.play(position, this.startTime);
        });
    }

    // TODO pause - stop with cached position?
    stop()
    {
        this.log("stop (context time: "+this.context.currentTime+")");

        this.tracks.forEach(track => {
            track.stop();
        });
    }

    // time conversion
    
    /**
     * Converts position in current arrangement format to time
     * @param {*} position in time (seconds) or bar.beat
     * @param {string} timebase optional element timebase
     */
    getTimeForPosition(position, timebase)
    {
        timebase = timebase || this.timebase
        switch(timebase) {
            case Sequencer.TIMEBASE_TIME:
                return position; // verbatim
                break;
            case Sequencer.TIMEBASE_BAR_BEAT:
                return this.getTimeForBarBeat(position);
                break;
            default:
                return -1;
        }
    }

    getTimeForBarBeat(barbeat)
    {
        // TODO: extend with time signature map
        
        let bar = barbeat.replace(/\..*$/g, "");
        let beat = barbeat.replace(/^.*\./g, "");
        
        let beatsPerBar = this.timesig.replace(/\/.$/g, "");
        let beatUnit = this.timesig.replace(/^.*\//g, ""); // for now, assume quarters

        return (beatsPerBar * (bar - 1) + (beat - 1)) * (60 / this.tempo);
    }

    getBarBeatForTime()
    {
        // TODO
    }

    getElementsAtTime(time) {
        let elements = []
        this.tracks.forEach(track => {
	    elements = elements.concat(track.getElementsAtTime(time));
	});

        return elements;
    }
}

// TODO HACK
// CONSTANTS
Sequencer.TIMEBASE_TIME = 'time';
Sequencer.TIMEBASE_BAR_BEAT = 'bar.beat';

class SequencerTrack {
    constructor(context, logFunction)
    {
        this.context = context;

        if(logFunction) {
			this.log = logFunction;
		} else {
			this.log = console.log;
        }
        
        this.name = "<unnamed>";

        this.elements = [];
        this.volume = 1;
        this.muted = false;
        this.soloed = false;

        this.nodes = {};
        this.nodes.gainNode = this.context.createGain();
    }

    connectNodes(masterGainNode)
    {
        this.nodes.gainNode.connect(masterGainNode);
        return this;
    }
	
	setName(name)
	{
		this.name = name;
	}

    addElement(soundElement, position, loopStart, loopEnd)
    {
        let element = new SequencerElement(this.context, this.log);
        element.loadSound(soundElement, position, loopStart, loopEnd);
        this.elements.push(element);

        this.log("Added "+soundElement.name+" at time "+position);
        return element;
    }

    removeElement(sequencerElement)
    {
        this.log("removeElement: TODO");
    }

    getElementsAtTime(time)
    {
        let elements = [];
        this.elements.forEach(element => {
            if(element.position < time && time < (element.position + element.duration)) elements.push(element);
	});
        return elements;
    }

    clear()
    {
        while(this.elements.length > 0) {
            let element = this.elements.pop();
            element.stop();
        }
    }

    play(position, startTimeOffset)
    {
        this.elements.forEach(element => {
            if(element.position >= position || element.position + element.duration > position) {
                element.play(position, this.nodes.gainNode, startTimeOffset);
            }
        });
    }

    stop()
    {
        this.elements.forEach(element => {
            element.stop();
        });
    }

    mute(muted)
    {
        this.muted = muted;
        if(this.nodes.gainNode) {
            this.nodes.gainNode.gain.value = muted ? 0 : this.volume;
            //this.nodes.gainNode.gain.setValueAtTime(muted ? 0 : this.volume, this.context.currentTime);
        }
		console.log("track " +this.name+" gain: "+this.nodes.gainNode.gain.value);
    }

    disconnectNodes()
    {
        // TODO when pan, disconnect that here
        this.nodes.gainNode.disconnect();
        this.nodes.gainNode = null;
    }
}

class SequencerElement {
    constructor(context, logFunction)
    {
        this.context = context;

        if(logFunction) {
			this.log = logFunction;
		} else {
			this.log = console.log;
        }
        
        this.position = 0;
        this.duration = 0;
        this.loopStart = 0;
        this.loopEnd = -1;
		
		this.volume = 1;

        this.nodes = {};
    }

    loadSound(soundElement, position, loopStart, loopEnd)
    {
        this.soundElement = soundElement;
        this.duration = soundElement.buffer.duration;

        if(position) this.position = position;
        if(loopStart) this.loopStart = loopStart;
        if(loopEnd) this.loopEnd = loopEnd;

        return this;
    }

    getDuration()
    {
        if(!loopEnd) {
            return this.duration - this.loopStart;
        } else {
            return this.loopEnd - this.loopStart;
        }
    }

    play(position, trackNode, startTimeOffset)
    {
        if(!this.soundElement) {
            this.log("WARNING: Can't play, no soundElement loaded.");
            return;
        }
        
        stop();

        if(!this.nodes.gainNode) this.nodes.gainNode = this.context.createGain();
        this.nodes.gainNode.gain.value = this.muted ? 0 : this.volume;

        if(!this.nodes.sourceNode) this.nodes.sourceNode = this.context.createBufferSource();
        this.nodes.sourceNode.buffer = this.soundElement.buffer;
        
        this.nodes.sourceNode.connect(this.nodes.gainNode);
        this.nodes.gainNode.connect(trackNode);

        this.nodes.sourceNode.start(startTimeOffset + this.position, (position > this.position ? position - this.position : 0)); // TODO loopStart/End work natively, of have to be added?
    }

    stop()
    {
        if(this.nodes.sourceNode) {
            this.nodes.sourceNode.stop();
            this.nodes.sourceNode.disconnect();
            this.nodes.sourceNode = null;
        }
    }

    mute(muted)
    {
        this.muted = muted;
        if(this.nodes.gainNode) {
            this.nodes.gainNode.gain.value = muted ? 0 : this.volume;
        }
    }
}
