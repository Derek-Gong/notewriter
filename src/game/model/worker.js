// works for some reason
import { MusicRNN } from '@magenta/music/es6/music_rnn';
import * as core from '@magenta/music/es6/core';

import { NoteSequence } from './model.js';//worked because an import (including offline audio) removed from model.js
// doesn't compile
// const Model = require('./model.js');
// import * as Model from './model.js';
// doesn't work
// importScripts("./model.js")
// importScripts("model.js", "go.js");
// importScripts("@magenta/music/es6/music_rnn.js");


//worker to continue sequences with model

const weight_url = "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn";
let mrnn = new MusicRNN(weight_url);

// {notes: input NoteList}
onmessage = async (event) => {
    if (!mrnn.isInitialized()) {
        await mrnn.initialize();
        postMessage({ fyi: 'model initialized' });
    } else {
        let inputSeq = event.data.seq;
        switch (event.data.origin) {
            case 'NS':
                if (inputSeq.length == 0) {
                    postMessage({ sample: inputSeq, origin: event.data.origin });
                } else {
                    let seqArr = await sortedGenerate(mrnn, inputSeq, inputSeq.totalTime + 16, event.data.seqNum);
                    console.log(event.data.delay);
                    postMessage({ seqArr: seqArr, origin: event.data.origin });
                }
                break;
            default:
                if (inputSeq.length == 0) {
                    postMessage({ sample: inputSeq, origin: event.data.origin });
                } else {
                    let outputSeq = await sample(mrnn, inputSeq, inputSeq.totalTime + 16, false, event.data.delay);
                    console.log(event.data.delay);
                    postMessage({ seq: outputSeq, origin: event.data.origin });
                }
        }
    }

    // postMessage({notes: outputNotes});
};

async function sortedGenerate(model, noteSequence, totalLength = 16.0, num_seq = 8) {
    //generate multiple sequences and sort them
    let seqArr = [];
    for (let i = 0; i < num_seq; i++) {
        let seq = await sample(model, noteSequence, totalLength);
        console.log('generated sample');
        // let contour = melContour(seq);
        // contourArr.push(contour);
        seqArr.push(seq);
    }
    seqArr.sort((a, b) => melContour(b) - melContour(a)); //ascending to descending
    return seqArr;
}

async function sample(model, noteSequence, totalLength = 16.0, includeOriginal = false, delay = true) {
    let output;
    let softmaxTemp = 1.0;
    if (noteSequence.notes.length == 0) return noteSequence;
    //length should be in beats
    let genLength = (totalLength - noteSequence.totalTime) * 4;
    let inputSeq = seq2qseq(noteSequence);
    // console.log(inputSeq);
    // prob: no_event, note_off, 36 pitches (48-84)
    let gen = await model.continueSequence(inputSeq, genLength, softmaxTemp);
    if (includeOriginal) {
        gen = core.sequences.concatenate([inputSeq, gen]);
        output = qseq2seq(gen);
    }
    else {
        //slide sequence by original legnth to get actual absolute startTime
        if (delay) output = qseq2seq(gen, noteSequence.totalTime);
        else output = qseq2seq(gen)
    }
    // console.log(output);
    return output;
}

function seq2qseq(seq) {
    //convert from Model.NoteSequence to magenta quantized NoteSequence
    let qSeq = core.sequences.createQuantizedNoteSequence(4, 100);
    qSeq.quantizationInfo = { stepsPerQuarter: 4 };
    qSeq.totalQuantizedSteps = seq.totalTime * 4;
    qSeq.tempos = seq.tempos;
    qSeq.timeSignatures = seq.timeSignatures;
    qSeq.ticksPerQuarter = seq.ticksPerQuarter;
    qSeq.notes = [];
    seq.notes.forEach(function (note) {
        let newNote = {
            pitch: note.pitch,
            quantizedStartStep: note.startTime * 4,
            quantizedEndStep: note.endTime * 4,
        };
        qSeq.notes.push(newNote);
    });
    return qSeq;
}

function qseq2seq(qSeq, offset = 0) {
    //convert from Model.NoteSequence to magenta quantized NoteSequence
    let seq = new NoteSequence(qSeq.totalQuantizedSteps / 4, 0, []);
    seq.tempos = qSeq.tempos;
    seq.timeSignatures = qSeq.timeSignatures;
    seq.ticksPerQuarter = qSeq.ticksPerQuarter;
    qSeq.notes.forEach(function (note) {
        let newNote = {
            pitch: note.pitch,
            startTime: note.quantizedStartStep / 4 + offset,
            endTime: note.quantizedEndStep / 4 + offset,
        };
        seq.notes.push(newNote);
    });
    return seq;
}

function melContour(mel) {
    //count consecutive ascending/descending notes
    let maxAscend = 0, maxDescend = 0, curAscend = 0, curDescend = 0;
    let prev = mel.notes[0].pitch;
    mel.notes.forEach(function (note) {
        if (note.pitch - prev > 0) {
            curAscend++;
            curDescend = 0;
        }
        if (note.pitch - prev < 0) {
            curDescend++;
            curAscend = 0;
        }
        maxAscend = (curAscend > maxAscend) ? curAscend : maxAscend;
        maxDescend = (curDescend > maxDescend) ? curDescend : maxDescend;
        prev = note.pitch;
    });
    let value = (maxAscend > maxDescend) ? maxAscend : -maxDescend;
    return value;
}
