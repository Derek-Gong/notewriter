import { startGame, Settings, GameScene, GOContainer, MouseControl, KeyControl, GridView, GameObject, RectDraw } from './engine.js';
import { } from './utils.js';

//Game Implementatioin
//

//

export function startNoteWriter() {
    startGame(new NoteWriter(new Settings));
}

class NoteWriter extends GameScene {
    constructor(settings) {
        super(settings);
        this.userNoteManager = new UserNoteManager(0, 0, this, this.width, this.height);
    }
}

class UserNoteManager extends GOContainer {
    constructor(x, y, scene, width, height) {
        super(x, y, scene);
        this.width = width;
        this.height = height;

        this.mouseControl = new MouseControl(this, this.x, this.y, this.width, this.height, this.scene.controller)
        this.keyControl = new KeyControl(this, this.scene.controller);

        this.gridView = new GridView(this.x, this.y, scene, this.width, this.height, 20, 36);
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

    fixedUpdate(dt) {
        super.fixedUpdate(dt);
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
        if (this.mouseControl.clicked) {
            const gridXY = this.gridView.hitTest(this.mouseControl.clickedX, this.mouseControl.clickedY);

            if (gridXY) {
                let gridX, gridY;
                ({ gridX, gridY } = gridXY);
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
                    var note = new Note(CenterX - this.noteWidth / 2, CenterY - this.noteHeight / 2, this.scene, this.noteWidth, this.noteHeight, noteName, gridX * 60 / this.bmp * 1000);

                    this.noteList[note.id] = note;
                    this.addSon(note);
                    this.gridView.setGrid(gridX, gridY, note.id);
                    note.play();
                }
            }

            this.mouseControl.reset();
        }
    }
}

class Note extends GameObject {
    constructor(x, y, scene, width, height, noteName, startTime) {
        super(x, y, scene);
        this.width = width;
        this.height = height;
        this.noteName = String(noteName).padStart(2, '0');

        this.drawable = new RectDraw(this, 0, 0, this.width, this.height, 'black');
        this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller)

        this.startTime = startTime;
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
            // this.mouseControl.reset();
            // this.destroy()
        }
    }
}