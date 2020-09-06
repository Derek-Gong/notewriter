//In Rect and on the edges
export function pointInRect(x, y, rectX, rectY, width, height) {
    if (rectX <= x && x <= rectX + width && rectY <= y && y <= rectY + height)
        return true;
    return false;
}

export function rectXRect(rect1, rect2) {
    const l1 = rect1.x, r1 = rect1.x + rect1.width, t1 = rect1.y, b1 = rect1.y + rect1.height;
    const l2 = rect2.x, r2 = rect2.x + rect2.width, t2 = rect2.y, b2 = rect2.y + rect2.height;

    if (r1 < l2 || r2 < l1 || b1 < t2 || b2 < t1) return false;
    return true;
}

export function drawLine(ctx, x1, y1, x2, y2, lineWidth = 1, strokeStyle = '#000000') {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

export function roundRect(ctx, x, y, width, height, radius, fill = false, stroke = false) {
    // if (typeof stroke === 'undefined') {
    //     stroke = true;
    // }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }

}

export class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}