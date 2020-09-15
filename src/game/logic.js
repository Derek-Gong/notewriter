import { Settings, GameScene, GOEvent, GameObject } from './engine/core.js';
import { Rect } from './engine/utils.js';
import { ScrollBar, Slider } from './engine/go.js';
import { PianoSoundPool } from './engine/sound.js';
import { NoteManager, NoteSuggester } from './go/managers.js';
import { NoteGenerator } from './go/helpers.js';
import { TextDraw, RectDraw } from './engine/draw.js';
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

        this.text = new GameObject(310, this.height * 0.6, 20, 10, this);
        this.text.drawable = new TextDraw(this.text, 0, this.text.height, this.text.width, this.text.height, '', '12px serif');
        // console.log(this.text);

        this.slider = new Slider(0, this.height * 0.6, 300, 8, this, (pg) => { this.text.drawable.text = Math.round(100 * pg).toString(); }, false, 'x', 'grey', 'blue');
        // this.slider.layer = 100;

    }
}

