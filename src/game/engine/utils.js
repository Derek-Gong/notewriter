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

export class SortedSet {
    constructor(comparator = (a, b) => a > b) {
        this.heap = new PriorityQueue(comparator);
        this.delHeap = new PriorityQueue(comparator);
    }
    size() {
        return this.heap.size();
    }
    isEmpty() {
        return this.size() == 0;
    }
    peek() {
        return this.heap.peek();
    }
    push(value) {
        this.heap.push(value);
    }
    erase(value = undefined) {
        if (value) this.delHeap.push(value);
        while (!this.delHeap.isEmpty() &&
            !this.heap.isEmpty() &&
            this.delHeap.peek() >= this.heap.peek()) {
            if (this.delHeap.peek() == this.heap.peek())
                this.heap.pop();
            this.delHeap.pop();
        }
    }
}

export class PriorityQueue {
    static parent = i => ((i + 1) >>> 1) - 1;
    static left = i => (i << 1) + 1;
    static right = i => (i + 1) << 1;

    constructor(comparator = (a, b) => a > b) {
        this._heap = [];
        this._comparator = comparator;
    }
    size() {
        return this._heap.length;
    }
    isEmpty() {
        return this.size() == 0;
    }
    peek() {
        return this._heap[0];
    }
    push(...values) {
        values.forEach(value => {
            this._heap.push(value);
            this._siftUp();
        });
        return this.size();
    }
    pop() {
        const poppedValue = this.peek();
        const bottom = this.size() - 1;
        if (bottom > 0) {
            this._swap(0, bottom);
        }
        this._heap.pop();
        this._siftDown();
        return poppedValue;
    }
    replace(value) {
        const replacedValue = this.peek();
        this._heap[0] = value;
        this._siftDown();
        return replacedValue;
    }
    _greater(i, j) {
        return this._comparator(this._heap[i], this._heap[j]);
    }
    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }
    _siftUp() {
        let node = this.size() - 1;
        while (node > 0 && this._greater(node, PriorityQueue.parent(node))) {
            this._swap(node, PriorityQueue.parent(node));
            node = PriorityQueue.parent(node);
        }
    }
    _siftDown() {
        let node = 0;
        while (
            (PriorityQueue.left(node) < this.size() && this._greater(PriorityQueue.left(node), node)) ||
            (PriorityQueue.right(node) < this.size() && this._greater(PriorityQueue.right(node), node))
        ) {
            let maxChild = (PriorityQueue.right(node) < this.size() && this._greater(PriorityQueue.right(node), PriorityQueue.left(node))) ? PriorityQueue.right(node) : PriorityQueue.left(node);
            this._swap(node, maxChild);
            node = maxChild;
        }
    }
}