import { GOAttribute } from './core';
import { pointInRect } from './utils';

const ButtonType = {
    NoButton: 0,
    PrimaryButton: 1,
    SecondaryButton: 2,
};

export class MouseControl extends GOAttribute {

    constructor(go, x, y, width, height, controller, bubbling = true) {
        super(go);
        this.x = x
        this.y = y
        this.width = width;
        this.height = height;
        this.clicked = false;
        this.controller = controller;
        this.bubbling = bubbling

        controller.addHandler('mouseup', this.go, (e) => { return this.onMouse(e); });
        controller.addHandler('mousedown', this.go, (e) => { return this.onMouse(e); });
        controller.addHandler('mousemove', this.go, (e) => { return this.onMouse(e); });
        this.go.addEventListener('resize', (e) => { return this.onResize(e); });
        // this.go.scene.addEventListener('mouseleave', (e) => { return this.onMouseLeave(e); });

        this.buttons = 0;
        this.clicked = false;
        this.rightClicked = false;
        this.dragging = false;
        this.releasing = false;
        this.lastOffsetX = undefined;
        this.lastOffsetY = undefined;
        this.offsetX = undefined;
        this.offsetY = undefined;
        this.type = undefined;
        this.lastType = undefined;
        this.dragInnerX = undefined;
        this.dragInnerY = undefined;

        this.releaseX = undefined;
        this.releaseY = undefined;
    }

    onResize(e) {
        ({ width: this.width, height: this.height } = e.msg);
    }

    hitTest(x, y) {
        if (this.dragging) return true;

        if (pointInRect(x, y, this.go.x + this.x, this.go.y + this.y, this.width, this.height))
            return true;
        return false;
    }
    onMouseLeave(e) {
        this.dragging = false;
        this.releasing = false;
    }
    onMouse(e) {
        const x = e.offsetX, y = e.offsetY;
        if (this.hitTest(x, y)) {
            if (e.type == 'mouseup') {
                //check click
                if (this.type == 'mousedown') {
                    if (this.buttons & ButtonType.PrimaryButton)
                        this.clicked = true;
                    if (this.buttons & ButtonType.SecondaryButton)
                        this.rightClicked = true;
                }
                //check release
                else if (this.dragging) {
                    this.dragging = false;
                    this.releasing = true;
                    this.releaseX = x;
                    this.releaseY = y;
                }
            } else if (e.type == 'mousemove') {
                //check dragging
                if (this.type == 'mousedown') {
                    this.dragging = true;
                    this.dragInnerX = this.offsetX - this.x - this.go.x;
                    this.dragInnerY = this.offsetY - this.y - this.go.y;
                } else if ((e.buttons & ButtonType.PrimaryButton) == 0 && this.dragging) {//left button released 
                    this.dragging = false;
                    this.releasing = true;
                    this.releaseX = x;
                    this.releaseY = y;
                }
            }
            // if (e.type != 'mousemove' || this.dragging) {
            this.lastOffsetX = this.offsetX;
            this.lastOffsetY = this.offsetY;
            this.lastType = this.type;
            this.buttons = e.buttons;
            this.offsetX = x;
            this.offsetY = y;
            this.type = e.type;
            // }
        }
        return this.bubbling;
    }

    reset() {
        this.buttons = 0;
        this.clicked = false;
        this.rightClicked = false;
        this.dragging = false;
        this.releasing = false;
        this.lastOffsetX = undefined;
        this.lastOffsetY = undefined;
        this.offsetX = undefined;
        this.offsetY = undefined;
        this.type = undefined;
        this.lastType = undefined;
        this.dragInnerX = undefined;
        this.dragInnerY = undefined;
    }

    destroy() {
        this.controller.deleteHandler('mouseup', this.go);
        this.controller.deleteHandler('mousedown', this.go);
        this.controller.deleteHandler('mousemove', this.go);
    }
}

export class KeyControl extends GOAttribute {
    constructor(go, controller) {
        super(go);
        this.controller = controller;
        this.keydown = false;
        this.keyup = false;
        this.downKey = undefined;
        this.upKey = undefined;

        controller.addHandler('keydown', this.go, (e) => { this.onKeydown(e); return false; });
        controller.addHandler('keyup', this.go, (e) => { this.onKeyup(e); return false; });
        // controller.addHandler('keypress', go, (e) => { this.onKeypress(e) });

    }

    onKeydown(e) {
        // console.log(e);
        this.keydown = true;
        this.downKey = e.keyCode;
    }

    onKeyup(e) {
        // console.log(e);
        this.keyup = true;
        this.upKey = e.keyCode;
    }
    // onKeypress(e) {
    //     console.log(e);
    // }
    reset() {
        this.keydown = false;
        this.keyup = false;
        this.downKey = undefined;
        this.upKey = undefined;
    }

    destroy() {
        this.controller.deleteHandler('keydown', this.go);
        this.controller.deleteHandler('keyup', this.go);
    }
}

