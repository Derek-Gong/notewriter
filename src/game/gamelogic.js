import { startGame, Settings, GameScene, GOEvent, MouseControl, KeyControl, GridView, GameObject, RectDraw, RoundRectDraw, Movable } from './engine.js';
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
        this.bmp = 80;
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
        this.noteWidth = this.gridWidth;
        this.noteHeight = this.gridHeight * 0.8;
        this.fourthWidth = this.gridWidth * 4;// 4/4 time, a gird is a sixteenth note.

        this.noteGridXY = {};
        this.bmp = this.scene.settings.bmp;
    }
    createNote(x, y) {
        const gridXY = this.hitTest(x, y);//out of box
        if (!gridXY) return false;

        const [gridX, gridY] = gridXY;
        // console.log(gridXY);
        for (let i = 0; i < 4; i++)
            if (this.getGrid(gridX + i, gridY))//possessed by another note
                return false;

        // console.log(gridXY, gridX, gridY);
        const noteName = this.grid2Pitch(gridX, gridY);
        const [noteX, noteY] = this.getNoteXY(gridX, gridY);
        // console.log(noteX, noteY);

        const startGridX = gridX;
        var note = new Note(noteX, noteY, this.fourthWidth, this.noteHeight, this.scene, noteName, this.fourthWidth, startGridX, 4, this.bmp);

        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('move', (e) => { return this.onNoteMove(e); });
        note.addEventListener('resize', (e) => { return this.onNoteResize(e); });
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
        note.startGridX = x;
        [note.x, note.y] = this.getNoteXY(x, y);
        //noteLen to be fixed
    }
    moveNoteBack(go) {
        const [gridX, gridY] = this.noteGridXY[go.id][0];
        [go.x, go.y] = this.getNoteXY(gridX, gridY);
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
            if (id && id != note.id) this.moveNoteBack(note);
            else this.moveNote(gridX, gridY, note);
        }
        note.play();
    }
    onNoteResize(e) {
        let note = e.msg;

        const [gridX, gridY] = this.hitTest(note.x, note.y);
        this.moveNote(gridX, gridY, note);
    }
}

class UserNoteManager extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.noteGird = new NoteGird(this.x, this.y, this.width, this.height, scene, 20 * 4, 36);
        this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, 20, 36, 2);
        this.addSon(this.noteGird);
        this.addSon(this.fourthNoteGrid);

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
            let note = this.noteGird.createNote(this.mouseControl.offsetX, this.mouseControl.offsetY);
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
    constructor(x, y, width, height, scene, pitch, fourthWidth, startGridX, noteLen, bmp) {

        super(x, y, width, height, scene);
        this.pitch = pitch;
        this.fourthWidth = fourthWidth;
        this.startGridX = startGridX;
        this.noteLen = noteLen;//num of sixteenth note
        this.bmp = bmp;

        this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height, this.height / 2, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller, true)
        this.movable = new Movable(this);

        // this.noteLen = 1;//fourth note
        // console.log(this.noteName);
        this.dragEdge = false;
    }
    get pitch() {
        return this._pitch;
    }
    set pitch(p) {
        this._pitch = String(p).padStart(2, '0');
        let path = require('../assets/sound/' + this._pitch + '.mp3');
        this.audio = new Audio(path);
    }
    get startTime() {
        return this.startGridX / 4;
    }
    set startTime(t) {
        this.startGridX = Math.round(t * 4);
    }
    get noteLen() {
        return this._noteLen;
    }
    set noteLen(l) {
        this._noteLen = l;
        this.duration = this._noteLen / 4;
        this.width = this.duration * this.fourthWidth;
    }
    play() {
        this.audio.play();
        this.drawable.fill = 'red'
        setTimeout(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.drawable.fill = 'black'
        }, 60 * 1000 / this.bmp * this.duration);
    }
    playInSequence() {
        setTimeout(() => {
            this.play();
        }, 60 * 1000 / this.bmp * this.startTime);
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        if (this.mouseControl.clicked) {
            this.mouseControl.reset();
            this.destroy()
        } else if (this.mouseControl.dragging) {
            //drag right 80% edge
            if (this.mouseControl.dragInnerX / this.width > 0.8) {
                // if (!this.dragEdge) this.originWidth = this.width;
                this.dragEdge = true;
            }

            if (this.dragEdge) {
                this.originNoteLen = this.noteLen;
                const innerX = this.mouseControl.offsetX - this.x;
                this.noteLen = Math.floor(Math.max(0, Math.min(innerX, this.fourthWidth - 1)) / this.fourthWidth * 4) + 1;

            } else {
                this.x = this.mouseControl.offsetX - this.mouseControl.dragInnerX;
                this.y = this.mouseControl.offsetY - this.mouseControl.dragInnerY;
            }
        } else if (this.mouseControl.releasing) {
            if (this.dragEdge) {
                this.dragEdge = false;
                this.play();
            } else {
                this.dispatchEvent(new GOEvent('move', this));
            }
            this.mouseControl.reset();
        }
    }
}