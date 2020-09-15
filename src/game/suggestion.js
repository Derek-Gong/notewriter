import { GameObject } from './engine/core.js';
import { NoteGird } from './go.js'
import { MouseControl, KeyControl } from './engine/controller.js';

export class NoteSuggester extends GameObject {
  constructor(x, y, width, height, scene, soundPool, genNum, genLength) {
    super(x, y, width, height, scene);

    // this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)

    // this.fourthNoteGrid = new GridView(this.x, this.y, this.width, this.height, scene, this.scene.settings.noteNum, this.scene.settings.pitchNum, 2);
    self.genNum = genNum;
    self.genLength = genLength;
    // this.addSon(this.fourthNoteGrid);
    this.keyControl = new KeyControl(this, this.scene.controller);

    this.soundPool = soundPool;
    this.noteLists = [];//nested array to keep generated notes
    this.noteGrids = [];
    let posX;
    for (let i = 0; i < genNum; i++) {
      this.noteLists.push([]);
      posX = this.x + i * (this.width / genNum);
      this.noteGrids.push(new NoteGird(posX, this.y, this.width / genNum - 20, this.height, scene, genLength * 4, this.scene.settings.pitchNum));
      this.noteGrids[i].lineWidth = 0.5;
      this.addSon(this.noteGrids[i]);
    }
  }

  play(index) {
    for (let note of this.noteLists[index])
      note.playInSequence();
  }
  // onGenNotes(e) {//event from NoteManager
  //   let noteList = e.msg;
  //   this.updateNotes(noteList);
  // }
  onGenSeqs(e) {//event from NoteGenerator
    let index = e.msg.index;
    let notes = e.msg.notes;
    this.clearNotes(index);
    this.placeNotes(index, notes);
  }
  placeNotes(index, notes) {
    for (let note of notes) {
      this.noteGrids[index].placeNote(note);
      this.noteLists[index].push(note);
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
    // if (this.mouseControl.clicked) {
    //pulsate or something
    // }
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
    this.handleKey();
  }
}