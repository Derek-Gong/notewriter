import { GridView } from '../engine/go.js';
import { Note } from './primitives.js';

export class NoteGird extends GridView {
    constructor(x, y, width, height, scene, numX, numY) {
        super(x, y, width, height, scene, numX, numY);
        this.noteWidth = this.gridWidth;
        this.noteHeight = this.gridHeight * 0.8;
        this.fourthWidth = this.gridWidth * 4;// 4/4 time, a gird is a sixteenth note.

        this.noteGridXY = {};
        this.bpm = this.scene.settings.bpm;
    }
    createNote(x, y, noteLen = 4) {
        const gridXY = this.hitTest(x, y);//out of box
        if (!gridXY) return false;

        const [gridX, gridY] = gridXY;
        for (let i = 0; i < noteLen; i++)
            if (this.getGrid(gridX + i, gridY))//possessed by another note
                return false;

        const noteName = this.grid2Pitch(gridX, gridY);
        const [noteX, noteY] = this.getNoteXY(gridX, gridY);

        const startTime = gridX / 4;
        var note = new Note(noteX, noteY, this.fourthWidth * noteLen / 4, this.noteHeight, this.scene, noteName, this.fourthWidth, startTime, noteLen, this.bpm);

        this.addNote(gridX, gridY, note);

        return note;
    }
    createFromModelNote(note) {
        const gridX = Math.round(note.startTime * 4), gridY = this.pitch2GridY(note.pitch);
        const gridXY = this.getNoteXY(gridX, gridY);
        if (!gridXY) return false;
        const noteLen = Math.round((note.endTime - note.startTime) * 4);
        return this.createNote(gridXY[0], gridXY[1], noteLen);
    }
    addNote(gridX, gridY, note) {

        note.addEventListener('destroy', (e) => { return this.onNoteRemove(e); });
        note.addEventListener('release', (e) => { return this.onNoteMove(e); });
        note.addEventListener('resize', (e) => { return this.onNoteResize(e); });

        this.addSon(note);
        this.setNote(gridX, gridY, note);

    }
    getNoteXY(x, y) {
        if (!this.isGrid(x, y)) return false;

        const rect = super.getGridRect(x, y);
        const CenterX = rect.x + rect.width / 2, CenterY = rect.y + rect.height / 2;
        return [CenterX - this.noteWidth / 2, CenterY - this.noteHeight / 2];
    }
    setGrid(x, y, id) {
        if (!super.setGrid(x, y, id))
            return false;
        if (!(id in this.noteGridXY))
            this.noteGridXY[id] = [];
        this.noteGridXY[id].push([x, y]);

        return true;
    }
    setNote(x, y, note) {
        if (!this.isGrid(x, y)) return false;

        let flag = true;
        for (let i = 0; i < note.noteLen; i++)
            flag = flag && this.setGrid(x + i, y, note.id);
        return flag;
    }
    setNoteself(note) {
        const x = Math.round(note.startTime * 4), y = this.pitch2Grid(note.pitch);
        this.setNote(x, y, note);
    }
    clearNote(id) {
        for (let [x, y] of this.noteGridXY[id])
            this.clearGrid(x, y);
        delete this.noteGridXY[id];
    }
    clear() {
        for (let id of Object.keys(this.noteGridXY))
            this.clearNote(id);
    }
    moveNote(x, y, note) {
        if (!this.isGrid(x, y)) return false;

        this.clearNote(note.id);
        this.setNote(x, y, note);
        note.pitch = this.grid2Pitch(x, y);
        note.startTime = x / 4;
        [note.x, note.y] = this.getNoteXY(x, y);
        //noteLen to be fixed
    }
    moveNoteBack(go) {
        const [gridX, gridY] = this.noteGridXY[go.id][0];
        [go.x, go.y] = this.getNoteXY(gridX, gridY);
    }
    grid2Pitch(x, y) {
        if (!this.isGrid(x, y))
            return false;
        return this.gridNumY - y - 1 + 48;
    }
    pitch2GridY(p) {
        return this.gridNumY - p - 1 + 48;
    }
    onNoteRemove(e) {
        let note = e.msg;
        this.clearNote(note.id);
    }
    onNoteMove(e) {
        let note = e.msg;
        const gridXY = this.hitTest(note.x, note.y);

        if (!gridXY) {
            this.moveNoteBack(note);
        } else {
            const [gridX, gridY] = gridXY;
            let id = false;
            for (let i = 0; i < note.noteLen; i++)
                id = id || this.getGrid(gridX + i, gridY);
            if (id && id != note.id) this.moveNoteBack(note);
            else this.moveNote(gridX, gridY, note);
        }
        note.play();
    }
    onNoteResize(e) {
        let note = e.msg;

        const [gridX, gridY] = this.hitTest(note.x, note.y);
        this.moveNote(gridX, gridY, note);
    }
}