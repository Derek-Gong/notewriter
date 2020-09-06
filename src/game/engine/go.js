import { GameObject } from './core';
import { pointInRect, Rect, drawLine } from './utils';

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
