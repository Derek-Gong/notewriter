//In Rect and on the edges
export function pointInRect(x, y, rectX, rectY, width, height) {
    if (rectX <= x && x <= rectX + width && rectY <= y && y <= rectY + height)
        return true;
    return false;
}

export function drawLine(ctx, x1, y1, x2, y2, lineWidth = 1, strokeStyle = '#000000') {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

export class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}