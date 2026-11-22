import {test,expect} from '@playwright/test';

test('album follows the active adventure and trophies stay in the navigation',async({page})=>{
 await page.goto('./');
 await expect(page.locator('.section-heading-actions')).toContainText('View evolution album');
 await expect(page.locator('.section-tabs')).toContainText('Trophy book');
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await expect(page.locator('.section-heading-actions')).toContainText('View evolution album');
 await expect(page.locator('.section-heading-actions .progress-pill')).toContainText('Alphabet');
 await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByRole('heading',{name:'ABC dragon',level:1})).toBeVisible();
});

for(const language of ['en','es'] as const) test(`book navigation fits phone, tablet and desktop in ${language}`,async({page})=>{
 await page.addInitScript(lang=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:1,completed:[],history:[],settings:{language:lang}})),language);
 for(const width of [390,768,1280]){
  await page.setViewportSize({width,height:1024});
  await page.goto('./');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`map width ${width}`).toBe(true);
  const album=page.getByRole('button',{name:language==='en'?'View evolution album':'Ver álbum de evolución'});
  const trophy=page.getByRole('button',{name:language==='en'?'Trophy book':'Libro de logros'});
  await expect(album).toBeVisible(); await expect(trophy).toBeVisible();
  for(const button of [album,trophy]){const box=await button.boundingBox();expect(box).not.toBeNull();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44)}
 }
});

test('albums hide locked artwork, navigate, and preserve legacy progress across sections and offline',async({page,context})=>{
 await page.addInitScript(()=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:3,completed:[1,2],history:[],levels:{name:[2],alphabet:[1,2,3,4,5],numbers:[1]}})));
 await page.goto('./');
 await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByText('2 / 10 levels completed')).toBeVisible();
 await expect(page.getByText('Current stage')).toBeVisible();
 await page.getByRole('button',{name:'Next stage'}).click();
 await expect(page.getByText('Still locked')).toBeVisible();
 await expect(page.locator('.stage-card img')).toHaveCount(0);
 await page.keyboard.press('ArrowLeft');
 await expect(page.getByText('Current stage')).toBeVisible();
 await page.getByRole('button',{name:'Back to game'}).click();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByText('5 / 10 levels completed')).toBeVisible();
 await page.setViewportSize({width:667,height:375});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Back to game'}).click();
 await page.getByRole('button',{name:'Trophy book'}).click();
 await expect(page.locator('.trophy.earned')).toHaveCount(5);
 await expect(page.getByText('5 levels in each adventure')).toBeVisible();
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload(); await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true); await page.reload();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click();
 await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByText('5 / 10 levels completed')).toBeVisible();
 await expect(page.locator('.stage-card img')).toBeVisible();
});

test('empty and complete books show bounded progress',async({page})=>{
 await page.goto('./'); await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByText('0 / 10 levels completed')).toBeVisible(); await expect(page.locator('.stage-card img')).toHaveCount(0);
 await page.getByRole('button',{name:'Back to game'}).click(); await page.getByRole('button',{name:'Trophy book'}).click(); await expect(page.locator('.trophy.earned')).toHaveCount(0);
});

test('complete collection shows every stage and trophy',async({page})=>{
 await page.addInitScript(()=>{const levels=Array.from({length:10},(_,i)=>i+1);localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:10,completed:levels,history:[{section:'numbers',world:1,exercise:'1',method:'guided',date:'2020-01-01'}],levels:{name:levels,alphabet:levels,numbers:levels}}))});
 await page.goto('./'); await page.getByRole('button',{name:'View evolution album'}).click();
 await expect(page.getByText('10 / 10 levels completed')).toBeVisible(); await expect(page.getByText('Current stage')).toBeVisible();
 await page.getByRole('button',{name:'Stage 1: unlocked'}).click(); await expect(page.getByText('Earlier unlocked stage')).toBeVisible();
 await page.getByRole('button',{name:'Back to game'}).click(); await page.getByRole('button',{name:'Trophy book'}).click(); await expect(page.locator('.trophy.earned')).toHaveCount(13);
});

test('book focus returns to each opener across switching and reopening',async({page})=>{
 await page.goto('./');
 const album=page.getByRole('button',{name:'View evolution album'}), trophy=page.getByRole('button',{name:'Trophy book'});
 await album.focus(); await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Name house',level:1})).toBeFocused();
 await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Next stage'})).toBeFocused();
 await page.getByRole('button',{name:'Back to game'}).click(); await expect(album).toBeFocused();
 await trophy.focus(); await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Trophy book',level:1})).toBeFocused();
 await page.getByRole('button',{name:'Back to game'}).click(); await expect(trophy).toBeFocused();
 await album.click(); await expect(page.getByRole('heading',{name:'Name house',level:1})).toBeFocused();
 await page.getByRole('button',{name:'Back to game'}).click(); await expect(album).toBeFocused();
});

for(const language of ['en','es'] as const) test(`album announces only the current stage in ${language}`,async({page})=>{
 await page.addInitScript(lang=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:3,completed:[1,2],history:[],settings:{language:lang},levels:{name:[1,2]}})),language);
 await page.goto('./'); await page.getByRole('button',{name:language==='en'?'View evolution album':'Ver álbum de evolución'}).click();
 const status=page.getByRole('status'); await expect(status).toHaveAttribute('aria-live','polite'); await expect(status).toBeEmpty();
 await page.keyboard.press('ArrowRight'); await expect(status).toHaveText(language==='en'?'Stage 3: locked':'Etapa 3: bloqueada');
 await page.keyboard.press('ArrowLeft'); await expect(status).toHaveText(language==='en'?'Stage 2: unlocked':'Etapa 2: desbloqueada');
 await page.getByRole('button',{name:language==='en'?'Stage 1: unlocked':'Etapa 1: desbloqueada'}).click(); await expect(status).toHaveText(language==='en'?'Stage 1: unlocked':'Etapa 1: desbloqueada');
 await page.getByRole('button',{name:language==='en'?'Back to game':'Volver al juego'}).click();
 await page.getByRole('button',{name:language==='en'?'Trophy book':'Libro de logros'}).click();
 await expect(page.getByRole('heading',{name:language==='en'?'Trophy book':'Libro de logros',level:1})).toBeFocused();
 await expect(page.getByRole('status')).toHaveCount(0);
 await page.getByRole('button',{name:language==='en'?'Back to game':'Volver al juego'}).click();
 await page.getByRole('button',{name:language==='en'?'View evolution album':'Ver álbum de evolución'}).click(); await expect(page.getByRole('status')).toBeEmpty();
});

test('drawing after closing a book does not move focus',async({browser})=>{
 const context=await browser.newContext({hasTouch:true}); const page=await context.newPage();
 await page.goto('./'); await page.getByRole('button',{name:'View evolution album'}).click();
 await page.getByRole('button',{name:'Back to game'}).click(); await page.getByRole('button',{name:'Letter Meadow'}).click();
 const undo=page.getByRole('button',{name:'Undo'}); await undo.focus();
 const pad=page.getByRole('application'); await pad.scrollIntoViewIfNeeded(); const box=await pad.boundingBox(); expect(box).not.toBeNull();
 await page.touchscreen.tap(box!.x+box!.width/2,box!.y+box!.height/2);
 expect(await page.evaluate(()=>document.activeElement===document.body || document.activeElement?.textContent?.includes('Undo'))).toBe(true);
 await expect(page.locator('.pad path[stroke="#253b75"]')).toHaveCount(1); await context.close();
});

test('updated Name artwork persists and loads in the stage and album offline',async({page,context,baseURL})=>{
 const levels=Array.from({length:10},(_,i)=>i+1);
 await page.addInitScript(levels=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:10,completed:levels,history:[],levels:{name:levels,alphabet:[1,2],numbers:[1]}})),levels);
 await page.goto('./');
 await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 10 / 10');
 await expect(page.locator('.name-house img')).toHaveAttribute('src',/casa_nivel_10\.webp$/);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload(); await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const base=new URL(baseURL!).pathname;
 const expected=['7506bb7fd32da17e91bd2af5c93cb99c1ef53a8004207669197c3b1c1cf24bf0','f8ff407168d1c2098cf51eda672c280f44c5086467ba1a18ffbb5aa1e9ac1f5c','f38b2ea2c7ee10dfa3575cac9397f0a19c89caa04edca84580918e82f1d2cbe1','1d7d72219511f65706d3876779bee7587312b1bc42db6fe5edadfe90d38faf59','b3f0f03fa9b3441627def35dce6e8710f00e056a5050a42ddee3b1ce710bbb32','0b8442ebfc4bf82cbb769dab11ffce7b74737a7b91a100424ee06f36c35ef789','de7fb358b75ed9b239a5e47af2cc9a1bed5b350edacf043cab8714287e08e214','ea72ebbd938a6082fb9047518a82d8a5a0aa5771d24111cd7907edc8e6ae44d9','7b66b815a5ca9c0bda3009f304dd79894b3482cfc7667f1b220cc3c31417f88f','f65d688c6ec24b825a20a2109272b0dc3cef1b3b675b267e4f8250e8a905f2db'];
 expect(await page.evaluate(async base=>{const cache=await caches.open('enrique-v1.10.1-adventure-books-nav');return Promise.all(Array.from({length:10},async(_,i)=>{const response=await cache.match(`${base}name-house/casa_nivel_${String(i+1).padStart(2,'0')}.webp`);if(!response)throw Error('Missing crop');const hash=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}))},base)).toEqual(expected);
 await context.setOffline(true); await page.reload();
 await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 10 / 10');
 expect(await page.locator('.name-house img').evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([838,694]);
 await page.getByRole('button',{name:'View evolution album'}).click();
 for(let i=1;i<=10;i++){
  await page.getByRole('button',{name:`Stage ${i}: ${i===10?'current':'unlocked'}`,exact:true}).click();
  const img=page.locator('.stage-card img'); await expect(img).toHaveAttribute('src',new RegExp(`casa_nivel_${String(i).padStart(2,'0')}\\.webp$`));
  await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth===838&&el.naturalHeight===694)).toBe(true);
 }
 await page.getByRole('button',{name:'Back to game'}).click();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 2 / 10');
 await page.getByRole('button',{name:'Numbers',exact:true}).click(); await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 1 / 10');
});
