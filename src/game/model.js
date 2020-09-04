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
    constructor() { }
    sample(noteSequence) {//for test
        for (let note of noteSequence.notes) {
            note.startTime += noteSequence.totalTime;
            note.endTime += noteSequence.totalTime;
        }
        return noteSequence;
    }
}