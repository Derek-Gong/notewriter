import { pointInRect, drawLine, Rect } from './utils.js'
export class Settings {
    constructor() {
        this.canvasName = "mainStage";
        this.canvasWidth = 1280;
        this.canvasHeight = 720;
    }
}

//Entry point
export function startGame(scene) {
    var mainLoop = new MainLoop(scene);
    mainLoop.start();
    return mainLoop;
}

// function endGame(mainLoop) {
//     mainLoop.end();
// }

//Begin Engine Definition
//

//
class MainLoop {
    constructor(scene) {
        this.scene = scene;

        this.dt = 16.67;
        this.looping = undefined;
    }
    start() {
        this.looping = setInterval(() => this.loopOnce(), this.dt);
    }
    pause() {
        if (this.looping) clearInterval(this.looping);
    }
    end() {
        if (this.looping) clearInterval(this.looping);
        this.scene.end();
    }
    loopOnce() {
        this.scene.clear();
        for (let go of Object.values(this.scene.goList)) go.fixedUpdate(this.dt);
        for (let go of Object.values(this.scene.goList)) go.update(this.dt);
    }
}
//Manage Canvas
class Canvas {
    constructor(canvasName, width, height) {
        this.canvas = document.getElementById(canvasName);
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.getContext("2d");
        //Make canvas focusable
        this.canvas.tabIndex = 1;
    }
}
//Carry the whole game
//Include canvas, game objects, controller
export class GameScene {
    constructor(settings) {
        this.canvas = new Canvas(
            settings.canvasName,
            settings.canvasWidth,
            settings.canvasHeight
        );
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.context;
        this.goList = {};
        this.goTree = { 'roots': {} };

        this.controller = new Controller(this.canvas.canvas, this.goTree);
    }
    registerGO(go) {
        this.goList[go.id] = go;
        let fa;
        if (null == go.father) fa = 'roots';
        else fa = go.father;
        if (!(fa in this.goTree))
            this.goTree[fa] = {};
        this.goTree[fa][go.id] = go;
    }
    deleteGO(go) {
        delete this.goList[go.id];
        if (null == go.father)
            delete this.goTree['roots'][go.id];
        else
            delete this.goTree[go.father][go.id];

        delete this.goTree[go.id];
    }
    addFather(go) {
        if (null != go.father) {
            delete this.goTree['roots'][go.id];
            if (!(go.father in this.goTree))
                this.goTree[go.father] = {};
            this.goTree[go.father][go.id] = go;
        }
    }
    deleteFather(go) {
        if (null != go.father) {
            delete this.goTree[go.father][go.id];
            this.goTree['roots'][go.id] = go;
        }
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    end() { }
}
//
class Controller {
    static mouseEvent = ["click", "mousemove"];
    static otherEvent = ["keydown", "keyup", "keypress"];
    constructor(canvas, goTree) {
        this.handlers = {};
        this.captureHandlers = {};
        for (let type of Controller.mouseEvent) {
            this.handlers[type] = {};
            this.captureHandlers[type] = {};
            //mouse event handler MUST return a boolean, true to stop propagating on event chain
            canvas.addEventListener(type, (e) => {
                // if (type != 'mousemove')
                //     console.log(type, e);
                let captureHandlers = this.captureHandlers[type];
                let handlers = this.handlers[type];
                function traverse(go) {
                    if (!go.hitTest(e.offsetX, e.offsetY))
                        return false;

                    // console.log(go);
                    let captureFlag = false;
                    let bubbleFlag = false;
                    if (go.id in captureHandlers)
                        captureFlag = captureFlag || captureHandlers[go.id](e);
                    //down to leaves
                    if (!captureFlag)
                        for (let go of Object.values(go.sons))
                            bubbleFlag = bubbleFlag || traverse(go);
                    // if (type == 'click')
                    //     console.log(go, bubbleFlag);
                    //up to roots
                    if (!bubbleFlag && go.id in handlers)
                        return handlers[go.id](e);
                    return bubbleFlag;
                }
                // console.log(goTree);
                for (let go of Object.values(goTree['roots']))
                    traverse(go);

            });
        }
        for (let type of Controller.otherEvent) {
            this.handlers[type] = {};
            this.captureHandlers[type] = {};
            canvas.addEventListener(type, (e) => {
                // if (type != 'mousemove')
                //     console.log(type, e);
                for (let handler of Object.values(this.handlers[type])) {
                    handler(e);
                }
            });
        }
    }
    addCaptureHandler(type, go, handler) {
        this.captureHandlers[type][go.id] = handler;
    }
    deleteCaptureHandler(type, go) {
        delete this.captureHandlers[type][go.id];
    }
    addHandler(type, go, handler) {
        this.handlers[type][go.id] = handler;
    }
    deleteHandler(type, go) {
        delete this.handlers[type][go.id];
    }
}

export class GameObject {
    static nextID = 0;
    constructor(x, y, width, height, scene, father = null) {
        this._x = x;
        this._y = y;
        this.width = width;
        this.height = height;
        this.sons = {};
        this.scene = scene;
        this.father = father;
        this.attributes = [];
        this.id = GameObject.nextID++;
        this.destroyed = false;

        this.scene.registerGO(this)
    }
    get x() { return this._x }
    set x(nx) {
        const dx = nx - this._x;
        const gos = Object.values(this.sons);
        const len = gos.length;
        for (let i = 0; i < len; i++)
            gos[i].x = gos[i].x + dx;
        this._x = nx;
    }
    get y() { return this._y }
    set y(ny) {
        const dy = ny - this._y;
        const gos = Object.values(this.sons);
        const len = gos.length;
        for (let i = 0; i < len; i++)
            gos[i].y = gos[i].y + dy;
        this._y = ny;
    }

    addSon(go) {
        this.sons[go.id] = go;
        go.father = this.id;
        this.scene.addFather(go);
    }
    deleteSon(go) {
        delete this.sons[go.id];
        this.scene.deleteFather(go);
        go.father = null;
    }
    hitTest(x, y) {
        if (pointInRect(x, y, this.x, this.y, this.width, this.height))
            return true;
        return false;
    }
    registerAttribute(attr) {
        this.attributes.push(attr);
    }
    //Handle game logic
    fixedUpdate(dt) {
        for (let attr of this.attributes)
            if (attr.fixedUpdate) attr.fixedUpdate(dt, this);
    }
    //Handle graphics
    update(dt) {
        for (let attr of this.attributes) if (attr.update) attr.update(dt, this);
    }
    destroy() {
        for (let attr of this.attributes) if (attr.destroy) attr.destroy(this);
        this.destroyed = true;
        for (let go of Object.values(this.sons))
            go.destroy();
        this.scene.deleteGO(this);
    }
}
// //Container of go which itself a go and can move all sons while x, y changed
// export class GOContainer extends GameObject {
//     constructor(x, y, scene) {
//         super(x, y, scene);
//         this._x = this.x;
//         this._y = this.y;
//         this.subNodes = {};
//         Object.defineProperty(this, 'x', {
//             get: function () { return this._x },
//             set: function (nx) {
//                 const dx = nx - this._x;
//                 const gos = Object.values(this.subNodes);
//                 const len = gos.length;
//                 for (let i = 0; i < len; i++)
//                     gos[i].x = gos[i].x + dx;
//                 this._x = nx;
//             }
//         });
//         Object.defineProperty(this, 'y', {
//             get: function () { return this._y },
//             set: function (ny) {
//                 const dy = ny - this._y;
//                 const gos = Object.values(this.subNodes);
//                 const len = gos.length;
//                 for (let i = 0; i < len; i++)
//                     gos[i].y = gos[i].y + dy;
//                 this._y = ny;
//             }
//         });
//     }
//     addSon(go) {
//         this.subNodes[go.id] = go;
//     }
//     deleteSon(go) {
//         delete this.subNodes[go.id];
//     }
// }

class GOAttribute {
    constructor(go) {
        go.registerAttribute(this);
    }
}

class Drawable extends GOAttribute {
    constructor(go, x, y) {
        super(go);
        this.x = x;
        this.y = y;
        this.visable = true;
    }
    update(dt, go) {
        if (!this.visable) return;
    }
}

export class RectDraw extends Drawable {
    constructor(go, x, y, width, height, color) {
        super(go, x, y);
        this.width = width;
        this.height = height;
        this.color = color;
    }
    update(dt, go) {
        super.update(dt, go);
        if (!this.visable) return;
        const ctx = go.scene.context;
        ctx.fillStyle = this.color;
        const x = go.x + this.x;
        const y = go.y + this.y;
        ctx.fillRect(x, y, this.width, this.height);
    }
}

export class Movable extends GOAttribute {
    //For 0 compare in millisecond
    static eps = 0.1;
    constructor(go) {
        super(go);
        this.moveList = [];
    }
    move(dx, dy, dt) {
        this.moveList.push({ dx, dy, dt });
    }
    moveTo(x, y) {
        this.go.x = x;
        this.go.y = y;
    }
    fixedUpdate(dt, go) {
        var dx = 0,
            dy = 0;
        var vec;
        //Aggregate dx and dy from last frame to this frame
        for (vec of this.moveList) {
            if (vec.dt < -Movable.eps) (dx += vec.dx), (dy += vec.dy);
            else {
                const t = Math.min(dt, vec.dt);
                dx += (vec.dx / vec.dt) * t;
                dy += (vec.dy / vec.dt) * t;
                vec.dt -= t;
            }
        }
        var i = this.moveList.length - 1;
        for (; i >= 0; i--)
            if (this.moveList[i] < Movable.eps) this.moveList.splice(i, 1);

        go.x += dx;
        go.y += dy;
    }
}

export class MouseControl extends GOAttribute {
    constructor(go, x, y, width, height, controller, clickRet = true, moveRet = true) {
        super(go);
        this.x = x
        this.y = y
        this.clickedX = undefined;
        this.clickedY = undefined;
        this.width = width;
        this.height = height;
        this.clicked = false;
        this.go = go;
        this.controller = controller;
        this.clickRet = clickRet
        this.moveRet = moveRet;

        controller.addHandler('click', go, (e) => { return this.onClick(e); });
    }

    hitTest(x, y) {
        if (pointInRect(x, y, this.go.x + this.x, this.go.y + this.y, this.width, this.height))
            return true;
        return false;
    }

    onClick(e) {
        if (this.clicked) return this.clickRet;
        const x = e.offsetX, y = e.offsetY;
        if (this.hitTest(x, y)) {
            this.clickedX = x;
            this.clickedY = y;
            this.clicked = true;
        }
        return this.clickRet;
    }

    reset() {
        this.clicked = false;
        this.clickedX = undefined;
        this.clickedy = undefined;
    }

    destroy() {
        this.controller.deleteHandler('click', this.go);
    }
}

export class KeyControl extends GOAttribute {
    constructor(go, controller) {
        super(go);
        this.go = go;
        this.controller = controller;
        this.keydown = false;
        this.keyup = false;
        this.downKey = undefined;
        this.upKey = undefined;

        controller.addHandler('keydown', go, (e) => { this.onKeydown(e); return false; });
        controller.addHandler('keyup', go, (e) => { this.onKeyup(e); return false; });
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


export class GridView extends GameObject {
    constructor(x, y, width, height, scene, numX, numY) {
        super(x, y, width, height, scene);
        this.width = width;
        this.height = height;

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
        return { gridX: gridX, gridY: gridY };
    }
    getGrid(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y))
            return false;
        if (pointInRect(x, y, 0, 0, this.gridNumX, this.gridNumY))
            return this.gridArray[x][y];
        return false;
    }
    setGrid(x, y, any) {
        if (!Number.isInteger(x) || !Number.isInteger(y))
            return;
        if (pointInRect(x, y, 0, 0, this.gridNumX, this.gridNumY))
            this.gridArray[x][y] = any;
    }
    getGridRect(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y))
            return false;
        if (pointInRect(x, y, 0, 0, this.gridNumX, this.gridNumY))
            return new Rect(this.x + x * this.gridWidth, this.y + y * this.gridHeight, this.gridWidth, this.gridHeight);
        return false;
    }
    clearGrid(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y))
            return false;
        if (pointInRect(x, y, 0, 0, this.gridNumX, this.gridNumY))
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
            drawLine(ctx, x1, y1, x2, y2, 1);
        }
        x1 = this.x, x2 = this.x + this.width;
        for (let i = 0; i <= this.gridNumY; i++) {
            y1 = this.y + i * this.gridHeight;
            y2 = y1;
            drawLine(ctx, x1, y1, x2, y2, 1);
        }

    }
}
