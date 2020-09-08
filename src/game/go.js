import { startGame, Settings, GameScene, GameObject, GOEvent } from './engine/core.js';
import { MouseControl, KeyControl } from './engine/controller.js';
import { GridView, ScrollBar } from './engine/go.js';
import { RoundRectDraw } from './engine/draw.js';
import { pointInRect, Rect, PriorityQueue, SortedSet } from './engine/utils.js';
import * as Model from './model.js';
import { GOMask, MouseMask } from './engine/render.js';
import { Movable } from './engine/animate.js';
import { PianoSoundPool } from './engine/sound.js';

export class NoteGird extends GridView {
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

        // let newNote = new Note(, gridXY[1], this.fourthWidth * note.noteLen / 4, this.noteHeight, this.scene, note.pitch, this.fourthWidth, note.startTime, note.noteLen, this.bpm);
        note.x = gridXY[0];
        note.y = gridXY[1];
        note.width = this.fourthWidth * note.noteLen / 4;
        note.height = this.noteHeight
        note.fourthWidth = this.fourthWidth;
        note.bpm = this.bpm;
        // note.destroy();

        this.addNote(gridX, gridY, note);
        return note;
    }
    addNote(gridX, gridY, note) {

        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('release', (e) => { return this.onNoteMove(e); });
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
        return this.gridNumY - y - 1 + 48;
    }
    pitch2GridY(p) {
        return this.gridNumY - p - 1 + 48;
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

export class NoteManager extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);
        this.movable = new Movable(this);

        this.noteGrid = new NoteGird(this.x, this.y, this.width, this.height, scene, this.scene.settings.noteNum * 4, this.scene.settings.pitchNum);
        this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, this.scene.settings.noteNum, this.scene.settings.pitchNum, 2);
        this.addSon(this.noteGrid);
        this.addSon(this.fourthNoteGrid);

        this.noteGenerator = new NoteGenerator(this.scene);
        this.soundPool = PianoSoundPool.getInstance();
        this.scene.addEventListener('noteCreate', (e) => { return this.onNoteCreate(e); });
        this.noteList = {}
        this.genList = {}
        this.lastNote = undefined;
    }

    play() {
        for (let note of Object.values(this.noteList))
            note.playInSequence();
    }

    handleKey() {
        if (this.keyControl.keydown) {
            //left arrow
            if (this.keyControl.downKey == 37) {
                this.x -= 5;
            }
            if (this.keyControl.downKey == 39) {
                this.x += 5;
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

                this.move2LastNote();
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
        this.noteGenerator.sample(this.noteList).then(genList => {
            for (let note of genList) {
                if (this.noteGrid.placeNote(note)) {
                    note.drawable.fill = 'green';
                    note.isGen = true;
                    note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
                    note.addEventListener('genSelect', (e) => { return this.onGenNoteSelect(e); });
                    note.addEventListener('genPlay', (e) => { return this.onGenNotePlay(e); });

                    this.genList[note.id] = note;
                } else note.destroy();
            }
        });
    }
    move2LastNote() {
        const ln = this.getLastNote();
        if (ln && ln != this.lastNote) this.onLastNoteChange(new GOEvent('lastNoteChange', ln));
        this.lastNote = ln;
    }
    getLastNote() {
        let notes = Object.values(this.noteList);
        let note = notes[0];
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].x + notes[i].width > note.x + note.width)
                note = notes[i];
        }
        return note;
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
        if (notes.length < 1) return;
        notes.sort((a, b) => { return a.startTime - b.startTime; });

        // let offset = notes[0].startTime;

        for (let note of notes) {
            note.destroy();
            let userNote = this.createNote(note.x, note.y, note.noteLen);
            // userNote.playInSequence(offset);

            if (note.id == curNote.id)
                break;
        }
        this.clearGenNotes();
        this.genNotes();

        this.move2LastNote();
    }
    onGenNotePlay(e) {
        let curNote = e.msg;

        let notes = Object.values(this.genList);
        notes.sort((a, b) => { return a.startTime - b.startTime; });
        console.log(notes);
        let offset = notes[0].startTime;
        for (let note of notes) {
            note.playInSequence(offset);

            if (note.id == curNote.id)
                break;
        }
    }
    onNoteCreate(e) {
        e.msg.soundPool = this.soundPool;
    }
    onNoteChange(e) {
        this.clearGenNotes();
        this.genNotes();
    }
    onNoteRemove(e) {
        let note = e.msg;
        if (note.id in this.noteList) {
            delete this.noteList[note.id];

            this.move2LastNote();

            this.clearGenNotes();
            this.genNotes();
        }
        else {
            delete this.genList[note.id];
        }
    }
    onLastNoteChange(e) {
        const note = e.msg;
        let dx = this.scene.width / 2 - (note.x + note.width);
        // if (0 >= this.x + dx && this.x + dx + this.width >= this.scene.width)
        dx = Math.max(Math.min(dx, -this.x), this.scene.width - this.width - this.x);
        this.movable.move(dx, 0, 500);
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);

        this.handleKey();
        this.handleMouse();
    }
}

class NoteGenerator {
    constructor(scene) {
        this.scene = scene;
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
        return this.noteGenerator.sample(seq, seq.totalTime + 16).then(seqGen => {
            return this.seq2Notes(seqGen);
        });
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

export class Note extends GameObject {
    constructor(x, y, width, height, scene, pitch, fourthWidth, startTime, noteLen, bpm, soundPool) {
        super(x, y, width, height, scene);
        this.layer = 100;
        this.pitch = pitch;
        this.fourthWidth = fourthWidth;
        this.startTime = startTime;
        this.noteLen = noteLen;//num of sixteenth note
        this.bpm = bpm;
        this.soundPool = soundPool;
        // console.log(this.width, this.height);
        this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height, this.height / 2, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller, true)

        this.dragEdge = false;
        this.isGen = false;
        this.addEventListener('resize', (e) => { return this.onResize(e); });

        this.dispatchEvent(new GOEvent('noteCreate', this));
    }
    onResize(e) {
        this.drawable.height = this.height;
        this.drawable.radius = this.height / 2;
    }
    get isGen() {
        return this._isGen;
    }
    set isGen(b) {
        this._isGen = b;
        // this.mouseControl.bubbling = !this._isGen;
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
    async play() {
        let c = this.drawable.fill;
        this.drawable.fill = 'red'
        this.soundPool.play(this.pitch, 60 * 1000 / this.bpm * this.duration);
        setTimeout(() => {
            this.drawable.fill = c;
        }, 60 * 1000 / this.bpm * this.duration);
    }
    playInSequence(offset = 0) {
        setTimeout(() => {
            this.play();
        }, 60 * 1000 / this.bpm * (this.startTime - offset));
    }
    handleMouse() {

        if (this.isGen) {
            if (this.mouseControl.clicked) {
                this.dispatchEvent(new GOEvent('genSelect', this));
                this.mouseControl.reset();
            } else if (this.mouseControl.rightClicked) {
                this.dispatchEvent(new GOEvent('genPlay', this));
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
                    this.noteLen = Math.floor(Math.max(0, Math.min(innerX, this.fourthWidth * 4 - 1)) / this.fourthWidth * 4) + 1;

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
                    this.dispatchEvent(new GOEvent('release', this));
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