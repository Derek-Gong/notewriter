import { GameObject, GOEvent } from '../engine/core.js';
import * as Model from '../model/model.js';
import Worker from 'worker-loader!../model/worker.js';

export class NoteGenerator extends GameObject {
    constructor(scene) {
        super(0, 0, 0, 0, scene);
        this.worker = this.initWorker();
        this.curMessageID = 0;
    }
    initWorker() {

        let worker = new Worker();
        worker.onmessage = (event) => {
            if (event.data.fyi) {
                console.log(event.data.fyi);
            } else if (event.data.origin == 'NM') {
                const genSeq = event.data.seq;
                let notes = genSeq.notes;
                this.dispatchEvent(new GOEvent('genSeq', notes));
            } else if (event.data.origin == 'NS') {
                let seqArr = event.data.seqArr;
                for (let i = 0; i < seqArr.length; i++)
                    seqArr[i] = seqArr[i].notes;

                this.dispatchEvent(new GOEvent('genSeqs', seqArr));
            }
        }
        //dummy message to initialize model
        worker.postMessage({ init: 'init' });
        return worker;

    }
    onGenNotes(e) {
        let noteList = e.msg;
        this.sample(noteList, 'NS', true, self.genNum);
    }
    sample(notes, messageOrigin = 'NM', delay = true, seqNum = 1) {
        // can't send Notes object, convert to NoteSequence first
        let inputSeq = this.notes2Seq(notes);
        this.worker.postMessage({ seq: inputSeq, origin: messageOrigin, delay: delay, seqNum: seqNum });
    }
    notes2Seq(notes) {
        if (notes instanceof Object)
            notes = Object.values(Object.assign({}, notes));
        notes.sort((a, b) => {
            return a.startTime - b.startTime;
        });
        let totalTime = 0;
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];
            notes[i] = new Model.Note(note.pitch, note.startTime, note.startTime + note.duration);
            totalTime = Math.max(totalTime, notes[i].endTime);
        }
        return new Model.NoteSequence(totalTime, this.bpm, notes);
    }
    // seq2Notes(seq) {
    //     let notes = seq.notes;
    //     for (let i = notes.length - 1; i >= 0; i--) {
    //         let note = notes[i];
    //         notes[i] = new Note(0, 0, 0, 0, this.scene, note.pitch, 0, note.startTime, Math.round((note.endTime - note.startTime) * 4), 0);
    //     }
    //     return notes;
    // }
    handleKey() {

    }
    handleMouse() {

    }
}


export class NotePlayer extends GameObject {
    constructor(scene, bpm, soundPool) {
        super(0, 0, 0, 0, scene);
        this.bpm = bpm;
        this.soundPool = soundPool;
        this.playing = false;
        this.startTime = 0;
        this.endTime = 0;
        this.curTime = 0;
        this.notes = [] //notes by ascending order
    }
    get progress() {
        if (this.playing)
            return (this.curTime - this.startTime) / (this.endTime - this.startTime);
        return -1;
    }
    playNotes(notes, startTime = 0, endTime = Number.MAX_VALUE) {
        if (this.playing) return;
        this.playing = false;

        this.notes = Array.from(notes);
        this.notes.sort((a, b) => { return a.startTime - b.startTime; });
        let end = -1;
        let firstNode = -1, lastNote = -1;
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (startTime <= note.startTime && note.startTime < endTime) {
                if (firstNode < 0)
                    firstNode = i;
                if (note.endTime > end) {
                    end = note.endTime;
                    lastNote = i;
                }
            }
        }
        this.startTime = startTime;
        this.endTime = Math.min(endTime, end);
        for (let i = firstNode; i <= lastNote; i++) {
            let note = notes[i];
            setTimeout(() => {
                this.curTime = note.startTime;
                if (i == firstNode) {
                    this.dispatchEvent(new GOEvent('startPlay', this.startTime));
                }
                note.play()
                // this.soundPool.play(note.pitch, 60 * 1000 / this.bpm * (Math.min(this.endTime, note.endTime) - note.startTime));
                this.curTime = Math.min(this.endTime, note.endTime);
                if (i == lastNote)
                    this.dispatchEvent(new GOEvent('endPlay', this.curTime));
            }, 60 * 1000 / this.bpm * (note.startTime - this.startTime));
        }
    }
}