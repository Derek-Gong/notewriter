import { startGame, Settings, GameScene, GameObject, GOEvent } from './engine/core.js';
import { MouseControl, KeyControl } from './engine/controller.js';
import { GridView, ScrollBar } from './engine/go.js';
import { RoundRectDraw } from './engine/draw.js';
import { pointInRect, Rect, PriorityQueue, SortedSet } from './engine/utils.js';
import { GOMask, MouseMask } from './engine/render.js';
import { Movable } from './engine/animate.js';
import { PianoSoundPool } from './engine/sound.js';
import { NoteManager } from './go.js';

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
        this.noteManager = new NoteManager(0, 0,
            this.settings.initialSixtenthNoteWidth * this.settings.noteNum * 4,
            this.height - 20,
            this);
        this.noteManagerScroller = new ScrollBar(0, this.noteManager.height, this.width, 20, this, this.noteManager, new Rect(0, 0, this.width, this.noteManager.height), 'x');
        // this.gridMask = new MouseMask(0, 0, 100, 100, this, this.NoteManager.noteGrid);
        // this.NoteManager.layer = 1;
        // this.genNoteManager = new GenNoteManager(0, 0, this.width, this.height, this);
        // this.genNoteManager.layer = 0;
    }
}

