class Settings {
    constructor() {
        this.canvasName = "mainStage";
        this.canvasWidth = 1280;
        this.canvasHeight = 720;
    }
}

//Entry point
function startGame(scene) {
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

        this.dt = 60;
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
    }
}
//Carry the whole game
//Include canvas, game objects, controller
class GameScene {
    constructor(settings) {
        this.canvas = new Canvas(
            settings.canvasName,
            settings.canvasWidth,
            settings.canvasHeight
        );
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.context;
        this.controller = new Controller(this.canvas.canvas);
        this.goList = {};
    }
    addGO(go) {
        this.goList[go.id] = go;
    }
    deleteGO(go) {
        delete this.goList[go.id];
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    end() { }
}
//
class Controller {
    static eventType = ["click", "mousemove", "keydown"];
    constructor(canvas) {
        this.handlers = {};

        for (let type of Controller.eventType) {
            var handlers = {};
            this.handlers[type] = handlers;
            canvas.addEventListener(type, (e) => {
                for (let handler of Object.values(this.handlers[type])) {
                    handler(e);
                }
            });
        }
    }
    addHandler(type, go, handler) {
        this.handlers[type][go.id] = handler;
    }
    deleteHandler(type, go) {
        delete this.handlers[type][go.id];
    }
}

class GameObject {
    static nextID = 0;
    constructor(x, y, scene) {
        this.x = x;
        this.y = y;
        this.scene = scene;
        this.attributes = [];
        this.id = GameObject.nextID++;
        this.destroyed = false;

        this.scene.addGO(this)
    }
    registAttribute(attr) {
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
        this.scene.deleteGO(this);
    }
}

class GOAttribute { }

class Drawable extends GOAttribute {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.visable = true;
    }
    update(dt, go) {
        if (!this.visable) return;
    }
}

class Rectangle extends Drawable {
    constructor(x, y, width, height, color) {
        super(x, y);
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

class Movable extends GOAttribute {
    //For 0 compare in millisecond
    static eps = 0.1;
    constructor() {
        super();
        this.moveList = [];
    }
    move(dx, dy, dt) {
        this.moveList.push({ dx, dy, dt });
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

class Clickable extends GOAttribute {
    constructor(x, y, width, height, go, controller) {
        super();
        this.x = x
        this.y = y
        this.clickedX = undefined;
        this.clickedY = undefined;
        this.width = width;
        this.height = height;
        this.clicked = false;
        this.go = go;
        this.controller = controller;

        controller.addHandler('click', go, (e) => { this.onClick(e) });
    }

    hitTest(x, y) {
        const x1 = this.go.x + this.x,
            x2 = x1 + this.width,
            y1 = this.go.y + this.y,
            y2 = y1 + this.height;

        if (x1 <= x && x <= x2 && y1 <= y && y <= y2)
            return true;
        return false;
    }

    onClick(e) {
        if (this.clicked) return;
        const x = e.offsetX, y = e.offsetY;
        if (this.hitTest(x, y)) {
            this.clickedX = x;
            this.clickedY = y;
            this.clicked = true;
        }
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

export function startNoteWriter() {
    startGame(new NoteWriter(new Settings));
}

//Game Implementatioin
//

//
class NoteWriter extends GameScene {
    constructor(settings) {
        super(settings);
        this.userNoteManager = new UserNoteManager(0, 0, this, this.width, this.height);
    }
}

class Grid extends GameScene {

}

class UserNoteManager extends GameObject {
    constructor(x, y, scene, width, height) {
        super(x, y, scene);
        this.width = width;
        this.height = height;

        this.clickable = new Clickable(this.x, this.y, this.width, this.height, this, this.scene.controller)
        this.attributes.push(this.clickable);

        this.gridNumX = 20;
        this.gridNumY = 36;
        this.gridWidth = this.width / this.gridNumX;
        this.gridHeight = this.height / this.gridNumY;
        this.gridArray = new Array(this.gridNumX);
        for (let i = 0; i < this.gridNumX; i++)
            this.gridArray[i] = new Array(this.gridNumY);


        this.noteWidth = this.gridWidth * 0.8;
        this.noteHeight = Math.min(this.height * 0.8, this.noteWidth / 2);
        this.noteList = {}
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        if (this.clickable.clicked) {
            // let hitNote = (() => {
            //     for (let id in this.noteList)
            //         if (this.noteList[id].clickable.clicked) {
            //             this.noteList[id].destroy()
            //             delete this.noteList[id];
            //             return true;
            //         }
            //     return false;
            // })();
            // if (!hitNote) {
            const offsetX = this.clickable.clickedX - this.x, offsetY = this.clickable.clickedY - this.y;
            const gridX = Math.floor(offsetX / this.gridWidth), gridY = Math.floor(offsetY / this.gridHeight);
            const id = this.gridArray[gridX][gridY];
            console.log(id);
            if (id) {
                this.noteList[id].destroy()
                delete this.noteList[id];
                this.gridArray[gridX][gridY] = undefined;
            } else {
                const CenterX = this.x + gridX * this.gridWidth + 0.5 * this.gridWidth, CenterY = this.y + gridY * this.gridHeight + 0.5 * this.gridHeight;

                var note = new Note(CenterX - this.noteWidth / 2, CenterY - this.noteHeight / 2, this.scene, this.noteWidth, this.noteHeight, gridY);
                this.noteList[note.id] = note;
                this.gridArray[gridX][gridY] = note.id;

                note.play();
                console.log(note);
            }
            // }
            this.clickable.reset();
        }
    }
}

class Note extends GameObject {
    constructor(x, y, scene, width, height, noteName) {
        super(x, y, scene);
        this.width = width;
        this.height = height;
        this.noteName = String(noteName).padStart(2, '0');

        this.drawable = new Rectangle(0, 0, this.width, this.height, 'black');
        this.clickable = new Clickable(0, 0, this.width, this.height, this, this.scene.controller)

        this.attributes.push(this.drawable);
        this.attributes.push(this.clickable);
        console.log(window.location.pathname);
        this.audio = new Audio('assets/sound/' + this.noteName + '.mp3');
    }
    play() {
        this.audio.play();
    }
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        if (this.clickable.clicked) {
            // this.clickable.reset();
            // this.destroy()
        }
    }
}