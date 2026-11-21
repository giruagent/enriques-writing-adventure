/** One controller per mounted game. Music is scheduled only after a user gesture. */
export class GameAudio {
 private context: AudioContext | null = null;
 private gain: GainNode | null = null;
 private timer: ReturnType<typeof setInterval> | null = null;
 private nodes = new Set<OscillatorNode>();
 private index = 0;
 private lastSpeech = '';
 private lastSpeechAt = 0;
 private speaking = false;
 private generation = 0;
 private enabled = false;
 private volume = .25;

 configure(music: boolean, volume: number, muted: boolean, voice: boolean) {
  this.enabled = music && !muted;
  this.volume = volume;
  if (this.gain && this.context) this.gain.gain.setValueAtTime(this.volume * .12, this.context.currentTime);
  if (!this.enabled) this.stopMusic();
  if (muted || !voice) this.stopSpeech();
 }
 gesture() {
  if (!this.enabled || document.hidden) return;
  try {
   const Audio = window.AudioContext || (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
   if (!Audio) return;
   if (!this.context) {
    this.context = new Audio();
    this.gain = this.context.createGain();
    this.gain.gain.value = this.volume * .12;
    this.gain.connect(this.context.destination);
   }
   if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
   if (this.timer) return;
   this.note();
   this.timer = setInterval(() => this.note(), 650);
  } catch { /* Audio is optional. */ }
 }
 private note() {
  const c = this.context;
  if (!c || !this.gain || c.state !== 'running' || document.hidden) return;
  // An original, slow eight-note melody in C major.
  const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 329.63, 261.63];
  const o = c.createOscillator(); const envelope = c.createGain();
  o.type = 'sine'; o.frequency.value = melody[this.index++ % melody.length];
  envelope.gain.setValueAtTime(.001, c.currentTime);
  envelope.gain.linearRampToValueAtTime(.5, c.currentTime + .08);
  envelope.gain.exponentialRampToValueAtTime(.001, c.currentTime + .55);
  o.connect(envelope); envelope.connect(this.gain);
  this.nodes.add(o); o.onended = () => { this.nodes.delete(o); o.disconnect(); envelope.disconnect(); };
  o.start(); o.stop(c.currentTime + .56);
 }
 speak(text: string, language: 'en' | 'es', allowed: boolean) {
  if (!allowed || document.hidden || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
  const now = Date.now();
  if (this.speaking || (this.lastSpeech === text && now - this.lastSpeechAt < 8000)) return;
  try {
   const utterance = new SpeechSynthesisUtterance(text);
   utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
   utterance.rate = .9;
   const generation = this.generation;
   this.speaking = true; this.lastSpeech = text; this.lastSpeechAt = now;
   utterance.onend = utterance.onerror = () => { if (generation === this.generation) this.speaking = false; };
   window.speechSynthesis.speak(utterance);
  } catch { this.speaking = false; }
 }
 stopSpeech() { this.generation++; this.speaking = false; try { window.speechSynthesis?.cancel(); } catch {} }
 stopMusic() {
  if (this.timer) clearInterval(this.timer);
  this.timer = null;
  for (const node of this.nodes) { try { node.stop(); } catch {} }
  this.nodes.clear();
  if (this.context?.state === 'running') void this.context.suspend().catch(() => {});
 }
 hide() { this.stopMusic(); this.stopSpeech(); }
 dispose() { this.hide(); if (this.context) void this.context.close().catch(() => {}); this.context = null; this.gain = null; }
}
