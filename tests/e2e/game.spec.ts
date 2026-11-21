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
    const cache = await caches.open('enrique-v1.2.1');
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
  await expect(page.getByText('World complete!')).toBeVisible();
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
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); expect((await page.locator('.glyph-grid button').allTextContents()).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); await page.getByRole('button',{name:'Lowercase'}).click(); expect((await page.locator('.glyph-grid button').allTextContents()).join('')).toBe('abcdefghijklmnopqrstuvwxyz'); await page.getByRole('button',{name:'z',exact:true}).click(); await draw(page,paths.z); await page.getByRole('button',{name:'Check my writing'}).click(); await expect(page.getByRole('status')).toContainText('World complete');
 await page.getByRole('button',{name:'Back to map'}).click(); await page.getByRole('button',{name:'Numbers',exact:true}).click(); await page.getByRole('button',{name:'8',exact:true}).click(); await draw(page,paths['8']); await page.getByRole('button',{name:'Check my writing'}).click(); await expect(page.getByRole('status')).toBeVisible();
 await page.reload(); await expect(page.getByText('Hello, Al!')).toBeVisible(); await expect(page.getByText(/v1.2.0/)).toBeVisible();
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
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write B. Start at the orange dots and follow the path.':'es-ES:Escribe B. Empieza en los puntos naranjas y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?'Speak instructions':'Leer instrucciones'}).click();
 await expect.poll(async()=>(await spoken()).filter(s=>s.includes('B.')).length).toBe(2);
 await draw(page,paths.B);await page.getByRole('button',{name:language==='en'?'Check my writing':'Revisar mi escritura'}).click();await page.getByRole('button',{name:language==='en'?'Continue':'Continuar'}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write C. Start at the orange dots and follow the path.':'es-ES:Escribe C. Empieza en los puntos naranjas y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?/Back to map/:/Volver al mapa/}).click();
 await page.getByRole('button',{name:language==='en'?'Numbers':'Números',exact:true}).click(); await page.getByRole('button',{name:'2',exact:true}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write 2. Start at the orange dots and follow the path.':'es-ES:Escribe 2. Empieza en los puntos naranjas y sigue el camino.');
 await page.getByRole('button',{name:language==='en'?'Speak instructions':'Leer instrucciones'}).click();
 await expect.poll(async()=>(await spoken()).filter(s=>s.includes('2.')).length).toBe(2);
 await draw(page,paths['2']);await page.getByRole('button',{name:language==='en'?'Check my writing':'Revisar mi escritura'}).click();await page.getByRole('button',{name:language==='en'?'Continue':'Continuar'}).click();
 await expect.poll(spoken).toContain(language==='en'?'en-US:Write 3. Start at the orange dots and follow the path.':'es-ES:Escribe 3. Empieza en los puntos naranjas y sigue el camino.');
});

test('a one-character name has a hidden exercise requiring adult review',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({name:'A',unlocked:3,completed:[],history:[],settings:{music:false,speech:false}})));
 await page.goto('./');await page.getByRole('button',{name:/Mystery Grove/}).click();
 await expect(page.locator('.exercise-copy h1')).toHaveText('?');
 await draw(page,[[{x:20,y:20},{x:60,y:60}]]);await page.getByRole('button',{name:'Ask a grown-up to check'}).click();await page.getByRole('button',{name:'Yes, this is ready!'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).history[0].method)).toBe('adult');
});
