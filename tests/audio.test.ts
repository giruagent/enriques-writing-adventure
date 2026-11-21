import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GameAudio, letterName} from '../lib/audio';

let starts: ReturnType<typeof vi.fn>, resumes: ReturnType<typeof vi.fn>, suspends: ReturnType<typeof vi.fn>, closes: ReturnType<typeof vi.fn>, speaks: ReturnType<typeof vi.fn>, cancels: ReturnType<typeof vi.fn>;
beforeEach(()=>{
 vi.useFakeTimers(); starts=vi.fn(); resumes=vi.fn().mockResolvedValue(undefined); suspends=vi.fn().mockResolvedValue(undefined); closes=vi.fn().mockResolvedValue(undefined); speaks=vi.fn(); cancels=vi.fn();
 const gain=()=>({gain:{value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()});
 class Context {state='running';currentTime=0;destination={};createGain=gain;createOscillator=()=>({type:'',frequency:{value:0},connect:vi.fn(),disconnect:vi.fn(),start:starts,stop:vi.fn(),onended:null});resume=resumes;suspend=suspends;close=closes}
 vi.stubGlobal('document',{hidden:false}); vi.stubGlobal('window',{AudioContext:Context,speechSynthesis:{speak:speaks,cancel:cancels}});
 vi.stubGlobal('SpeechSynthesisUtterance',class {lang='';rate=1;onend=null;onerror=null;constructor(public text:string){}});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()});
describe('game audio',()=>{
 it('starts only on gesture, avoids duplicate timers, stops on hide and closes',()=>{
  const a=new GameAudio(); a.configure(true,.25,false,true);expect(starts).not.toHaveBeenCalled();a.gesture();a.gesture();expect(starts).toHaveBeenCalledTimes(1);vi.advanceTimersByTime(650);expect(starts).toHaveBeenCalledTimes(2);a.hide();vi.advanceTimersByTime(1300);expect(starts).toHaveBeenCalledTimes(2);expect(suspends).toHaveBeenCalled();a.dispose();expect(closes).toHaveBeenCalledTimes(1);
 });
 it('obeys mute, voice permission, language and suppresses repeats',()=>{
  const a=new GameAudio();a.configure(true,.25,true,false);a.gesture();expect(starts).not.toHaveBeenCalled();a.speak('Hola','es',false);expect(speaks).not.toHaveBeenCalled();a.speak('Hola','es',true);expect(speaks).toHaveBeenCalledTimes(1);expect(speaks.mock.calls[0][0].lang).toBe('es-ES');a.speak('Hola','es',true);expect(speaks).toHaveBeenCalledTimes(2);a.configure(false,.25,true,false);expect(cancels).toHaveBeenCalled();a.dispose();
 });
});
it('pauses music while instructions speak and permits repeat on demand',()=>{const a=new GameAudio();a.configure(true,.5,false,true);a.gesture();a.speak('Trace','en',true);expect(suspends).toHaveBeenCalled();a.speak('Trace','en',true);expect(speaks).toHaveBeenCalledTimes(2);a.dispose()});
it('resumes an interrupted context synchronously and reports failures',async()=>{
 const failure=vi.fn();
 class Interrupted {state='interrupted';currentTime=0;destination={};createGain(){return {gain:{value:0,setValueAtTime:vi.fn()},connect:vi.fn()}} resume=resumes; close(){return Promise.resolve()} }
 vi.stubGlobal('window',{AudioContext:Interrupted});const a=new GameAudio(failure);a.configure(true,.25,false,true);a.gesture();expect(resumes).toHaveBeenCalledTimes(1);await vi.waitFor(()=>expect(failure).toHaveBeenCalled());a.dispose();
});
it('makes the legacy default volume audible without changing its saved value',()=>{
 const gains:{value:number}[]=[];class Context {state='running';currentTime=0;destination={};createGain(){const g={value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()};gains.push(g);return {gain:g,connect:vi.fn(),disconnect:vi.fn()}}createOscillator(){return {type:'',frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop:vi.fn()}}}
 vi.stubGlobal('window',{AudioContext:Context});const a=new GameAudio();a.configure(true,.25,false,true);a.gesture();expect(gains[0].value * .5).toBeCloseTo(.1);
});

it('uses explicit language-specific names for every letter and both cases',()=>{
 for(const [language,alphabet] of [['en','ABCDEFGHIJKLMNOPQRSTUVWXYZ'],['es','ABCDEFGHIJKLMNÑOPQRSTUVWXYZ']] as const) for(const c of alphabet) {expect(letterName(c,language)).toBeTruthy();expect(letterName(c.toLowerCase(),language)).toBe(letterName(c,language));}
 expect(letterName('W','en')).toBe('double you');expect(letterName('w','es')).toBe('uve doble');expect(letterName('ñ','es')).toBe('eñe');expect(letterName('Ñ','en')).toBeUndefined();
});
