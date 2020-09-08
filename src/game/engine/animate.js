/* 
GO animation
*/
import { GOAttribute } from './core';

export class Movable extends GOAttribute {
    //For 0 compare in millisecond
    static eps = 0.1;
    constructor(go) {
        super(go);
        this.moveList = [];
    }
    move(dx, dy, dt) {
        this.moveList.push({ dx: dx, dy: dy, dt: dt });
    }
    moveTo(x, y) {
        this.go.x = x;
        this.go.y = y;
    }
    fixedUpdate(dt) {
        var dx = 0,
            dy = 0;
        var vec;
        //Aggregate dx and dy from last frame to this frame
        for (vec of this.moveList) {
            if (vec.dt < Movable.eps) (dx += vec.dx), (dy += vec.dy);
            else {
                const t = Math.min(dt, vec.dt);
                dx += (vec.dx / vec.dt) * t;
                dy += (vec.dy / vec.dt) * t;
                vec.dx -= dx;
                vec.dy -= dy;
                vec.dt -= t;
            }
        }
        var i = this.moveList.length - 1;
        for (; i >= 0; i--)
            if (this.moveList[i].dt < Movable.eps) this.moveList.splice(i, 1);

        this.go.x += dx;
        this.go.y += dy;
    }
}