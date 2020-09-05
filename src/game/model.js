import * as mm from '@magenta/music';

// {
//     ticksPerQuarter: 220,
//     totalTime: 2,
//     timeSignatures: [
//       {
//         time: 0,
//         numerator: 4,
//         denominator: 4,
//       }
//     ],
//     tempos: [
//       {
//         time: 0,
//         qpm: 120
//       }
//     ],
//   notes: [{
//       pitch: 52,
//       startTime: 0.0,
//       endTime: 0.5
//     },
//     {
//       pitch: 58,
//       startTime: 0.5,
//       endTime: 1.0
//     },
//     {
//       pitch: 60,
//       startTime: 1.0,
//       endTime: 1.5
//     }]
//   }

export class Note {
    constructor(pitch, startTime, endTime) {
        this.pitch = pitch;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

export class NoteSequence {
    constructor(totalTime, bpm, notes) {
        this.ticksPerQuarter = 220;
        this.totalTime = totalTime;
        this.timeSignatures = [
            {
                time: 0,
                numerator: 4,
                denominator: 4,
            }
        ];
        this.tempos = [
            {
                time: 0,
                qpm: bpm
            }
        ];
        this.notes = notes;
    }
}

export class NoteGenerator {
    constructor() { 
        const weight_url = "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn";
        this.model = new mm.MusicRNN(weight_url);
        this.model.initialize();
    }

    async generate(inputNoteSequence, num_seq=8){
        //generate multiple sequences and sort them
        let seqArr = [];
        for (let i = 0; i < num_seq; i++){
            let seq = await this.sample(inputNoteSequence);
            console.log('generated sample');
            // let contour = melContour(seq);
            // contourArr.push(contour);
            seqArr.push(seq);
        }
        seqArr.sort((a,b) => melContour(b) - melContour(a)); //ascending to descending
        return seqArr;
    }

    async sample(noteSequence, totalLength=16.0, softmaxTemp=1.5, includeOriginal=false){
        if (noteSequence.notes.length == 0) return noteSequence;
        //length should be in beats
        let genLength = (totalLength - noteSequence.totalTime)*4;
        let inputSeq = seq2qseq(noteSequence);
        console.log(inputSeq);
        // prob: no_event, note_off, 36 pitches (48-84)
        let gen = await this.model.continueSequence(inputSeq, genLength, softmaxTemp);
        if (includeOriginal) gen = mm.sequences.concatenate([inputSeq, gen]);
        let output = qseq2seq(gen, noteSequence.totalTime); //shift sequence to get actual start time
        console.log(output);
        return output;
    }
}

function melContour(mel){
    //count consecutive ascending/descending notes
    let maxAscend = 0, maxDescend = 0, curAscend = 0, curDescend = 0;
    let prev = mel.notes[0].pitch;
    mel.notes.forEach(function(note) {
      if (note.pitch - prev > 0){
        curAscend++;
        curDescend = 0;
      }
      if (note.pitch - prev < 0){
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

function seq2qseq(seq){
    //convert from Model.NoteSequence to magenta quantized NoteSequence
    let qSeq = mm.sequences.createQuantizedNoteSequence(4, 100);
    qSeq.quantizationInfo = {stepsPerQuarter: 4};
    qSeq.totalQuantizedSteps = seq.totalTime*4;
    qSeq.tempos = seq.tempos;
    qSeq.timeSignatures = seq.timeSignatures;
    qSeq.ticksPerQuarter = seq.ticksPerQuarter;
    qSeq.notes = [];
    seq.notes.forEach(function(note) {
        let newNote = {
            pitch: note.pitch,
            quantizedStartStep: note.startTime*4,
            quantizedEndStep: note.endTime*4,
        };
        qSeq.notes.push(newNote);
    });
    return qSeq;
}

function qseq2seq(qSeq, offset=0){
    //convert from Model.NoteSequence to magenta quantized NoteSequence
    let seq = new NoteSequence(qSeq.totalQuantizedSteps/4, 0, []);
    seq.tempos = qSeq.tempos;
    seq.timeSignatures = qSeq.timeSignatures;
    seq.ticksPerQuarter = qSeq.ticksPerQuarter;
    qSeq.notes.forEach(function(note) {
        let newNote = {
            pitch: note.pitch,
            startTime: note.quantizedStartStep/4 + offset,
            endTime: note.quantizedEndStep/4 + offset,
        };
        seq.notes.push(newNote);
    });
    return seq;
}