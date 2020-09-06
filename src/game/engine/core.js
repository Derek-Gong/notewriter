import { pointInRect, drawLine, Rect, roundRect, rectXRect } from './utils.js'
export class Settings {
    constructor() {
        this.canvasName = "mainStage";
        this.canvasWidth = 1280;
        this.canvasHeight = 720;

        this.fps = 60;
        this.tickRate = 64;
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

        this.dt = 1000 / this.scene.settings.fps;
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

        let gos = Object.values(this.scene.goList).sort((a, b) => {
            return a.layer - b.layer;
        })
        for (let go of gos) go.update(this.dt);
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
        this.addEventListener = (type, func) => { this.canvas.addEventListener(type, func); };
        //Make canvas focusable
        this.canvas.tabIndex = 1;
    }
}
//Carry the whole game
//Include canvas, game objects, controller
export class GameScene {
    constructor(settings) {
        this.settings = settings;
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
        this.eventListeners = {};

        this.controller = new Controller(this, this.goTree, this.settings.tickRate);
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
    addEventListener(type, listener) {
        if (!(type in this.eventListeners))
            this.eventListeners[type] = [];
        this.eventListeners[type].push(listener);
    }
    async dispatchEvent(event) {
        if (!(event instanceof GOEvent))
            throw 'wrong scene event type';
        if (event.type in this.eventListeners)
            for (let listener of this.eventListeners[event.type])
                listener(event);
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    end() { }
}
//
class Controller {
    static mouseEvent = ["click", "mousemove", 'mouseout', 'mouseleave', 'mouseenter', 'mouseup', 'mousedown'];
    static otherEvent = ["keydown", "keyup", "keypress"];
    constructor(scene, goTree, tickRate = 64) {
        this.handlers = {};
        this.captureHandlers = {};
        this.tickRate = tickRate;
        this.lastTick = new Date().getTime();
        for (let type of Controller.mouseEvent) {
            this.handlers[type] = {};
            this.captureHandlers[type] = {};
            //handle event capture and event bubble
            //mouse event handler MUST return a boolean, true to stop propagating on event chain
            scene.canvas.addEventListener(type, (e) => {
                if (!this.tickLimit() && (type == 'mousemove')) return;
                scene.dispatchEvent(new GOEvent(type, e));

                let captureHandlers = this.captureHandlers[type];
                let handlers = this.handlers[type];
                function traverse(go) {
                    if (go.mouseControl && !go.mouseControl.hitTest(e.offsetX, e.offsetY))
                        return false;

                    // if (type == 'click')
                    //     console.log(type, go, go.father);
                    let captureFlag = false;
                    let bubbleFlag = false;
                    if (go.id in captureHandlers)
                        captureFlag = captureFlag || captureHandlers[go.id](e);
                    //down to leaves
                    if (!captureFlag)
                        for (let go of Object.values(go.sons)) {
                            let res = traverse(go);
                            bubbleFlag = bubbleFlag || res;
                        }
                    //up to roots
                    if (!bubbleFlag && go.id in handlers) {
                        return handlers[go.id](e);
                    }
                    return bubbleFlag;
                }
                for (let go of Object.values(goTree['roots']))
                    traverse(go);

            });
        }
        for (let type of Controller.otherEvent) {
            this.handlers[type] = {};
            this.captureHandlers[type] = {};
            scene.canvas.addEventListener(type, (e) => {
                if (!this.tickLimit()) return;
                scene.dispatchEvent(new GOEvent(type, e));
                // if (type != 'mousemove')
                //     console.log(type, e);
                for (let handler of Object.values(this.handlers[type])) {
                    handler(e);
                }
            });
        }
    }
    tickLimit() {
        const curtick = new Date().getTime();
        if (curtick - this.lastTick < 1000 / this.tickRate)
            return false;
        this.lastTick = curtick;
        return true;
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
    constructor(x, y, width, height, scene, father = null, layer = 0) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this.sons = {};
        this.scene = scene;
        this.father = father;
        this.layer = layer;
        this.attributes = [];
        this.id = GameObject.nextID++;
        this.destroyed = false;
        this.eventListeners = {};

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
        if (dx != 0)
            this.dispatchEvent(new GOEvent('move', this));
    }
    get y() { return this._y }
    set y(ny) {
        const dy = ny - this._y;
        const gos = Object.values(this.sons);
        const len = gos.length;
        for (let i = 0; i < len; i++)
            gos[i].y = gos[i].y + dy;
        this._y = ny;
        if (dy != 0)
            this.dispatchEvent(new GOEvent('move', this));
    }

    get width() {
        return this._width;
    }
    set width(w) {
        this._width = w;
        this.dispatchEvent(new GOEvent('resize', this));
    }
    get height() {
        return this._height;
    }
    set height(h) {
        this._height = h;
        this.dispatchEvent(new GOEvent('resize', this));
    }
    addSon(go) {
        this.sons[go.id] = go;
        go.father = this.id;
        go.addEventListener('destroy', e => { this.removeSon(e.msg) });
        this.scene.addFather(go);
    }
    removeSon(go) {
        delete this.sons[go.id];
        this.scene.deleteFather(go);
        go.father = null;
    }
    // hitTest(x, y) {
    //     if (pointInRect(x, y, this.x, this.y, this.width, this.height))
    //         return true;
    //     return false;
    // }
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
    addEventListener(type, listener) {
        if (!(type in this.eventListeners))
            this.eventListeners[type] = [];
        this.eventListeners[type].push(listener);
    }
    async dispatchEvent(event) {
        if (!(event instanceof GOEvent))
            throw 'wrong go event type from', this;
        if (event.type in this.eventListeners)
            for (let listener of this.eventListeners[event.type])
                listener(event);

        this.scene.dispatchEvent(event);
    }
    destroy() {
        this.dispatchEvent(new GOEvent('destroy', this));
        for (let attr of this.attributes) if (attr.destroy) attr.destroy(this);
        this.destroyed = true;
        for (let go of Object.values(this.sons))
            go.destroy();
        this.scene.deleteGO(this);
    }
}

export class GOEvent {
    static eventType = ['destroy'];
    constructor(type, msg = undefined) {
        this.type = type;
        this.msg = msg;
    }
}

export class GOAttribute {
    constructor(go) {
        this.go = go;
        this.go.registerAttribute(this);
    }
}


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

        this.clicked = false;
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
                    this.clicked = true;
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
                } else if ((e.buttons & 1) == 0 && this.dragging) {//left button released 
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
            this.offsetX = x;
            this.offsetY = y;
            this.type = e.type;
            // }
        }
        return this.bubbling;
    }

    reset() {
        this.clicked = false;
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

