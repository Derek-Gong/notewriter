import { startGame, Settings, GameScene, GOEvent, MouseControl, KeyControl, GridView, GameObject, RectDraw, Movable } from './engine.js';
import { pointInRect } from './utils.js';

//Game Implementatioin
//

//

export function startNoteWriter() {
    startGame(new NoteWriter(new GameSettings));
}

class GameSettings extends Settings {
    constructor() {
        super();
        this.soundPath = undefined;
        this.noteNum = undefined;
        this.sixtenthNoteWidth = 10;

    }
}

class NoteWriter extends GameScene {
    constructor(settings) {
        super(settings);
        this.userNoteManager = new UserNoteManager(0, 0, this.width, this.height, this);
    }
}

class NoteGird extends GridView {
    constructor(x, y, width, height, scene, numX, numY) {
        super(x, y, width, height, scene, numX, numY);
        this.noteWidth = this.gridWidth * 0.8;
        this.noteHeight = this.gridHeight * 0.8;

        this.noteGridXY = {};
        this.bmp = 80;
    }
    createNote(x, y) {
        const gridXY = this.hitTest(x, y);//out of box
        if (!gridXY) return false;

        const [gridX, gridY] = gridXY;
        // console.log(gridXY);
        if (this.getGrid(gridX, gridY))//possessed by another note
            return false;

        // console.log(gridXY, gridX, gridY);
        const noteName = this.grid2Pitch(gridX, gridY);
        const [noteX, noteY] = this.getNoteXY(gridX, gridY);
        // console.log(noteX, noteY);

        const startTime = gridX * 60 / this.bmp * 1000;
        var note = new Note(noteX, noteY, this.noteWidth, this.noteHeight, this.scene, noteName, startTime);
        note.noteLen = Math.min(note.noteLen, this.gridNumX - gridX);
        note.width = note.width + (note.noteLen - 1) * this.gridWidth;
        // console.log(note);
        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('move', (e) => { return this.onNoteMove(e); });
        // console.log(note);
        // this.noteList[note.id] = note;
        this.addSon(note);
        this.setNote(gridX, gridY, note);

        note.play();

        return note;
    }
    getNoteXY(x, y) {
        if (!this.isGrid(x, y)) return false;

        const rect = super.getGridRect(x, y);
        const CenterX = rect.x + rect.width / 2, CenterY = rect.y + rect.height / 2;
        return [CenterX - this.noteWidth / 2, CenterY - this.noteHeight / 2];
    }
    setGrid(x, y, id) {
        if (!super.setGrid(x, y, id))
            return false;
        if (!(id in this.noteGridXY))
            this.noteGridXY[id] = [];
        this.noteGridXY[id].push([x, y]);

        return true;
    }
    setNote(x, y, note) {
        if (!this.isGrid(x, y)) return false;

        for (let i = 0; i < note.noteLen; i++)
            this.setGrid(x + i, y, note.id);
    }
    clearNote(note) {
        for (let [x, y] of this.noteGridXY[note.id])
            this.clearGrid(x, y);
        delete this.noteGridXY[note.id];
    }
    moveNote(x, y, note) {
        if (!this.isGrid(x, y)) return false;

        this.clearNote(note);
        this.setNote(x, y, note);
        note.pitch = this.grid2Pitch(x, y);
        note.startGame = x * 60 / this.bmp * 1000;
        [note.x, note.y] = this.getNoteXY(x, y);
        //noteLen to be fixed
    }
    grid2Pitch(x, y) {
        if (!this.isGrid(x, y))
            return false;
        return this.gridNumY - y - 1
    }
    onNoteRemove(e) {
        let note = e.msg;
        this.clearNote(note);
    }
    onNoteMove(e) {
        let note = e.msg;
        const gridXY = this.hitTest(note.x, note.y);

        if (!gridXY) {
            this.moveNoteBack(note);
        } else {
            const [gridX, gridY] = gridXY;
            let id = false;
            for (let i = 0; i < note.noteLen; i++)
                id = id || this.getGrid(gridX + i, gridY);
            if (id) this.moveNoteBack(note);
            else this.moveNote(gridX, gridY, note);
        }
        note.play();
    }
    moveNoteBack(go) {
        const [gridX, gridY] = this.noteGridXY[go.id][0];
        [go.x, go.y] = this.getNoteXY(gridX, gridY);
    }
}

class UserNoteManager extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.gridView = new NoteGird(this.x, this.y, this.width, this.height, scene, 20 * 4, 36);
        this.addSon(this.gridView);

        this.noteList = {}

    }

    play() {
        for (let note of Object.values(this.noteList))
            note.playInSequence();
    }

    handleKey() {
        if (this.keyControl.keydown) {
            //left arrow
            if (this.keyControl.downKey == 37) {
                this.x -= 2;
            }
            if (this.keyControl.downKey == 39) {
                this.x += 2;
            }
        }
        if (this.keyControl.keyup) {
            //Space key
            if (this.keyControl.upKey == 32) {
                this.play();
            }
        }

        this.keyControl.reset();
    }

    handleMouse() {
        if (this.mouseControl.clicked) {
            console.log(this.mouseControl.offsetX, this.mouseControl.offsetY);
            let note = this.gridView.createNote(this.mouseControl.offsetX, this.mouseControl.offsetY);
            if (note) {
                note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
                this.noteList[note.id] = note;
            }

            this.mouseControl.reset();
        }
    }

    onNoteCreate(e) {

    }
    onNoteRemove(e) {
        let go = e.msg;
        delete this.noteList[go.id];
    }

    fixedUpdate(dt) {
        super.fixedUpdate(dt);

        this.handleKey();
        this.handleMouse();
    }
}

class Note extends GameObject {
    constructor(x, y, width, height, scene, pitch, startTime) {
        super(x, y, width, height, scene);
        this.pitch = pitch;
        this.noteLen = 4;

        this.drawable = new RectDraw(this, 0, 0, this.width, this.height, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller, true)
        this.movable = new Movable(this);

        this.startTime = startTime;
        // this.noteLen = 1;//fourth note
        // console.log(this.noteName);
    }
    get pitch() {
        return this._pitch;
    }
    set pitch(p) {
        this._pitch = String(p).padStart(2, '0');
        let path = require('../assets/sound/' + this._pitch + '.mp3');
        this.audio = new Audio(path);
    }
    play() {
        this.audio.play();
    }
    playInSequence() {
        setTimeout(() => { this.audio.play(); }, this.startTime);
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        if (this.mouseControl.clicked) {
            this.mouseControl.reset();
            this.destroy()
        } else if (this.mouseControl.dragging) {
            this.x = this.mouseControl.offsetX - this.mouseControl.innerOffsetX;
            this.y = this.mouseControl.offsetY - this.mouseControl.innerOffsetY;
        } else if (this.mouseControl.releasing) {
            this.dispatchEvent(new GOEvent('move', this));
            this.mouseControl.reset();
        }
    }
}