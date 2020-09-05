import { GameObject, RoundRectDraw, KeyControl, MouseControl } from './engine.js';
import { pointInRect } from './utils.js';

export class GOMask extends GameObject {
    constructor(x, y, width, height, scene, go) {
        super(x, y, width, height, scene);
        this.go = go;
        this.layer = this.go.layer + 1;
        this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height, this.height / 2, 'red');
        this.drawable.globalCompositeOperation = 'destination-in';
        this.visable = true;
    }
    get visable() {
        return this._visable;
    }
    set visable(b) {
        this._visable = b;
        if (b) {
            this.drawable.width = this.width;
            this.drawable.height = this.height;
            this.drawable.radius = this.height / 2;
        } else {
            this.drawable.width = 0;
            this.drawable.height = 0;
            this.drawable.radius = 0;
        }
    }
}

export class MouseMask extends GOMask {
    constructor(x, y, width, height, scene, go) {
        super(x, y, width, height, scene, go);
        this.scene.addEventListener('mousemove', (goEvent) => {
            let e = goEvent.msg;
            // console.log(e.offsetX, e.offsetY, this.scene.width, this.scene.height);
            // if (!pointInRect(e.offsetX, e.offsetY, 0, 0, this.scene.width, this.scene.height)) {
            //     this.drawable.visable = false;
            //     console.log('f');
            //     return;
            // } else 
            // this.visable = true;
            this.x = e.offsetX - this.width / 2;
            this.y = e.offsetY - this.height / 2;
        });
        // this.scene.addEventListener('mouseleave', (goEvent) => {
        //     this.visable = false;
        // });
        // this.scene.addEventListener('mouseout', (goEvent) => {
        //     this.visable = false;
        // });
        // this.scene.addEventListener('mouseenter', (goEvent) => {
        //     this.visable = true;
        // });
    }
}
// this.gomask = new GOMask(100, 100, 100, 100, this, this.userNoteManager.noteGrid);
// this.gomask.mouseControl = new KeyControl(this.gomask, this.gomask.scene.controller);
// this.gomask.fixedUpdate = (dt) => {
//     this.gomask.super.fixedUpdate(dt);
//     this.gomask.x = this.gomask.mouseControl.offsetX;
//     this.gomask.y = this.gomask.mouseControl.offsetY;
// }