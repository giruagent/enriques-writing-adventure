import {test,expect} from '@playwright/test';

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
 await page.keyboard.press('Tab'); await expect(trophy).toBeFocused(); await page.keyboard.press('Enter');
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
 await page.goto('./');
 await page.evaluate(levels=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:10,completed:levels,history:[],levels:{name:levels,alphabet:[1,2],numbers:[1]}})),levels);
 await page.reload();
 await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 10 / 10');
 await expect(page.locator('.name-house img')).toHaveAttribute('src',/casa_nivel_10\.png$/);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload(); await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const base=new URL(baseURL!).pathname;
 const expected=['fe893f5113d5e6dab586d081de8a16e8e91010eb907b563f39b729fdcc430a08','c6352cd2d950a469a0c9ad424494dcb26d48399db0f7c0f9d01046a3123a3d36','ada12fe17e21924b64ccbc94fb7457b37d3df5ee8604ce20f08bf7164dadb86d','c705aa585b5c048c7d9a931621c1667ab4befab4e63544a8657cc7b4fb7d32f9','e8bf57cc39e4e61d2cd2aae0f3ced422b6e1881a121815630d2bfc3b6b709ff3','db94a801f1d34d64d7d894a62466c57fd3688f6a1a89cf83b2de588701b4deab','5d40bdd563c27be8b0e1ba9dea8c0d3124e6a2854bfdfa07023bf248afee659a','44b9bab57946850abf0d93c1ba3b97eafc5456553bf18393d77a6be6098a0fd9','28f612115385ba187fe81948cc23549046b7e4f816b6746fc497bb76fffa8a26','d8aa389435c5f9db4a0d112a3460cb2629e10e698281a79e093ec504d7841048'];
 expect(await page.evaluate(async base=>{const cache=await caches.open('enrique-v1.7.0-house2');return Promise.all(Array.from({length:10},async(_,i)=>{const response=await cache.match(`${base}name-house/casa_nivel_${String(i+1).padStart(2,'0')}.png`);if(!response)throw Error('Missing crop');const hash=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}))},base)).toEqual(expected);
 await context.setOffline(true); await page.reload();
 await expect(page.locator('.name-house')).toHaveAttribute('aria-label','Our growing mansion: 10 / 10');
 expect(await page.locator('.name-house img').evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([251,268]);
 await page.getByRole('button',{name:'View evolution album'}).click();
 for(let i=1;i<=10;i++){
  await page.getByRole('button',{name:`Stage ${i}: ${i===10?'current':'unlocked'}`,exact:true}).click();
  const img=page.locator('.stage-card img'); await expect(img).toHaveAttribute('src',new RegExp(`casa_nivel_${String(i).padStart(2,'0')}\\.png$`));
  await expect.poll(()=>img.evaluate((el:HTMLImageElement,stage)=>el.complete&&el.naturalWidth===251&&el.naturalHeight===(stage<=5?259:268),i)).toBe(true);
 }
 await page.getByRole('button',{name:'Back to game'}).click();
 await page.getByRole('button',{name:'Alphabet',exact:true}).click(); await expect(page.locator('.dragon-progress')).toHaveAttribute('aria-label','Alphabet dragon: 2 / 10');
 await page.getByRole('button',{name:'Numbers',exact:true}).click(); await expect(page.locator('.alien-progress')).toHaveAttribute('aria-label','Numbers alien: 1 / 10');
});
