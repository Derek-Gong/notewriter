import { Settings, GameScene, GOEvent } from './engine/core.js';
import { Rect } from './engine/utils.js';
import { ScrollBar } from './engine/go.js';
import { PianoSoundPool } from './engine/sound.js';
import { NoteManager, NoteSuggester } from './go/managers.js';
import { NoteGenerator } from './go/helpers.js';
//Game Implementatioin
//

//


export class GameSettings extends Settings {
    constructor() {
        super();
        this.soundPath = undefined;
        this.noteNum = undefined;
        this.initialSixtenthNoteWidth = 10;
        this.bpm = 120;
        this.noteNum = 200;
        this.pitchNum = 36;
    }
}

export class NoteWriter extends GameScene {
    constructor(settings) {
        super(settings);

        this.noteGenerator = new NoteGenerator(this);

        this.noteManager = new NoteManager(0, 0,
            this.settings.initialSixtenthNoteWidth * this.settings.noteNum * 4,
            this.height - 20,
            this);
        this.suggester = new NoteSuggester(0, this.height * 0.6 + 20, this.width, this.height / 3, this, PianoSoundPool.getInstance(), 6, 16);

        this.noteManagerScroller = new ScrollBar(0, this.noteManager.height, this.width, 20, this, this.noteManager, new Rect(0, 0, this.width, this.noteManager.height), 'x');

        //data flow between GO by event
        this.noteManager.addEventListener('genNotes', e => this.noteGenerator.onGenNotes(e));
        this.noteGenerator.addEventListener('genSeqs', e => this.suggester.onGenSeqs(e));
        this.suggester.addEventListener('genSeq', e => this.noteManager.onGenSeq(e));

        // this.gridMask = new MouseMask(0, 0, 100, 100, this, this.NoteManager.noteGrid);
        // this.NoteManager.layer = 1;
        // this.genNoteManager = new GenNoteManager(0, 0, this.width, this.height, this);
        // this.genNoteManager.layer = 0;
    }
}

