import { GameObject, GOEvent } from './core';
import { MouseControl } from './controller';
import { pointInRect, Rect, drawLine } from './utils';
import { RectDraw, RoundRectDraw } from './draw';

export class GridView extends GameObject {
    constructor(x, y, width, height, scene, numX, numY, lineWidth = 1, strokeStyle = '#000000') {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;
        this.lineWidth = lineWidth;
        this.strokeStyle = strokeStyle;

        this.gridNumX = numX;
        this.gridNumY = numY;
        this.gridWidth = this.width / this.gridNumX;
        this.gridHeight = this.height / this.gridNumY;
        this.gridArray = new Array(this.gridNumX);
        for (let i = 0; i < this.gridNumX; i++)
            this.gridArray[i] = new Array(this.gridNumY);

    }
    hitTest(x, y) {
        if (!pointInRect(x, y, this.x, this.y, this.width, this.height))
            return false;
        const offsetX = x - this.x, offsetY = y - this.y;
        const gridX = Math.floor(offsetX / this.gridWidth), gridY = Math.floor(offsetY / this.gridHeight);
        return [gridX, gridY];
    }
    isGrid(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y))
            return false;
        if (pointInRect(x, y, 0, 0, this.gridNumX - 1, this.gridNumY - 1))
            return true;
        return false;
    }
    getGrid(x, y) {
        if (this.isGrid(x, y))
            return undefined == this.gridArray[x][y] ? false : this.gridArray[x][y];
        return false;
    }
    setGrid(x, y, any) {
        if (!this.isGrid(x, y))
            return false;
        this.gridArray[x][y] = any;
        return true;
    }
    getGridRect(x, y) {
        if (this.isGrid(x, y))
            return new Rect(this.x + x * this.gridWidth, this.y + y * this.gridHeight, this.gridWidth, this.gridHeight);
        return false;
    }
    clearGrid(x, y) {
        if (this.isGrid(x, y))
            this.gridArray[x][y] = undefined;
    }
    update(dt) {
        super.update(dt);
        let ctx = this.scene.context;
        let x1, y1 = this.y,
            x2, y2 = this.y + this.height
        for (let i = 0; i <= this.gridNumX; i++) {
            x1 = this.x + i * this.gridWidth;
            x2 = x1;
            drawLine(ctx, x1, y1, x2, y2, this.lineWidth, this.strokeStyle);
        }
        x1 = this.x, x2 = this.x + this.width;
        for (let i = 0; i <= this.gridNumY; i++) {
            y1 = this.y + i * this.gridHeight;
            y2 = y1;
            drawLine(ctx, x1, y1, x2, y2, this.lineWidth, this.strokeStyle);
        }

    }
}

//go size should greater or equal than view port's;
export class ScrollBar extends GameObject {
    static Slot = class extends GameObject {
        constructor(x, y, width, height, scene, slotFill = 'grey') {
            super(x, y, width, height, scene);
            this.drawable = new RectDraw(this, x, y, width, height, slotFill);
        }
    }
    static Bar = class extends GameObject {
        constructor(x, y, width, height, scene, slot, go, viewPort, axis, barFill) {
            super(x, y, width, height, scene);
            this.axis = axis == 'x' ? 'x' : 'y';
            this.dir = this.axis == 'x' ? 'width' : 'height';
            this.slot = slot;
            this.go = go;
            this.viewPort = viewPort;
            this[this.dir] = this[this.dir] * (this.viewPort[this.dir] / this.go[this.dir]);

            this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height,
                this.dir == 'width' ? this.height / 2 : this.width / 2,
                barFill);

            this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller);

            this.addEventListener('resize', e => { return this.onResize(e); });
        }

        onResize(e) {
            this.mouseControl.width = this.width;
            this.mouseControl.height = this.height;
        }

        handleMouse() {
            if (this.mouseControl.dragging) {
                if (this.axis == 'x') {
                    this.x = this.mouseControl.offsetX - this.mouseControl.dragInnerX;
                    this.x = Math.min(Math.max(this.slot.x, this.x), this.slot.x + this.slot.width - this.width);
                } else {
                    this.y = this.mouseControl.offsetY - this.mouseControl.dragInnerY;
                    this.y = Math.min(Math.max(this.slot.y, this.y), this.slot.y + this.slot.height - this.height);
                }
            } else if (this.mouseControl.releasing) {
                this.mouseControl.reset();
            }
        }

        fixedUpdate(dt) {
            super.fixedUpdate(dt);

            this.handleMouse();

        }
    }
    constructor(x, y, width, height, scene, go, viewPort, axis = 'x', slotFill = 'grey', barFill = 'black') {
        super(x, y, width, height, scene);
        this.go = go;
        this.viewPort = viewPort;//view port rect
        this.axis = axis == 'x' ? 'x' : 'y';
        this.dir = this.axis == 'x' ? 'width' : 'height';

        this.slot = new ScrollBar.Slot(x, y, width, height, scene, slotFill);
        this.bar = new ScrollBar.Bar(x, y, width, height, scene, this.slot, go, viewPort, axis, barFill);
        this.addSon(this.slot);
        this.addSon(this.bar);

        this.go.addEventListener('resize', e => { return this.onGOResize(e); });
        this.bar.addEventListener('move', e => { return this.onMove(e); });
    }

    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        this.syncBar();
    }
    syncBar() {
        const progress = (this.viewPort[this.axis] - this.go[this.axis]) / (this.go[this.dir] - this.viewPort[this.dir]);
        this.bar[this.axis] = this.slot[this.axis] + progress * (this.slot[this.dir] - this.bar[this.dir]);
    }
    onGOResize(e) {
        this.bar[this.dir] = this.slot[this.dir] * (this.viewPort[this.dir] / this.go[this.dir]);
        this.onGOMove(e);
    }
    onMove(e) {
        const progress = (this.bar[this.axis] - this.slot[this.axis]) / (this.slot[this.dir] - this.bar[this.dir]);
        this.go[this.axis] = this.viewPort[this.axis] - progress * (this.go[this.dir] - this.viewPort[this.dir]);
    }
}

export class Slider extends GameObject {
    static Slot = class extends GameObject {
        constructor(x, y, width, height, scene, slotStroke = 'grey') {
            super(x, y, width, height, scene);
            this.drawable = new RoundRectDraw(this, 0, 0, width, height, height / 2, false, slotStroke);

        }
    }
    static Knob = class extends GameObject {
        constructor(x, y, width, height, scene, slot, axis, knobFill = 'blue') {
            super(x, y, width, height, scene);
            this.axis = axis == 'x' ? 'x' : 'y';
            this.dir = this.axis == 'x' ? 'width' : 'height';
            this.slot = slot;

            this.drawable = new RoundRectDraw(this, 0, 0, this.width, this.height,
                this.dir == 'width' ? this.height / 2 : this.width / 2,
                knobFill);

            this.mouseControl = new MouseControl(this, 0, 0, this.width, this.height, this.scene.controller);

        }

        handleMouse() {
            if (this.mouseControl.dragging) {
                if (this.axis == 'x') {
                    let x = this.mouseControl.offsetX - this.mouseControl.dragInnerX;
                    this.x = Math.min(Math.max(this.slot.x, x), this.slot.x + this.slot.width - this.width);
                } else {
                    let y = this.mouseControl.offsetY - this.mouseControl.dragInnerY;
                    this.y = Math.min(Math.max(this.slot.y, y), this.slot.y + this.slot.height - this.height);
                }
            } else if (this.mouseControl.releasing) {
                this.mouseControl.reset();
            }
        }

        fixedUpdate(dt) {
            super.fixedUpdate(dt);

            this.handleMouse();

        }
    }
    constructor(x, y, width, height, scene, valSetter, valGetter = false, axis = 'x', slotStroke = 'grey', knobFill = 'black') {
        super(x, y, width, height, scene);
        this.valGetter = valGetter;
        this.valSetter = valSetter;
        this.axis = axis == 'x' ? 'x' : 'y';
        this.dir = this.axis == 'x' ? 'width' : 'height';
        this.progress = 0.5;

        this.slot = new Slider.Slot(x, y, width, height, scene, slotStroke);
        const diameter = this[this.dir == 'width' ? 'height' : 'width'] * 2;
        this.knob = new Slider.Knob(x, y, diameter, diameter, scene, this.slot, axis, knobFill);
        this.knob[this.axis == 'x' ? 'y' : 'x'] -= this[this.dir == 'width' ? 'height' : 'width'] * 0.5;
        console.log(this.slot)
        this.addSon(this.slot);
        this.addSon(this.knob);

        this.knob.addEventListener('move', e => { return this.onMove(e); });
    }

    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        this.syncKnob();
    }
    syncKnob() {
        if (this.valGetter) {
            this.progress = this.valGetter();
        }
        this.knob[this.axis] = this.slot[this.axis] + this.progress * (this.slot[this.dir] - this.knob[this.dir]);
    }
    onMove(e) {
        this.progress = (this.knob[this.axis] - this.slot[this.axis]) / (this.slot[this.dir] - this.knob[this.dir]);
        this.valSetter(this.progress);
    }
}
