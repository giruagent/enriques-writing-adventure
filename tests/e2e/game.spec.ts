import {test, expect, type Page} from '@playwright/test';
import {paths} from '../../lib/game';

async function draw(page: Page, strokes: {x:number;y:number}[][]) {
  const pad = page.getByRole('application');
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw Error('pad missing');
  for (const stroke of strokes) {
    await page.mouse.move(box.x + box.width * stroke[0].x / 100, box.y + box.height * stroke[0].y / 100);
    await page.mouse.down();
    for (const p of stroke.slice(1)) await page.mouse.move(box.x + box.width * p.x / 100, box.y + box.height * p.y / 100, {steps:10});
    await page.mouse.up();
  }
}

test('guided exercise rejects a tap and random line, and keeps strokes across orientation changes', async ({page}) => {
  await page.goto('./');
  await page.getByRole('button', {name:/Letter Meadow/}).click();
  await draw(page, [[{x:30,y:18}]]);
  await page.getByRole('button', {name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toContainText('Nice try');
  await page.getByRole('button', {name:'Clear'}).click();
  await draw(page, [[{x:5,y:5},{x:95,y:95}]]);
  await page.getByRole('button', {name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toContainText('Nice try');
  await page.getByRole('button', {name:'Clear'}).click();
  await draw(page, [paths.E[0]]);
  const stroke = page.locator('svg.pad > path[stroke="#253b75"]');
  const before = await stroke.first().getAttribute('d');
  await page.setViewportSize({width:1024,height:768});
  await expect(stroke).toHaveCount(1);
  await expect(stroke.first()).toHaveAttribute('d', before!);
  await draw(page, paths.E.slice(1));
  await page.getByRole('button', {name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toContainText('Wonderful writing!');
  await expect(page.getByRole('button', {name:'Check my writing'})).toBeDisabled();
  await expect(page.getByRole('button', {name:'Clear'})).toBeDisabled();
  await page.getByRole('button', {name:'Check my writing'}).dispatchEvent('click');
  await expect(page.getByRole('status')).toContainText('Wonderful writing!');
  await draw(page, [[{x:5,y:5},{x:95,y:95}]]);
  await expect(stroke).toHaveCount(paths.E.length);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('enrique-adventure-v1') || '{}').history?.length)).toBe(1);
  await page.getByRole('button', {name:'Continue'}).click();
  await expect(page.getByRole('application', {name:'Write n'})).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('enrique-adventure-v1') || '{}').history?.[0]?.method)).toBe('guided');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('export installs and reloads offline at its configured scope', async ({page, context, baseURL}) => {
  const failed: string[] = [];
  page.on('response', response => {if (response.status() >= 400) failed.push(response.url());});
  await page.goto('./');
  await expect(page.getByText('Hello, Enrique!')).toBeVisible();
  const base = new URL(baseURL!).pathname;
  const manifest = await page.evaluate(async () => (await fetch(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href)).json());
  expect(manifest.start_url).toBe(base);
  expect(manifest.scope).toBe(base);
  expect(manifest.icons.map((icon: {src:string}) => icon.src)).toEqual([`${base}icon-192.png`, `${base}icon-512.png`]);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open('enrique-v1.8.0-house-webp');
    const resources = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel=stylesheet]')].map(el => el instanceof HTMLScriptElement ? el.src : el.href).filter(url => url.includes('/_next/static/'));
    return resources.some(url => url.endsWith('.js')) && resources.some(url => url.endsWith('.css')) && (await Promise.all(resources.map(url => cache.match(url)))).every(Boolean);
  })).toBe(true);
  expect(failed).toEqual([]);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Hello, Enrique!')).toBeVisible();
  await page.getByRole('button', {name:/Letter Meadow/}).click();
  await draw(page, paths.E);
  await page.getByRole('button', {name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toContainText('Wonderful writing!');
});

test('adult review and direct access', async ({page}) => {
  await page.goto('./');
  await expect(page.getByRole('button',{name:/Diamond Trail/})).toBeDisabled();
  const gate=page.getByRole('button',{name:/Grown-ups/});
  await gate.dispatchEvent('pointerdown'); await page.waitForTimeout(2100); await gate.dispatchEvent('pointerup');
  await page.getByRole('button',{name:'Name Mountain'}).click();
  await draw(page, [[{x:20,y:20},{x:60,y:60}]]);
  await page.getByRole('button',{name:'Ask a grown-up to check'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Yes, this is ready!'}).click();
  await expect(page.getByText('Amazing! Level complete!')).toBeVisible();
});

test('hidden letter keeps context without revealing the answer', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('enrique-adventure-v1', JSON.stringify({unlocked:3, completed:[], history:[]})));
  await page.goto('./');
  await page.getByRole('button',{name:/Mystery Grove/}).click();
  await draw(page, paths.E);
  await page.getByRole('button',{name:'Check my writing'}).click();
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.locator('.exercise-copy h1')).toHaveText('?');
  await expect(page.getByRole('application')).toHaveAttribute('aria-label','Write the missing letter in the box.');
  await expect(page.locator('.letter-row')).toContainText('E');
  await page.getByText('Show the full name').click();
  await expect(page.locator('details p')).toHaveText('Enrique');
});

test('pointer fallback, endpoint and cancellation preserve only finished strokes', async ({page}) => {
 await page.goto('./'); await page.getByRole('button',{name:/Letter Meadow/}).click();
 const pad=page.getByRole('application');
 await pad.evaluate(el => {
   const box=el.getBoundingClientRect();
   const fire=(type:string,x:number,y:number)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:9,clientX:box.left+box.width*x/100,clientY:box.top+box.height*y/100}));
   // Synthetic events cannot be captured by the browser.
   (el as SVGElement).setPointerCapture=()=>{};
   const original=PointerEvent.prototype.getCoalescedEvents;
   PointerEvent.prototype.getCoalescedEvents=()=>[];
   fire('pointerdown',10,10); fire('pointermove',30,30); fire('pointerup',50,50);
   fire('pointerdown',60,60); fire('pointermove',70,70); fire('pointercancel',70,70);
   PointerEvent.prototype.getCoalescedEvents=original;
 });
 const strokes=page.locator('svg.pad > path[stroke="#253b75"]');
 await expect(strokes).toHaveCount(1);
 const d=await strokes.first().getAttribute('d');
 expect(d).toMatch(/30(?:\.\d+)? 30/); expect(d).toMatch(/50(?:\.\d+)? 50/);
});

test('audio settings migrate, invoke playback and voice, and mute persists with progress', async ({page}) => {
 await page.addInitScript(() => {
  localStorage.setItem('enrique-adventure-v1', JSON.stringify({unlocked:2,completed:[1],history:[],sessions:4,settings:{language:'es',speech:true,mute:false}}));
  const w=window as typeof window & {audioEvents:string[]}; w.audioEvents=[];
  class FakeAudio {
   state='running'; currentTime=0; destination={};
   createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
   createOscillator(){return {type:'',frequency:{value:0},connect(){},disconnect(){},start(){w.audioEvents.push('start')},stop(){},onended:null}}
   resume(){w.audioEvents.push('resume');return Promise.resolve()} suspend(){w.audioEvents.push('suspend');return Promise.resolve()} close(){return Promise.resolve()}
  }
  Object.defineProperty(window,'AudioContext',{value:FakeAudio});
  Object.defineProperty(window,'speechSynthesis',{value:{speak:(u:SpeechSynthesisUtterance)=>w.audioEvents.push('speak:'+u.lang+':'+u.text),cancel:()=>w.audioEvents.push('cancel')}});
 });
 await page.goto('./');
 await expect(page.getByRole('button',{name:/Camino de diamantes/})).toBeEnabled();
 await page.getByRole('button',{name:/Pradera de letras/}).click();
 await expect.poll(()=>page.evaluate(()=>(window as typeof window & {audioEvents:string[]}).audioEvents)).toContain('start');
 await page.getByRole('button',{name:'Revisar mi escritura'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as typeof window & {audioEvents:string[]}).audioEvents.some(e=>e.startsWith('speak:es-ES:')))).toBe(true);
 await page.getByRole('button',{name:'Sonido',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as typeof window & {audioEvents:string[]}).audioEvents)).toContain('suspend');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).settings.mute)).toBe(true);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!));
 expect(saved.completed).toEqual([1]); expect(saved.unlocked).toBe(2); expect(saved.settings.musicVolume).toBe(.25);
});

test('spoken feedback follows review, success and victory', async ({page}) => {
 await page.addInitScript(() => {
  localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:5,completed:[1,2,3,4],history:[],settings:{speech:true,music:false}}));
  const w=window as typeof window & {spoken:string[]}; w.spoken=[];
  Object.defineProperty(window,'speechSynthesis',{value:{speak:(u:SpeechSynthesisUtterance)=>{w.spoken.push(u.text);setTimeout(()=>u.onend?.({} as SpeechSynthesisEvent),0)},cancel:()=>{}}});
 });
 await page.goto('./');
 await page.getByRole('button',{name:/Scribble Dragon/}).click();
 for(const letter of ['E','n','r','i','q','u','e']) {
  await draw(page,paths[letter]);
  await page.getByRole('button',{name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('button',{name:'Continue'}).click();
 }
 await draw(page,[[{x:20,y:20},{x:60,y:60}]]);
 await page.getByRole('button',{name:'Ask a grown-up to check'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as typeof window & {spoken:string[]}).spoken)).toContain('Look at the writing together. Is this a good attempt at the requested letter or name?');
 await page.waitForTimeout(30);
 await page.getByRole('button',{name:'Yes, this is ready!'}).click();
 await page.waitForTimeout(30);
 await page.getByRole('button',{name:'Continue'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as typeof window & {spoken:string[]}).spoken.some(s=>s.includes('Your writing adventure made')))).toBe(true);
});

test('name changes require confirmation and sections practice real guides', async ({page}) => {
 await page.goto('./');
 const gate=page.getByRole('button',{name:/Grown-ups/});
 await gate.dispatchEvent('pointerdown'); await page.waitForTimeout(2100); await gate.dispatchEvent('pointerup');
 const input=page.getByLabel('Child’s name'); await input.fill('José'); await page.getByRole('button',{name:'Change name'}).click();
 await expect(page.getByText('Please enter 1–20 letters A–Z or Ñ.')).toBeVisible();
 await input.fill('AL'); await page.getByRole('button',{name:'Change name'}).click();
 await expect(page.getByRole('dialog')).toContainText('resets'); await page.getByRole('dialog').getByRole('button',{name:'Yes, reset'}).click();
 await page.getByLabel('Name practice case').selectOption('lower'); await page.getByRole('button',{name:'Close'}).click();
 await expect(page.getByText('Hello, Al!')).toBeVisible(); await page.getByRole('button',{name:/Letter Meadow/}).click();
 await expect(page.locator('.exercise-copy h1')).toHaveText('a'); await draw(page,paths.a); await page.getByRole('button',{name:'Check my writing'}).click(); await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.locator('.exercise-copy h1')).toHaveText('l'); await draw(page,paths.l); await page.getByRole('button',{name:'Check my writing'}).click(); await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.getByRole('button',{name:/Diamond Trail/})).toBeEnabled();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); expect((await page.locator('.glyph-grid button').allTextContents()).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); await page.getByRole('button',{name:'Lowercase'}).click(); expect((await page.locator('.glyph-grid button').allTextContents()).join('')).toBe('abcdefghijklmnopqrstuvwxyz'); await page.getByRole('button',{name:'z',exact:true}).click(); await draw(page,paths.z); await page.getByRole('button',{name:'Check my writing'}).click(); await expect(page.getByRole('status')).toContainText('Wonderful writing');
 await page.getByRole('button',{name:'Back to map'}).click(); await page.getByRole('button',{name:'Numbers',exact:true}).click(); await page.getByRole('button',{name:'8',exact:true}).click(); await draw(page,paths['8']); await page.getByRole('button',{name:'Check my writing'}).click(); await expect(page.getByRole('status')).toBeVisible();
 await page.reload(); await expect(page.getByText('Hello, Al!')).toBeVisible(); await expect(page.getByText(/v1.8.0/)).toBeVisible();
});

test('all five worlds scale to a changed name and retain honest review', async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'Al',caseMode:'title',unlocked:1,completed:[],history:[],settings:{music:false,speech:false}})));
 await page.goto('./');
 const guided=async (c:string)=>{await draw(page,paths[c]);await page.getByRole('button',{name:'Check my writing'}).click();await expect(page.getByRole('status')).toBeVisible();await page.getByRole('button',{name:'Continue'}).click()};
 const reviewed=async ()=>{await draw(page,[[{x:20,y:20},{x:60,y:60}]]);await page.getByRole('button',{name:'Ask a grown-up to check'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Yes, this is ready!'}).click();await page.getByRole('button',{name:'Continue'}).click()};
 await page.getByRole('button',{name:/Letter Meadow/}).click();await guided('A');await guided('l');
 await page.getByRole('button',{name:/Diamond Trail/}).click();await guided('A');await guided('l');
 await page.getByRole('button',{name:/Mystery Grove/}).click();await guided('A');await reviewed();
 await page.getByRole('button',{name:/Name Mountain/}).click();await expect(page.locator('.exercise-copy h1')).toHaveText('Al');await reviewed();
 await page.getByRole('button',{name:/Scribble Dragon/}).click();await guided('A');await guided('l');await reviewed();
 await expect(page.getByText('You did it, Al!')).toBeVisible();
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!));expect(progress.completed).toEqual([1,2,3,4,5]);expect(progress.history.filter((h:{method:string})=>h.method==='adult')).toHaveLength(3);
});

test('music produces a real nonzero Web Audio signal after a gesture', async ({page})=>{
 await page.addInitScript(()=>{
  const Original=window.AudioContext;
  class ObservedAudio extends Original {
   private first=true;
   createGain(){const node=super.createGain();if(this.first){this.first=false;const analyser=this.createAnalyser();node.connect(analyser);analyser.connect(this.destination);(window as typeof window & {musicAnalyser:AnalyserNode}).musicAnalyser=analyser}return node}
  }
  Object.defineProperty(window,'AudioContext',{value:ObservedAudio});
 });
 await page.goto('./');await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>{const a=(window as typeof window & {musicAnalyser?:AnalyserNode}).musicAnalyser;if(!a)return 0;const samples=new Float32Array(a.fftSize);a.getFloatTimeDomainData(samples);return Math.max(...samples.map(Math.abs))}),{timeout:5000,intervals:[100]}).toBeGreaterThan(.001);
});

test('Spanish alphabet places Ñ after N and selects both cases; English ordering remains intact', async ({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:'es',music:false,speech:false}})));
 await page.goto('./');
 await page.getByRole('button',{name:'Abecedario',exact:true}).click();
 let labels=await page.locator('.glyph-grid button').allTextContents();
 expect(labels.join('')).toBe('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ');
 await page.getByRole('button',{name:'Ñ',exact:true}).click();
 await expect(page.locator('.exercise h1')).toHaveText('Ñ');
 await page.getByRole('button',{name:/Volver al mapa/}).click();
 await page.getByRole('button',{name:'Minúsculas'}).click();
 labels=await page.locator('.glyph-grid button').allTextContents();expect(labels.join('')).toBe('abcdefghijklmnñopqrstuvwxyz');
 await page.getByRole('button',{name:'ñ',exact:true}).click();await expect(page.locator('.exercise h1')).toHaveText('ñ');
});

test('settings unmute resumes interrupted audio during the gesture and reports failure', async ({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{mute:true,music:true,musicVolume:.25,speech:false}}));
  const w=window as typeof window & {resumeCalls:number};w.resumeCalls=0;
  class InterruptedContext {state='interrupted';currentTime=0;destination={};createGain(){return {gain:{value:0,setValueAtTime(){}},connect(){}}}resume(){w.resumeCalls++;return Promise.reject(new Error('blocked'))}close(){return Promise.resolve()}}
  Object.defineProperty(window,'AudioContext',{value:InterruptedContext});
 });
 await page.goto('./');
 const parent=page.getByRole('button',{name:/Grown-ups: hold to open/});await parent.dispatchEvent('pointerdown');await page.waitForTimeout(2100);await parent.dispatchEvent('pointerup');
 await page.getByRole('checkbox',{name:'Sound',exact:true}).check();
 expect(await page.evaluate(()=>(window as typeof window & {resumeCalls:number}).resumeCalls)).toBeGreaterThan(0);
 await expect(page.locator('.game [role=alert]')).toContainText('Music could not start');
});

test('offline upgrade uses the active cache while preserving the old cache', async ({page, context, baseURL})=>{
 await page.goto('./'); await page.evaluate(async()=>{await navigator.serviceWorker.ready; for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); for(const k of await caches.keys()) await caches.delete(k)});
 await page.evaluate(async (base)=>{const old=await caches.open('enrique-v4');await old.put(base,new Response('<html>OLD VERSION</html>',{headers:{'Content-Type':'text/html'}}))},new URL(baseURL!).pathname);
 await page.reload(); await page.evaluate(()=>navigator.serviceWorker.ready); await page.reload();
 await context.setOffline(true); await page.reload();
 await expect(page.getByText('Hello, Enrique!')).toBeVisible();
 expect(await page.evaluate(()=>caches.has('enrique-v4'))).toBe(true);
});

for(const language of ['en','es'] as const) test(`custom name caption and guided speech in ${language}`,async ({page})=>{
 await page.addInitScript((lang)=>{localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'Al',unlocked:4,completed:[],history:[],settings:{language:lang,music:false,speech:true}}));const w=window as typeof window & {spoken:string[]};w.spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{speak:(u:SpeechSynthesisUtterance)=>w.spoken.push(u.lang+':'+u.text),cancel:()=>{}}})},language);
 await page.goto('./'); await page.getByRole('button',{name:language==='en'?/Name Mountain/:/Montaña del nombre/}).click();
 await expect(page.locator('.pad-caption')).toContainText('Al');
 await page.getByRole('button',{name:language==='en'?/Back to map/:/Volver al mapa/}).click();
 await page.getByRole('button',{name:language==='en'?'Alphabet':'Abecedario',exact:true}).click(); await page.getByRole('button',{name:'B',exact:true}).click();
 const spoken=()=>page.evaluate(()=>(window as typeof window & {spoken:string[]}).spoken);
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write B. Start at the numbered markers and follow the path.':'es-ES:Escribe B. Empieza en los números y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?'Speak instructions':'Leer instrucciones'}).click();
 await expect.poll(async()=>(await spoken()).filter(s=>s.includes('B.')).length).toBe(2);
 await draw(page,paths.B);await page.getByRole('button',{name:language==='en'?'Check my writing':'Revisar mi escritura'}).click();await page.getByRole('button',{name:language==='en'?'Continue':'Continuar'}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write C. Start at the numbered markers and follow the path.':'es-ES:Escribe C. Empieza en los números y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?/Back to map/:/Volver al mapa/}).click();
 await page.getByRole('button',{name:language==='en'?'Numbers':'Números',exact:true}).click(); await page.getByRole('button',{name:'2',exact:true}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write 2. Start at the numbered markers and follow the path.':'es-ES:Escribe 2. Empieza en los números y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?'Speak instructions':'Leer instrucciones'}).click();
 await expect.poll(async()=>(await spoken()).filter(s=>s.includes('2.')).length).toBe(2);
 await draw(page,paths['2']);await page.getByRole('button',{name:language==='en'?'Check my writing':'Revisar mi escritura'}).click();await page.getByRole('button',{name:language==='en'?'Continue':'Continuar'}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write 3. Start at the numbered markers and follow the path.':'es-ES:Escribe 3. Empieza en los números y sigue el camino.');
});

test('a one-character name has a hidden exercise requiring adult review',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'A',unlocked:3,completed:[],history:[],settings:{music:false,speech:false}})));
 await page.goto('./');await page.getByRole('button',{name:/Mystery Grove/}).click();
 await expect(page.locator('.exercise-copy h1')).toHaveText('?');
 await draw(page,[[{x:20,y:20},{x:60,y:60}]]);await page.getByRole('button',{name:'Ask a grown-up to check'}).click();await page.getByRole('button',{name:'Yes, this is ready!'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history[0].method)).toBe('adult');
});

test('sequential alphabet and numbers levels grow their own progress after real traces', async ({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('enrique-adventure-v1'))localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'Al',unlocked:1,completed:[],history:[],settings:{music:false,speech:false}}))});
 await page.goto('./');
 for(const [section,characters] of [['Alphabet','ABC'],['Numbers','012']] as const){
  await page.getByRole('button',{name:section,exact:true}).click();
  await page.getByRole('button',{name:/^Level 1 /}).click();
  await expect(page.getByText('How to draw')).toBeVisible();
  await draw(page,[[{x:4,y:4},{x:95,y:95}]]);
  await page.getByRole('button',{name:'Check my writing'}).click();
  await expect(page.getByRole('status')).toContainText('Nice try');
  await page.getByRole('button',{name:'Clear'}).click();
  for(const character of characters){
   await draw(page,paths[character]);
   await page.getByRole('button',{name:'Check my writing'}).click();
   await expect(page.getByRole('status')).toContainText(character===characters.at(-1)?'Amazing! Level complete!':'Wonderful writing');
   await page.getByRole('button',{name:'Continue'}).click();
  }
  await expect(page.getByRole('button',{name:/^Level 2 /})).toBeEnabled();
 }
 await expect(page.locator('.alien-progress figcaption')).toContainText('1 / 10');
 await page.reload();
 await expect(page.locator('.name-house figcaption')).toContainText('0 / 10');
 await page.getByRole('button',{name:'Numbers',exact:true}).click();
 await expect(page.locator('.alien-progress figcaption')).toContainText('1 / 10');
});

test('Spanish first-level tutorial can be hidden and replayed without blocking drawing',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:'es',music:false,speech:false}})));
 await page.goto('./');await page.getByRole('button',{name:'Números',exact:true}).click();
 await page.getByRole('button',{name:/^Nivel 1 /}).click();
 await expect(page.getByText(/Pon el dedo en el inicio marcado/)).toBeVisible();
 await page.getByRole('button',{name:'Ocultar pasos'}).click();
 await expect(page.getByText(/Pon el dedo en el inicio marcado/)).toBeHidden();
 await page.getByRole('button',{name:'Escuchar los pasos'}).click();
 await expect(page.getByText(/Pon el dedo en el inicio marcado/)).toBeVisible();
 await draw(page,paths['0']);await page.getByRole('button',{name:'Revisar mi escritura'}).click();
 await expect(page.getByRole('status')).toContainText('¡Qué bien escribes!');
});

test('map counter and repeated name sequence track actual progress',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'Al',unlocked:6,completed:[1,2,3,4,5],history:[],settings:{music:false,speech:false}})));
 await page.goto('./');
 await expect(page.locator('.section-heading .progress-pill')).toHaveText('Name Adventure: 5 / 10');
 await page.getByRole('button',{name:/Rainbow Letters/}).click();
 await expect(page.locator('.letter-row')).toHaveText('AAl');
 await expect(page.locator('.letter-row .current')).toHaveText('A');
 await draw(page,paths.A); await page.getByRole('button',{name:'Check my writing'}).click(); await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.locator('.letter-row .current')).toHaveText('A');
 await expect(page.locator('.letter-row .current')).toHaveCount(1);
 await expect(page.locator('.letter-row span').nth(1)).toHaveClass('current');
});

test('alphabet and number exercises appear in parent history',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{music:false,speech:false}})));
 await page.goto('./');
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await page.getByRole('button',{name:/Level 1/}).first().click();
 await draw(page,paths.A); await page.getByRole('button',{name:'Check my writing'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history.length)).toBe(1);
 await page.getByRole('button',{name:/Back to map/}).click();
 await page.getByRole('button',{name:'Numbers',exact:true}).click();
 await page.getByRole('button',{name:/Level 1/}).first().click();
 await draw(page,paths['0']); await page.getByRole('button',{name:'Check my writing'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history.length)).toBe(2);
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!));
 expect(p.history.map((h:{section:string})=>h.section)).toEqual(['alphabet','numbers']); expect(p.completed).toEqual([]); expect(p.unlocked).toBe(1);
 const parent=page.getByRole('button',{name:/Grown-ups: hold to open/}); await parent.dispatchEvent('pointerdown'); await page.waitForTimeout(2100); await parent.dispatchEvent('pointerup');
 await expect(page.locator('.history')).toContainText('Alphabet'); await expect(page.locator('.history')).toContainText('Numbers');
});

test('alphabet letter replay uses the current language and respects mute', async ({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:'es',music:false,speech:true}}));const w=window as typeof window & {replayed:string[]};w.replayed=[];Object.defineProperty(window,'speechSynthesis',{value:{speak:(u:SpeechSynthesisUtterance)=>w.replayed.push(u.lang+':'+u.text),cancel:()=>{}}})});
 await page.goto('./');await page.getByRole('button',{name:'Abecedario',exact:true}).click();await page.getByRole('button',{name:'Ñ',exact:true}).click();
 const replay=page.getByRole('button',{name:'Escuchar letra: Ñ'});await replay.click();await replay.click();
 expect((await page.evaluate(()=>(window as typeof window & {replayed:string[]}).replayed)).slice(-2)).toEqual(['es-ES:eñe','es-ES:eñe']);
 await page.getByRole('button',{name:'Sonido',exact:true}).click();const count=await page.evaluate(()=>(window as typeof window & {replayed:string[]}).replayed.length);await replay.click();expect(await page.evaluate(()=>(window as typeof window & {replayed:string[]}).replayed.length)).toBe(count);
});

test('dragon stages, real completion, replay, speech and offline persistence',async({page,context,baseURL})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{const w=window as typeof window & {spoken:string[]};w.spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{speak:(u:SpeechSynthesisUtterance)=>w.spoken.push(u.text),cancel:()=>{}}})});
 await page.goto('./'); await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 0 / 10');
 await expect(page.locator('.dragon-picture img')).toHaveCount(0);
 for(let replay=0;replay<2;replay++){
  await page.getByRole('button',{name:/^Level 1 /}).click();
  for(const [i,c] of [...'ABC'].entries()){
   await draw(page,paths[c]); await page.getByRole('button',{name:'Check my writing'}).click();
   if(i<2) await expect(page.locator('.celebration')).toHaveCount(0);
   else {await expect(page.locator('.celebration')).toContainText('¡Increíble!');await expect(page.locator('.celebration button')).toBeVisible();expect(await page.locator('.celebration').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');await expect.poll(()=>page.evaluate(()=>(window as typeof window & {spoken:string[]}).spoken.some(s=>s.includes('Amazing! Level complete!')))).toBe(true)}
   await page.getByRole('button',{name:'Continue'}).click();
  }
  await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 1 / 10');
  await expect(page.locator('.dragon-picture img')).toHaveAttribute('src',/stage-1\.png$/);
 }
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).levels.alphabet)).toEqual([1]);
 const base=new URL(baseURL!).pathname;
 expect(await page.evaluate(async base=>{const c=await caches.open('enrique-v1.8.0-house-webp');return (await Promise.all(Array.from({length:10},(_,i)=>c.match(`${base}dragon/stage-${i+1}.png`)))).every(Boolean)},base)).toBe(true);
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 1 / 10');
 await expect.poll(()=>page.locator('.dragon-picture img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
});

test('completed alphabet shows final dragon while other sections keep their own progress',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],levels:{name:[],alphabet:[1,2,3,4,5,6,7,8,9,10],numbers:[]}})));
 await page.goto('./');await expect(page.locator('.name-house')).toBeVisible();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 10 / 10');await expect(page.locator('.dragon-picture img')).toHaveAttribute('src',/stage-10\.png$/);await expect(page.locator('.mansion')).toHaveCount(0);
 await page.getByRole('button',{name:'Numbers',exact:true}).click();await expect(page.locator('.alien-progress')).toBeVisible();await expect(page.locator('.dragon-progress')).toHaveCount(0);
});

test('guided fallback requires a real drawing, arithmetic gate and explicit adult approval', async ({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],levels:{alphabet:[],name:[],numbers:[]},settings:{music:false,speech:false}})));
 await page.goto('./'); await page.getByRole('button',{name:'Alphabet',exact:true}).click(); await page.getByRole('button',{name:/^Level 1 /}).click();
 const check=page.getByRole('button',{name:'Check my writing'}), fallback=page.getByRole('button',{name:'Ask a grown-up to review'});
 await check.click(); await expect(fallback).toHaveCount(0);
 await draw(page,[[{x:30,y:30}]]); await check.click(); await expect(fallback).toHaveCount(0);
 await page.getByRole('button',{name:'Clear'}).click(); await draw(page,[[{x:20,y:20},{x:70,y:70}]]); await check.click();
 await expect(fallback).toBeVisible(); await fallback.click(); await page.getByRole('button',{name:'6',exact:true}).click();
 await expect(page.getByText('Try again.',{exact:true})).toBeVisible(); await expect(page.getByRole('button',{name:'Yes, this is ready!'})).toHaveCount(0);
 await page.getByRole('button',{name:'7',exact:true}).click(); await expect(page.getByRole('dialog',{name:'Grown-up review'})).toBeVisible();
 await expect(page.locator('svg.pad > path[stroke="#253b75"]')).toHaveCount(1); await expect(page.getByText(/does not recognize/i)).toBeVisible();
 await page.getByRole('button',{name:'Let’s try again'}).click(); await expect(fallback).toBeVisible();
 await fallback.click(); await page.getByRole('button',{name:'7',exact:true}).click(); await page.getByRole('button',{name:'Yes, this is ready!'}).evaluate((button: HTMLButtonElement)=>{button.click();button.click()});
 await expect(page.getByRole('status')).toContainText('Wonderful writing');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history.length)).toBe(1);
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history); expect(history[0]).toMatchObject({section:'alphabet',world:1,exercise:'A',method:'adult'});
 await page.getByRole('button',{name:'Continue'}).click();
 for(const c of ['B','C']){await draw(page,paths[c]);await check.click();await page.getByRole('button',{name:'Continue'}).click()}
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!));expect(p.levels.alphabet).toEqual([1]);expect(p.history).toHaveLength(3);
});

test('level 10 adult review celebrates once and replay keeps dragon growth', async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],levels:{alphabet:[1,2,3,4,5,6,7,8,9],name:[],numbers:[]},settings:{music:false,speech:false}})));
 await page.goto('./');await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 for(let run=0;run<2;run++){
  await page.getByRole('button',{name:/^Level 10 /}).click();
  for(const c of ['A','B']){await draw(page,paths[c]);await page.getByRole('button',{name:'Check my writing'}).click();await page.getByRole('button',{name:'Continue'}).click()}
  await draw(page,[[{x:20,y:20},{x:70,y:70}]]);await page.getByRole('button',{name:'Check my writing'}).click();await page.getByRole('button',{name:'Ask a grown-up to review'}).click();await page.getByRole('button',{name:'7',exact:true}).click();await page.getByRole('button',{name:'Yes, this is ready!'}).click();
  await expect(page.locator('.celebration')).toContainText('Amazing! Level complete!');await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.locator('.dragon-picture img')).toHaveAttribute('src',/stage-10\.png$/);
 }
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!));expect(p.levels.alphabet).toEqual([1,2,3,4,5,6,7,8,9,10]);expect(p.history).toHaveLength(6);expect(p.history.filter((h:{method:string})=>h.method==='adult')).toHaveLength(2);
});

test('Spanish guided review explains the adult decision',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:'es',music:false,speech:false}})));
 await page.goto('./');await page.getByRole('button',{name:'Números',exact:true}).click();await page.getByRole('button',{name:/^Nivel 1 /}).click();
 await draw(page,[[{x:15,y:15},{x:80,y:80}]]);await page.getByRole('button',{name:'Revisar mi escritura'}).click();await page.getByRole('button',{name:'Pide a un adulto que revise'}).click();await page.getByRole('button',{name:'7',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Revisión de un adulto'})).toContainText('La aplicación no reconoce esta escritura');
 await page.getByRole('button',{name:'¡Sí, está listo!'}).click();await expect(page.getByRole('status')).toContainText('¡Qué bien escribes!');
});

test('all ten dragon stage images decode while offline',async({page,context,baseURL})=>{
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);
 const base=new URL(baseURL!).pathname;
 const sizes=await page.evaluate(async base=>Promise.all(Array.from({length:10},(_,i)=>new Promise<number>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth);img.onerror=()=>reject(new Error(`stage ${i+1} unavailable offline`));img.src=`${base}dragon/stage-${i+1}.png`}))),base);
 expect(sizes).toHaveLength(10);expect(sizes.every(size=>size>0)).toBe(true);
});

test('name house artwork, offline cache and reduced motion', async ({page,context,baseURL})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:3,completed:[1,2],history:[],levels:{name:[2],alphabet:[1],numbers:[1]}})));
 await page.goto('./');
 await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 2 / 10');
 await expect(page.locator('.name-house img')).toHaveAttribute('src',/casa_nivel_02\.webp$/);
 expect(await page.locator('.page-transition').evaluate(e=>e.getAnimations().length)).toBe(0);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 const base=new URL(baseURL!).pathname;
 expect(await page.evaluate(async base=>{const c=await caches.open('enrique-v1.8.0-house-webp');return (await Promise.all(Array.from({length:10},(_,i)=>c.match(`${base}name-house/casa_nivel_${String(i+1).padStart(2,'0')}.webp`)))).every(Boolean)},base)).toBe(true);
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); await expect(page.locator('.dragon-progress')).toBeVisible(); await expect(page.locator('.name-house')).toHaveCount(0);
 await page.getByRole('button',{name:'Numbers',exact:true}).click(); await expect(page.locator('.alien-progress')).toBeVisible();
 await context.setOffline(true); await page.reload(); await expect(page.locator('.name-house img')).toBeVisible();
 expect(await page.locator('.name-house img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBe(838);
 const widths=await page.evaluate(async base=>Promise.all(Array.from({length:10},(_,i)=>new Promise<number>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth);img.onerror=()=>reject(new Error('House unavailable offline'));img.src=`${base}name-house/casa_nivel_${String(i+1).padStart(2,'0')}.webp`}))),base);
 expect(widths).toEqual(Array(10).fill(838));
});

test('rapid section navigation leaves a usable latest screen',async({page})=>{
 await page.goto('./');
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await page.getByRole('button',{name:'Numbers',exact:true}).click();
 await page.getByRole('button',{name:'Name Adventure',exact:true}).click();
 await expect(page.locator('.name-house')).toBeVisible();
 await page.getByRole('button',{name:/Letter Meadow/}).click();
 await expect(page.getByRole('application',{name:'Write E'})).toBeVisible();
});

test('reduced motion disables root smooth scrolling', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('./');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

for (const language of ['en', 'es'] as const) {
  test(`total stars remain distinct from section progress (${language})`, async ({page}) => {
    await page.addInitScript(lang => localStorage.setItem('enrique-adventure-v1', JSON.stringify({
      unlocked:3, completed:[1,2], history:[], levels:{name:[1,2], alphabet:[1], numbers:[1,2,3]}, settings:{language:lang}
    })), language);
    await page.goto('./');
    const total = language === 'en' ? 'Total stars across all adventures: 6 / 30' : 'Estrellas totales de todas las aventuras: 6 / 30';
    await expect(page.getByRole('img',{name:total})).toHaveCount(1);
    await expect(page.locator('.section-heading .progress-pill')).toHaveText(language === 'en' ? 'Name Adventure: 2 / 10' : 'Aventura del nombre: 2 / 10');
    await page.getByRole('button',{name:language === 'en' ? 'Alphabet' : 'Abecedario',exact:true}).click();
    await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label', language === 'en' ? 'Alphabet dragon: 1 / 10' : 'Dragón del abecedario: 1 / 10');
    await page.getByRole('button',{name:/^(Level|Nivel) 1 /}).first().click();
    await expect(page.getByRole('img',{name:total})).toHaveCount(2);
  });
}

test('numbered guides and replay remain usable on phone and tablet', async ({page}, testInfo) => {
 for (const [name,width,height] of [['iphone',390,844],['ipad',768,1024]] as const) {
  await page.setViewportSize({width,height});
  await page.goto('./');
  await page.getByRole('button',{name:/Letter Meadow/}).click();
  const pad=page.getByRole('application',{name:'Write E'});
  await expect(page.getByText('4 strokes',{exact:false})).toBeVisible();
  await expect(pad.locator('text')).toHaveText(['1','2','3','4']);
  const numberBox=await pad.locator('text').first().boundingBox(); expect(numberBox!.height).toBeGreaterThanOrEqual(16);
  expect(await pad.locator('g').first().getAttribute('pointer-events')).toBe('none');
  await expect(page.getByRole('button',{name:/Watch how to write/})).toBeVisible();
  await page.locator('.writing-area').scrollIntoViewIfNeeded();
  await testInfo.attach(`${name}-exercise`,{body:await page.screenshot(),contentType:'image/png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Watch how to write/}).click();
  await expect(page.getByRole('img',{name:'Demonstration of E, 4 strokes'})).toBeVisible();
  await draw(page,[paths.E[0]]);
  await expect(page.locator('svg.pad > path[stroke="#253b75"]')).toHaveCount(1);
 }
});

test('reduced motion replay is static and Spanish instructions explain lifting',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:'es'}})));
 await page.goto('./');await page.getByRole('button',{name:/Pradera de letras/}).click();
 await expect(page.getByText(/Levanta el dedo entre trazos/)).toBeVisible();
 await page.getByRole('button',{name:/Ver cómo se escribe/}).click();
 const paths=page.locator('.demo-stroke');await expect(paths).toHaveCount(4);
 expect(await paths.first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(await paths.first().evaluate(el=>getComputedStyle(el).strokeDashoffset)).toBe('0px');
});

test('Numbers alien stages persist through replay, offline and reset',async({page,context,baseURL})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('./'); await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.getByRole('button',{name:'Numbers',exact:true}).click();
 await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 0 / 10');
 await expect(page.locator('.alien-picture img')).toHaveCount(0);
 for(let replay=0;replay<2;replay++){
  await page.getByRole('button',{name:/^Level 1 /}).click();
  for(const c of '012'){
   await draw(page,paths[c]); await page.getByRole('button',{name:'Check my writing'}).click();
   await expect(page.getByRole('status')).toContainText(c==='2'?'Amazing! Level complete!':'Wonderful writing');
   await page.getByRole('button',{name:'Continue'}).click();
  }
  await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 1 / 10');
 }
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).levels.numbers)).toEqual([1]);
 const base=new URL(baseURL!).pathname;
 expect(await page.evaluate(async base=>{const cache=await caches.open('enrique-v1.8.0-house-webp');return (await Promise.all(Array.from({length:10},(_,i)=>cache.match(`${base}alien/alien_stage_${String(i+1).padStart(2,'0')}.png`)))).every(Boolean)},base)).toBe(true);
 await page.reload(); await context.setOffline(true); await page.getByRole('button',{name:'Numbers',exact:true}).click();
 await expect(page.locator('.alien-picture img')).toHaveAttribute('src',/alien_stage_01\.png$/);
 const sizes=await page.evaluate(async base=>Promise.all(Array.from({length:10},(_,i)=>new Promise<number[]>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([img.naturalWidth,img.naturalHeight]);img.onerror=()=>reject(new Error('Alien image unavailable'));img.src=`${base}alien/alien_stage_${String(i+1).padStart(2,'0')}.png`}))),base);
 expect(sizes).toEqual(Array.from({length:10},()=>[256,365]));
 expect(await page.locator('.page-transition').evaluate(e=>e.getAnimations().length)).toBe(0);
 await context.setOffline(false);
 await page.getByRole('button',{name:/Grown-ups: hold to open/}).click(); await page.getByRole('dialog',{name:'Grown-up check'}).getByRole('button',{name:'7',exact:true}).click();
 await page.getByRole('button',{name:'Reset all progress'}).click(); await page.getByRole('button',{name:'Yes, reset'}).click();
 await page.getByRole('button',{name:'Numbers',exact:true}).click(); await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 0 / 10');
});

test('completed Numbers shows stage ten independently of other sections',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('enrique-adventure-v1'))localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],levels:{name:[],alphabet:[],numbers:[1,2,3,4,5,6,7,8,9,10]}}))});
 await page.goto('./'); await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 0 / 10');
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 0 / 10');
 await page.getByRole('button',{name:'Numbers',exact:true}).click(); await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 10 / 10'); await expect(page.locator('.alien-picture img')).toHaveAttribute('src',/alien_stage_10\.png$/);
});
