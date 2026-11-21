import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GameAudio} from '../lib/audio';

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
  const a=new GameAudio();a.configure(true,.25,true,false);a.gesture();expect(starts).not.toHaveBeenCalled();a.speak('Hola','es',false);expect(speaks).not.toHaveBeenCalled();a.speak('Hola','es',true);expect(speaks).toHaveBeenCalledTimes(1);expect(speaks.mock.calls[0][0].lang).toBe('es-ES');a.speak('Hola','es',true);expect(speaks).toHaveBeenCalledTimes(1);a.configure(false,.25,true,false);expect(cancels).toHaveBeenCalled();a.dispose();
 });
});
