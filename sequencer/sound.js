/*
// static stores/data
SoundBank:
// Stores audio clips under string ids
// (see ELF SoundManager)

  loadSound(src, name)
  getSound(name)

SoundElement:
// Stores an audioclip loaded from disk in a buffer
  constructor(src, [params...])
  
  -buffer
*/

class SoundElement {
    // context; // AudioContext
	// log; // function
	// name; // string
	// buffer; // byte array
	// loaded; // bool
	
	constructor(context, logFunction) {
		this.context = context;
		this.loaded = false;
		
		if(logFunction) {
			this.log = logFunction;
		} else {
			this.log = console.log;
		}
	}
	
	loadFile(path, name, onLoaded, onError)
	{
		if(!name) {
			name = path.replace(/.*\//g, '').replace(/\.[^.]*$/g, "");
		}

		var request = new XMLHttpRequest();
		request.onload = () => {
            // TODO also triggered when browser shows load error???
			this.log("  Loaded " + path + " as "+name+", decodeAudioData...");
			
			context.decodeAudioData(request.response, (buffer) => {
				if(buffer == null) {
					this.log("ERROR: buffer is null!");
					return;
				}
				
				this.name = name;
				this.buffer = buffer;
				this.loaded = true;
				
				if(onLoaded) onLoaded(this);
			}, onError);
		};
        
        request.onerror = onError;

		request.open('GET', path, true); // NOTE: Only works via http from same origin
		this.log("Opened request...");
		
		request.responseType = 'arraybuffer';
		request.send();
		this.log("Sent request...");
	}
}

class SoundBank {
    // context; // AudioContext
	// log; // function
	
	// soundElements; // array
	// _soundsLoading; // array
	
	constructor(context, logFunction) {
		this.context = context;

		if(logFunction) {
			this.log = logFunction;
		} else {
			this.log = console.log;
		}

		this.soundElements = {};
		this._soundsLoading = [];
	}
	
	loadSound(file, name, onLoaded, onError) {
		this.log("loadSound: "+file+" as "+name);
		
		var sound = new SoundElement(this.context, this.log);
		this._soundsLoading.push(sound);
		
		sound.loadFile(file, name, (sound) => { this._soundLoaded(sound, onLoaded); }, onError);
	}
	
	/**
	 * 
	 * @param {*} files Either an array of string paths, or of objects: { name:..., file:...}
	 * @param {*} onAllLoaded Callback
	 * @param {*} onError Callback
	 */
	loadSounds(files, folder, onAllLoaded, onError) {
		for(let file of files) {
			let path = folder + file;
			let name = null;

			if(typeof file === "object") {
				path = folder + file.file;
				name = file.name;
			}

			this.loadSound(path, name, (sound) => { this._soundLoaded(sound, onAllLoaded); }, onError)
		}
	}
	
	_soundLoaded(sound, onAllLoaded)
	{
		var index = this._soundsLoading.indexOf(sound)
		if(index != -1) {
			this._soundsLoading.splice(index, 1);
			this.soundElements[sound.name] = sound;
		}
		
		if(this.allLoaded() && onAllLoaded) {
			onAllLoaded();
		}
	}
	
	allLoaded()
	{
		return (this._soundsLoading.length == 0);
	}

	getSound(name)
	{
		return this.soundElements[name];
    }
}