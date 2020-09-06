
export class PianoSoundPool {
    static instance;
    constructor() {
        this.sounds = {};
        // for (let i = 0; i < 36; i++) {
        //     const filename = String(i).padStart(2, '0');
        //     const path = require('../assets/sound/' + filename + '.mp3');
        //     this.sounds[i + 48] = new Audio(path);
        // }
    }
    async play(pitch, duration = 0) {
        await this.sounds[pitch].play().then(() => {
            if (duration > 0)
                setTimeout(() => {
                    this.sounds[pitch].pause();
                    this.sounds[pitch].currentTime = 0;
                }, duration);
        });
    }
    static getInstance() {
        if (!PianoSoundPool.instance) {
            if (!PianoSoundPool.instance) {
                PianoSoundPool.instance = new SoundPool();
                delete PianoSoundPool.instance.constructor;
            }
        }
        return PianoSoundPool.instance;
    }
}