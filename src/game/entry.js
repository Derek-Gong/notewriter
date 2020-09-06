
import { startGame } from './engine/core';
import { NoteWriter, GameSettings } from './logic';



export function startNoteWriter() {
    startGame(new NoteWriter(new GameSettings));
}