import { GameObject, GOEvent } from './engine/core.js';
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
    console.log(notesArr)
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