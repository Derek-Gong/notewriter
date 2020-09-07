import * as mm from '@magenta/music';

export class PianoSoundPool {
    static instance;
    constructor() {
        // this.sounds = {};
        this.player = new mm.SoundFontPlayer("https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus");
        this.program = 0 // 0 for acoustic grand piano, https://en.wikipedia.org/wiki/General_MIDI#Program_change_events
        this.loadSamples(); //only load samples from pitch 48-83
        // for (let i = 0; i < 36; i++) {
        //     const filename = String(i).padStart(2, '0');
        //     const path = require('../assets/sound/' + filename + '.mp3');
        //     this.sounds[i + 48] = new Audio(path);
        // }
    }
    play(pitch, duration = 0) {
        //duration is in milliseconds
        let note = {
            pitch: pitch,
            velocity: 80,
            program: this.program,
            isDrum: false,
            startTime: 0,
            endTime: duration/1000.0
        };
        // this.player.playNote(0, note);
        this.player.playNoteDown(note); 
        if (duration > 0) 
            setTimeout(() => {
                this.player.playNoteUp(note); // sounds a bit clicky?
            }, duration);
    
    }
    static getInstance() {
        if (!PianoSoundPool.instance) {
            if (!PianoSoundPool.instance) {
                PianoSoundPool.instance = new PianoSoundPool();
                delete PianoSoundPool.instance.constructor;
            }
        }
        return PianoSoundPool.instance;
    }

    loadSamples(){
        //create dummy sequence for loadsamples
        let newNote;
        let dummySeq = {
            notes: []
        };
        for (let pitch=48; pitch<84; pitch++){
            newNote = {
                pitch: pitch,
                velocity: 80,
                program: this.program,
                isDrum: false,
                startTime: 0,
                endTime: 1.0
            };
            dummySeq.notes.push(newNote);
        }
        this.player.loadSamples(dummySeq).then(console.log('loaded samples'))
    }

}