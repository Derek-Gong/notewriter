
import { GameObject, GOEvent } from '../engine/core.js';
import { MouseControl, KeyControl } from '../engine/controller.js';
import { GridView } from '../engine/go.js';
import { Movable } from '../engine/animate.js';
import { PianoSoundPool } from '../engine/sound.js';
import { NoteGird } from './structures.js';
import { NotePlayer } from './helpers.js';

export class NoteManager extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);

        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);
        this.movable = new Movable(this);


        this.noteGrid = new NoteGird(this.x, this.y, this.width, this.height * 0.6, scene, this.scene.settings.noteNum * 4, this.scene.settings.pitchNum);
        this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height * 0.6, scene, this.scene.settings.noteNum, this.scene.settings.pitchNum, 2);
        this.addSon(this.noteGrid);
        this.addSon(this.fourthNoteGrid);


        this.notePlayer = new NotePlayer(scene, this.scene.settings.bpm, PianoSoundPool.getInstance());

        this.noteList = {}
        this.genList = {}
        this.lastNote = undefined;

    }

    play() {
        this.notePlayer.playNotes(Object.values(this.noteList));
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
            this.keyControl.reset();
        }
        if (this.keyControl.keyup) {
            //Space key
            if (this.keyControl.upKey == 32) {
                this.play();
            }
            this.keyControl.reset();
        }

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
    onGenSeq(e) {//called from suggester
        this.clearGenNotes();
        let notes = e.msg;
        for (let note of notes) {
            note = this.noteGrid.createFromModelNote(note)
            if (note) {
                note.drawable.fill = 'green';
                note.isGen = true;
                note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
                note.addEventListener('genSelect', (e) => { return this.onGenNoteSelect(e); });
                note.addEventListener('genPlay', (e) => { return this.onGenNotePlay(e); });
                this.genList[note.id] = note;
            }
        }
    }
    genNotes() {
        this.dispatchEvent(new GOEvent('genNotes', this.noteList));
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
        notes = Array.from(notes);
        notes.sort((a, b) => { return a.startTime - b.startTime; });

        // let offset = notes[0].startTime;
        this.clearGenNotes();

        for (let note of notes) {
            let userNote = this.createNote(note.x, note.y, note.noteLen);
            // console.log(userNote);
            // userNote.playInSequence(offset);

            if (note.id == curNote.id)
                break;
        }
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


export class NoteSuggester extends GameObject {
    constructor(x, y, width, height, scene, soundPool, genNum, genLength) {
        super(x, y, width, height, scene);

        // this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)

        // this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, this.scene.settings.noteNum, this.scene.settings.pitchNum, 2);
        self.genNum = genNum;
        self.genLength = genLength;
        // this.addSon(this.fourthNoteGrid);
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller);
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.soundPool = soundPool;
        this.noteLists = [];//nested array to keep generated notes
        this.noteGrids = [];
        this.notesArr = []
        let posX;
        for (let i = 0; i < genNum; i++) {
            this.noteLists.push([]);
            posX = this.x + i * (this.width / genNum);
            this.noteGrids.push(new NoteGird(posX, this.y, this.width / genNum - 20, this.height, scene, genLength * 4, this.scene.settings.pitchNum));
            this.noteGrids[i].lineWidth = 0.5;
            this.addSon(this.noteGrids[i]);
        }
    }
    get selectIndex() {
        return this._selectIndex;
    }
    set selectIndex(id) {
        if (0 <= id && id < self.genNum)
            this._selectIndex = id;
        this.dispatchEvent(new GOEvent('genSeq', this.notesArr[this._selectIndex]));
    }
    play(index) {
        for (let note of this.noteLists[index])
            note.playInSequence();
    }
    onGenSeqs(e) {//event from NoteGenerator
        for (let i = 0; i < self.genNum; i++)
            this.clearNotes(i);
        let notesArr = e.msg;
        if (notesArr.length < 1) return;
        this.notesArr = Array.from(notesArr);
        this.selectIndex = notesArr.length / 2;
        for (let i = 0; i < notesArr.length; i++)
            this.genNotes(i, notesArr[i]);
    }
    genNotes(index, notes) {
        if (notes.length < 1) return;
        const offset = notes[0].startTime;

        for (let note of notes) {
            note = Object.assign({}, note);
            note.startTime -= offset;
            note.endTime -= offset;
            note = this.noteGrids[index].createFromModelNote(note);
            if (note) {
                note.mouseControl.destroy();
                this.noteLists[index].push(note);
            }
        }
    }

    clearNotes(index) {
        for (let note of this.noteLists[index]) {
            note.destroy();
        }
        this.noteLists[index] = [];
    }

    // updateNotes(inputNotes) {
    //   for (let i = 0; i < self.genNum; i++) {
    //     this.noteGenerator.sample(inputNotes, 'NS_' + i.toString(), false);
    //   }
    // }

    handleMouse() {
        const x = this.mouseControl.offsetX, y = this.mouseControl.offsetY;
        if (this.mouseControl.clicked) {
            // pulsate or something
            for (let i = 0; i < self.genNum; i++)
                if (this.noteGrids[i].hitTest(x, y))
                    this.selectIndex = i;
            this.mouseControl.reset();
        } else if (this.mouseControl.rightClicked) {
            for (let i = 0; i < self.genNum; i++)
                if (this.noteGrids[i].hitTest(x, y))
                    this.play(i);
            this.mouseControl.reset();
        }
    }
    handleKey() {
        if (this.keyControl.keyup) {
            let keynum = this.keyControl.upKey;
            //0-9
            if (keynum >= 48 && this.keyControl.upKey <= 57) {
                this.play(keynum - 48);
            }
        }

        this.keyControl.reset();
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        this.handleMouse();
        this.handleKey();
    }
}