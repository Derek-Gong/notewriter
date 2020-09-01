import { startGame, Settings, GameScene, GOContainer, MouseControl, KeyControl, GridView, GameObject, RectDraw, Movable } from './engine.js';
import { } from './utils.js';

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
        this.noteGridXY = {};
    }
    setGrid(x, y, id) {
        super.setGrid(x, y, id);
        if (!(id in this.noteGridXY))
            this.noteGridXY[id] = [];
        this.noteGridXY[id].push({ x: x, y: y });
    }
    onNoteRemove(e) {
        let id = e.msg;
        for (let gridXY of this.noteGridXY[id])
            this.clearGrid(gridXY.x, gridXY.y);
    }
}

class UserNoteManager extends GameObject {
    constructor(x, y, width, height, scene) {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.gridView = new NoteGird(this.x, this.y, this.width, this.height, scene, 20, 36);
        this.addSon(this.gridView);

        this.noteWidth = this.gridView.gridWidth * 0.8;
        this.noteHeight = Math.min(this.gridView.gridHeight * 0.8, this.noteWidth / 2);
        this.noteList = {}
        this.bmp = 80;

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
            const gridXY = this.gridView.hitTest(this.mouseControl.clickedX, this.mouseControl.clickedY);
            // console.log(gridXY);
            if (gridXY) {
                let gridX, gridY;
                ({ x: gridX, y: gridY } = gridXY);
                const id = this.gridView.getGrid(gridX, gridY);
                if (id) {

                    this.deleteSon(this.noteList[id]);
                    this.noteList[id].destroy();
                    delete this.noteList[id];

                    this.gridView.clearGrid(gridX, gridY);
                } else {
                    const rect = this.gridView.getGridRect(gridX, gridY);
                    const CenterX = rect.x + rect.width / 2, CenterY = rect.y + rect.height / 2;

                    const noteName = this.gridView.gridNumY - gridY - 1;
                    let note = this.createNote(gridX, gridY, CenterX - this.noteWidth / 2, CenterY - this.noteHeight / 2, this.noteWidth, this.noteHeight, noteName, gridX * 60 / this.bmp * 1000);

                    note.play();
                }
            }

            this.mouseControl.reset();
        }
    }

    createNote(gridX, gridY, x, y, width, heigth, noteName, startTime) {
        var note = new Note(x, y, width, heigth, this.scene, noteName, startTime);
        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('destroy', (e) => { return this.gridView.onNoteRemove(e); });

        this.noteList[note.id] = note;
        this.addSon(note);
        this.gridView.setGrid(gridX, gridY, note.id);

        return note;
    }

    onNoteRemove(e) {
        let id = e.msg;
        this.deleteSon(this.noteList[id]);
        delete this.noteList[id];
    }

    fixedUpdate(dt) {
        super.fixedUpdate(dt);

        this.handleKey();
        this.handleMouse();
    }
}

class Note extends GameObject {
    constructor(x, y, width, height, scene, noteName, startTime) {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;
        this.noteName = String(noteName).padStart(2, '0');

        this.drawable = new RectDraw(this, 0, 0, this.width, this.height, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller, true)
        this.movable = new Movable(this);

        this.startTime = startTime;
        this.noteLen = 1;//fourth note
        let path = require('../assets/sound/' + this.noteName + '.mp3');
        this.audio = new Audio(path);
        // console.log(this.noteName);
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
        }
    }
}