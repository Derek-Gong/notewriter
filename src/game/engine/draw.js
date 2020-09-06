

import { GOAttribute } from './core.js';
import { rectXRect, Rect, roundRect } from './utils';

class Drawable extends GOAttribute {
    constructor(go, x, y, width, height, globalCompositeOperation = '') {
        super(go);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.globalCompositeOperation = globalCompositeOperation;

        this.visable = true;
        this.outOfScene = false;
    }
    update(dt) {
        if (!this.visable) return;
        this.outOfScene = !rectXRect(new Rect(this.x + this.go.x, this.y + this.go.y, this.width, this.height),
            new Rect(0, 0, this.go.scene.width, this.go.scene.height));

    }
}

export class RectDraw extends Drawable {
    constructor(go, x, y, width, height, fill) {
        super(go, x, y, width, height);
        this.fill = fill;

        this.go.addEventListener('resize', (e) => { return this.onResize(e); });
    }
    onResize(e) {
        ({ width: this.width, height: this.height } = e.msg);
    }
    update(dt) {
        super.update(dt);
        if (!this.visable || this.outOfScene) return;
        const ctx = this.go.scene.context;
        ctx.fillStyle = this.fill;
        const x = this.go.x + this.x;
        const y = this.go.y + this.y;
        ctx.fillRect(x, y, this.width, this.height);
    }
}

export class RoundRectDraw extends Drawable {
    constructor(go, x, y, width, height, radius, fill, stroke) {
        super(go, x, y, width, height);
        this.radius = radius;
        this.fill = fill;
        this.stroke = stroke;

        this.go.addEventListener('resize', (e) => { return this.onResize(e); });
    }
    onResize(e) {
        ({ width: this.width, height: this.height } = e.msg);
    }
    update(dt) {
        super.update(dt);
        if (!this.visable || this.outOfScene) return;

        const ctx = this.go.scene.context;
        const tmp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = this.globalCompositeOperation;
        roundRect(ctx, this.go.x + this.x, this.go.y + this.y, this.width, this.height, this.radius, this.fill, this.stroke);
        ctx.globalCompositeOperation = tmp;
    }
}