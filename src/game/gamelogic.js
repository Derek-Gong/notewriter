import { startGame, Settings, GameScene, GOEvent, MouseControl, KeyControl, GridView, GameObject, RectDraw, RoundRectDraw, Movable } from './engine.js';
import { pointInRect } from './utils.js';
import * as Model from './model.js';

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
        this.sixtenthNoteWidth = 40;
        this.bpm = 80;
        this.userNoteNum = 2000;
        this.pitchNum = 36;
    }
}

class NoteWriter extends GameScene {
    constructor(settings) {
        super(settings);
        this.userNoteManager = new UserNoteManager(0, 0, this.settings.sixtenthNoteWidth * this.settings.userNoteNum, this.height, this);
        // this.userNoteManager.layer = 1;
        // this.genNoteManager = new GenNoteManager(0, 0, this.width, this.height, this);
        // this.genNoteManager.layer = 0;
    }
}

class NoteGird extends GridView {
    constructor(x, y, width, height, scene, numX, numY) {
        super(x, y, width, height, scene, numX, numY);
        this.noteWidth = this.gridWidth;
        this.noteHeight = this.gridHeight * 0.8;
        this.fourthWidth = this.gridWidth * 4;// 4/4 time, a gird is a sixteenth note.

        this.noteGridXY = {};
        this.bpm = this.scene.settings.bpm;
    }
    createNote(x, y, noteLen = 4) {
        const gridXY = this.hitTest(x, y);//out of box
        if (!gridXY) return false;

        const [gridX, gridY] = gridXY;
        for (let i = 0; i < noteLen; i++)
            if (this.getGrid(gridX + i, gridY))//possessed by another note
                return false;

        const noteName = this.grid2Pitch(gridX, gridY);
        const [noteX, noteY] = this.getNoteXY(gridX, gridY);

        const startTime = gridX / 4;
        var note = new Note(noteX, noteY, this.fourthWidth * noteLen / 4, this.noteHeight, this.scene, noteName, this.fourthWidth, startTime, noteLen, this.bpm);

        this.addNote(gridX, gridY, note);

        return note;
    }
    placeNote(note) {
        const gridX = Math.round(note.startTime * 4), gridY = this.pitch2GridY(note.pitch);
        if (!this.isGrid(gridX, gridY)) return false;
        for (let i = 0; i < note.noteLen; i++)
            if (this.getGrid(gridX + i, gridY))//possessed by another note
                return false;
        const gridXY = this.getNoteXY(gridX, gridY);
        if (!gridXY) return false;

        let newNote = new Note(gridXY[0], gridXY[1], this.fourthWidth * note.noteLen / 4, this.noteHeight, this.scene, note.pitch, this.fourthWidth, note.startTime, note.noteLen, this.bpm);
        note.destroy();

        this.addNote(gridX, gridY, newNote);
        return newNote;
    }
    addNote(gridX, gridY, note) {

        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('move', (e) => { return this.onNoteMove(e); });
        note.addEventListener('resize', (e) => { return this.onNoteResize(e); });

        this.addSon(note);
        this.setNote(gridX, gridY, note);

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

        let flag = true;
        for (let i = 0; i < note.noteLen; i++)
            flag = flag && this.setGrid(x + i, y, note.id);
        return flag;
    }
    setNoteself(note) {
        const x = Math.round(note.startTime * 4), y = this.pitch2Grid(note.pitch);
        this.setNote(x, y, note);
    }
    clearNote(id) {
        for (let [x, y] of this.noteGridXY[id])
            this.clearGrid(x, y);
        delete this.noteGridXY[id];
    }
    clear() {
        for (let id of Object.keys(this.noteGridXY))
            this.clearNote(id);
    }
    moveNote(x, y, note) {
        if (!this.isGrid(x, y)) return false;

        this.clearNote(note.id);
        this.setNote(x, y, note);
        note.pitch = this.grid2Pitch(x, y);
        note.startTime = x / 4;
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
    pitch2GridY(p) {
        return this.gridNumY - p - 1;
    }
    onNoteRemove(e) {
        let note = e.msg;
        this.clearNote(note.id);
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

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.noteGrid = new NoteGird(this.x, this.y, this.width, this.height, scene, this.scene.settings.userNoteNum * 4, this.scene.settings.pitchNum);
        this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, this.scene.settings.userNoteNum, this.scene.settings.pitchNum, 2);
        this.noteGenerator = new NoteGenerator(0, 0, 0, 0, this.scene);
        this.addSon(this.noteGrid);
        this.addSon(this.fourthNoteGrid);
        this.addSon(this.noteGenerator);

        this.noteList = {}
        this.genList = {}
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
            let note;
            if ((note = this.createNote(this.mouseControl.offsetX, this.mouseControl.offsetY))) {
                this.dispatchEvent(new GOEvent('newNote', this.noteList));

                note.play();

                this.clearGenNotes();
                this.genNotes();
            }
            this.mouseControl.reset();
        }
    }
    clearGenNotes() {
        for (let note of Object.values(this.genList))
            note.destroy();
        this.genList = {};
    }
    genNotes() {
        let genList = this.noteGenerator.sample(this.noteList);
        for (let note of genList) {
            let newNote = this.noteGrid.placeNote(note)
            if (newNote) {
                newNote.drawable.fill = 'green';
                newNote.isGen = true;
                newNote.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
                newNote.addEventListener('select', (e) => { return this.onGenNoteSelect(e); });

                this.genList[newNote.id] = newNote;
            }
        }
    }
    createNote(x, y, noteLen = 4) {
        let note = this.noteGrid.createNote(x, y, noteLen);
        if (note) {
            note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
            note.addEventListener('change', (e) => { return this.onNoteChange(e); });
            this.noteList[note.id] = note;

            return note;
        }
        return false;
    }
    onGenNoteSelect(e) {
        let curNote = e.msg;
        let notes = Object.values(this.genList);
        notes.sort((a, b) => { return a.startTime - b.startTime; });
        for (let note of notes) {
            note.destroy();
            let n = this.createNote(note.x, note.y, note.noteLen);
            console.log(n);
            if (note.id == curNote.id)
                break;
        }
        this.clearGenNotes();
        this.genNotes();
    }
    onNoteChange(e) {
        this.clearGenNotes();
        this.genNotes();
    }
    onNoteRemove(e) {
        let go = e.msg;
        if (go.id in this.noteList) {
            delete this.noteList[go.id];

            this.clearGenNotes();
            this.genNotes();
        }
        else {
            delete this.genList[go.id];
        }
    }

    fixedUpdate(dt) {
        super.fixedUpdate(dt);

        this.handleKey();
        this.handleMouse();
    }
}

class NoteGenerator extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);
        this.noteGenerator = new Model.NoteGenerator()
        // this.scene.addEventListener('newNote', (e) => { return this.onNewNote(e); })
    }
    // onNewNote(e) {
    //     let noteList = e.msg;
    //     let seq = this.notes2Seq(noteList);
    //     seq = this.noteGenerator.sample(seq);

    //     this.noteGrid.clear();
    //     this.noteList = {};

    //     this.seq2Notes(seq);
    // }
    sample(noteList) {
        let notes;
        if (noteList instanceof Object)
            notes = Object.values(Object.assign({}, noteList));
        else notes = noteList;
        let seq = this.notes2Seq(notes);
        seq = this.noteGenerator.sample(seq);
        return this.seq2Notes(seq);
    }
    notes2Seq(notes) {
        notes.sort((a, b) => {
            return a.startTime - b.startTime;
        });
        let totalTime = 0;
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];
            notes[i] = new Model.Note(note.pitch, note.startTime, note.startTime + note.duration);
            totalTime = Math.max(totalTime, notes[i].endTime);
        }
        return new Model.NoteSequence(totalTime, this.bpm, notes);
    }
    seq2Notes(seq) {
        let notes = seq.notes;
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];
            notes[i] = new Note(0, 0, 0, 0, this.scene, note.pitch, 0, note.startTime, Math.round((note.endTime - note.startTime) * 4), 0);
        }
        return notes;
    }
    handleKey() {

    }
    handleMouse() {

    }
}

class Note extends GameObject {
    constructor(x, y, width, height, scene, pitch, fourthWidth, startTime, noteLen, bpm) {

        super(x, y, width, height, scene);
        this.pitch = pitch;
        this.fourthWidth = fourthWidth;
        this.startTime = startTime;
        this.noteLen = noteLen;//num of sixteenth note
        this.bpm = bpm;

        this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height, this.height / 2, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller, true)
        this.movable = new Movable(this);

        this.dragEdge = false;
        this.isGen = false;
    }
    get isGen() {
        return this._isGen;
    }
    set isGen(b) {
        this._isGen = b;
        // this.mouseControl.bubbling = !this._isGen;
    }
    get pitch() {
        return this._pitch;
    }
    set pitch(p) {
        if (p == this._pitch) return;

        this._pitch = String(p).padStart(2, '0');
        let path = require('../assets/sound/' + this._pitch + '.mp3');
        this.audio = new Audio(path);
    }
    get noteLen() {
        return this._noteLen;
    }
    set noteLen(l) {
        this._noteLen = l;
        this.width = this.duration * this.fourthWidth;
    }
    get duration() {
        return this._noteLen / 4;
    }
    play() {
        this.audio.play();
        let c = this.drawable.fill;
        this.drawable.fill = 'red'
        setTimeout(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.drawable.fill = c
        }, 60 * 1000 / this.bpm * this.duration);
    }
    playInSequence() {
        setTimeout(() => {
            this.play();
        }, 60 * 1000 / this.bpm * this.startTime);
    }
    handleMouse() {

        if (this.isGen) {
            if (this.mouseControl.clicked) {
                this.dispatchEvent(new GOEvent('select', this));
                this.mouseControl.reset();
            }
        }

        else {
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
                    this.dispatchEvent(new GOEvent('change', this));
                    this.play();
                } else {
                    this.dispatchEvent(new GOEvent('move', this));
                    this.dispatchEvent(new GOEvent('change', this));
                }
                this.mouseControl.reset();
            }
        }

    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);

        this.handleMouse();
    }
}