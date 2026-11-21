import {test, expect} from '@playwright/test';

test('grown-up hold suppresses selection and survives or cancels pointer sequences', async ({page, browserName}) => {
 await page.goto('./');
 const button=page.locator('button.parent');
 const styles=await button.evaluate(el=>[el,...el.querySelectorAll('*')].map(node=>({select:getComputedStyle(node).webkitUserSelect,callout:getComputedStyle(node).getPropertyValue('-webkit-touch-callout')})));
 for(const style of styles){expect(style.select).toBe('none');if(browserName==='webkit') expect(style.callout).toBe('none')}
 for(const event of ['pointercancel','pointerout']){
  await button.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0});
  await button.dispatchEvent(event,{pointerId:1,pointerType:'touch'});
  await page.waitForTimeout(2100);
  await expect(page.getByRole('heading',{name:'Grown-up corner'})).toHaveCount(0);
 }
 await button.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0});
 await page.waitForTimeout(2100);
 await button.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});
 await expect(page.getByRole('heading',{name:'Grown-up corner'})).toBeVisible();
});

test.use({hasTouch:true});
for(const language of ['en','es'] as const) test(`alternative gate and reset confirmation in ${language}`, async ({page})=>{
 await page.addInitScript(lang=>localStorage.setItem('enrique-adventure-v1',JSON.stringify({unlocked:2,completed:[1],history:[],settings:{language:lang,music:false,speech:false}})),language);
 await page.goto('./');
 const parent=page.locator('button.parent');
 await parent.focus(); await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog',{name:language==='en'?'Grown-up check':'Comprobación para adultos'});
 await expect(dialog).toContainText(language==='en'?'what is 3 + 4?':'¿cuánto es 3 + 4?');
 await dialog.getByRole('button',{name:'6'}).click();
 await expect(dialog.getByRole('status')).toHaveText(language==='en'?'Try again.':'Inténtalo de nuevo.');
 await dialog.getByRole('button',{name:language==='en'?'Cancel':'Cancelar'}).click();
 await expect(dialog).toHaveCount(0); await expect(parent).toBeFocused();
 await parent.tap(); await dialog.getByRole('button',{name:'7'}).tap();
 await expect(page.getByRole('heading',{name:language==='en'?'Grown-up corner':'Rincón de adultos'})).toBeVisible();
 expect(await page.getByLabel(language==='en'?'Child’s name':'Nombre del niño o niña').evaluate(el=>getComputedStyle(el).webkitUserSelect)).not.toBe('none');
 await page.getByRole('button',{name:language==='en'?'Reset all progress':'Borrar todo el progreso'}).click();
 await expect(page.getByText(language==='en'?'Really erase all local progress?':'¿Borrar todo el progreso local?')).toBeVisible();
 await page.getByRole('button',{name:language==='en'?'Cancel':'Cancelar'}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('enrique-adventure-v1')!).completed)).toEqual([1]);
});
