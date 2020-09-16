import { GameObject, GOEvent } from '../engine/core.js';
import { MouseControl, KeyControl } from '../engine/controller.js';
import { RoundRectDraw } from '../engine/draw.js';
import { PianoSoundPool } from '../engine/sound.js';


export class Note extends GameObject {
    constructor(x, y, width, height, scene, pitch, fourthWidth, startTime, noteLen, bpm, soundPool = PianoSoundPool.getInstance()) {
        super(x, y, width, height, scene);
        this.layer = 100;
        this.pitch = pitch;
        this.fourthWidth = fourthWidth;
        this.startTime = startTime;
        this.noteLen = noteLen;//num of sixteenth note
        this.bpm = bpm;
        this.soundPool = soundPool;
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
    get endTime() {
        return this.startTime + this.duration;
    }
    play() {
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