import * as Model from './model.js';
import { startGame, Settings, GameScene, GameObject, GOEvent } from './engine/core.js';
import { NoteGird, NoteManager, Note } from './go.js'
import { Movable } from './engine/animate.js';
import { MouseControl, KeyControl } from './engine/controller.js';

export class NoteSuggester extends GameObject {
  constructor(x, y, width, height, scene, soundPool, genNum, genLength, noteGenerator) {
    super(x, y, width, height, scene);

    // this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)

    // this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, this.scene.settings.noteNum, this.scene.settings.pitchNum, 2);
    self.genNum = genNum;
    self.genLength = genLength;
    // this.addSon(this.fourthNoteGrid);
    this.keyControl = new KeyControl(this, this.scene.controller);

    this.soundPool = soundPool;
    this.noteGenerator = noteGenerator.noteGenerator; // Model.NoteGenerator
    this.noteLists = [];//nested array to keep generated notes
    this.noteGrids = [];
    let posX;
    for (let i = 0 ; i < genNum; i++){
      this.noteLists.push([]);
      posX = this.x + i * (this.width / genNum);
      this.noteGrids.push(new NoteGird(posX, this.y, this.width/genNum-20, this.height, scene, genLength*4, this.scene.settings.pitchNum));
      this.noteGrids[i].lineWidth = 0.5;
      this.addSon(this.noteGrids[i]);
    }
  }

  play(index) {
    for (let note of this.noteLists[index])
      note.playInSequence();
  }

  placeNotes(index, notes){
    for (let note of notes) {
      this.noteGrids[index].placeNote(note);
      this.noteLists[index].push(note);
    }
  }

  clearNotes(){
    for (let i = 0; i < self.genNum; i++){
      for (let note of this.noteLists[i]) {
        note.destroy();
      }
      this.noteLists[i] = [];
    }
  }

  async updateNotes(inputNotes) {
    let notes;
    if (inputNotes instanceof Object)
      notes = Object.values(Object.assign({}, inputNotes));
    else notes = inputNotes;

    let seq = this.notes2Seq(notes);
    for (let i = 0; i < self.genNum; i++){
      this.noteGenerator.sample(seq, seq.totalTime + 16, false, false).then(
        seqGen => {
          let genList = this.seq2Notes(seqGen);
          this.placeNotes(i, genList);
        }
      );
    }
    console.log(this.noteLists[0]);
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

  handleMouse() {
      // if (this.mouseControl.clicked) {
        //pulsate or something
      // }
  }
  handleKey() {
    if (this.keyControl.keyup) {
        //Space key
        let keynum = this.keyControl.upKey
        if (keynum >= 48 && this.keyControl.upKey <=57 ) {
            this.play(keynum-48);
        }
    }

    this.keyControl.reset();
  }
  fixedUpdate(dt) {
      super.fixedUpdate(dt);
      this.handleKey();
  }
}