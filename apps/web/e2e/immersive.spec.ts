import {expect,test} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('stadium arrival is nonblocking, skippable and remembered',async({page})=>{
 await page.goto('/')
 await expect(page.getByRole('link',{name:/Explore match centre/})).toBeVisible()
 const hero=page.getByTestId('pitch-hero')
 await expect(hero).toHaveAttribute('data-render-mode',/3d|fallback/)
 if(await hero.getAttribute('data-render-mode')==='3d'){
  const skip=page.getByRole('button',{name:'Skip stadium entrance'})
  if(await skip.isVisible())await skip.click()
  await expect(hero).toHaveAttribute('data-arrival','pitch',{timeout:10000})
  await page.goto('/clubs');await page.goto('/')
  await expect(hero).toHaveAttribute('data-arrival','pitch',{timeout:10000})
 }
})

test('reduced motion provides static information and interactive tactical controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('/')
 await expect(page.getByTestId('pitch-hero')).toHaveAttribute('data-arrival','static')
 await expect(page.getByRole('button',{name:'Skip stadium entrance'})).toHaveCount(0)
 const finish=page.getByRole('button',{name:'Finish',exact:true})
 await finish.click();await expect(finish).toHaveAttribute('aria-pressed','true')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('microphone denial remains useful without activating audio on entry',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}})
 })
 await page.goto('/ai-analyst')
 const start=page.getByRole('button',{name:'Start microphone',exact:true})
 await expect(start).toBeVisible();await start.click()
 await expect(page.getByText(/permission denied/)).toBeVisible()
 await expect(start).toBeVisible()
})

for(const route of ['/players','/rankings','/tactical-lab','/simulator','/fantasy','/news','/transfers','/competitions']){
 test('motion section remains accessible: '+route,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(route)
  await expect(page.getByRole('heading',{level:1})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(results.violations).toEqual([])
 })
}

test('a replay seek changes score without fabricating a new live goal effect',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.addInitScript(()=>{Object.defineProperty(window,'WebSocket',{value:undefined,configurable:true})})
 const fixture={id:'motion-test',home_team_id:'h',away_team_id:'a',competition_id:'demo-cup',home_team_name:'Motion Home',away_team_name:'Motion Away',kickoff_utc:'2026-11-01T00:00:00Z',status:'live_demo',home_score:1,away_score:0,clock_seconds:120}
 const event={id:'test-goal',fixture_id:fixture.id,team_id:'h',player_id:'h-9',clock_seconds:100,type:'goal',sequence:1,details:{}}
 const side={formation:'4-3-3',starting_xi:['h-9'],substitutes:[]}
 await page.route('**/api/v1/football/**',async route=>{
  const resource=new URL(route.request().url()).pathname.split('/').pop()!
  const bodies:Record<string,unknown>={live:[fixture],'live-state':fixture,events:[event],lineups:{fixture_id:fixture.id,home:side,away:side},statistics:{fixture_id:fixture.id,home:{shots:9},away:{shots:4}},tracking:[{fixture_id:fixture.id,t_seconds:0,x:.1,y:.1},{fixture_id:fixture.id,t_seconds:5,x:.2,y:.2}],'ai-context':{fixture,events_so_far:[event],source_is_synthetic:true},squad:[{id:'h-9',name:'Demo Forward'}]}
  await route.fulfill({json:{data:bodies[resource]??[],meta:{data_mode:'simulated',is_real_live_data:false}}})
 })
 await page.goto('/matches')
 const workspace=page.locator('.match-workspace')
 await expect(workspace.locator('h3').first()).toContainText('1 : 0')
 await expect(workspace.locator('.event-flash')).toHaveCount(0)
 await workspace.locator('input[type=range]').first().evaluate(node=>{(node as HTMLInputElement).value='50';node.dispatchEvent(new Event('input',{bubbles:true}))})
 await expect(workspace.locator('h3').first()).toContainText('0 : 0')
 await workspace.locator('input[type=range]').first().evaluate(node=>{(node as HTMLInputElement).value='110';node.dispatchEvent(new Event('input',{bubbles:true}))})
 await expect(workspace.locator('h3').first()).toContainText('1 : 0')
 await expect(workspace.locator('.event-flash')).toHaveCount(0)
})

test('formation editor moves a selected marker with keyboard and resets shape',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/tactical-lab')
 const marker=page.getByRole('button',{name:'Move player 1',exact:true})
 const before=await marker.getAttribute('transform')
 await marker.focus();await page.keyboard.press('ArrowRight')
 expect(await marker.getAttribute('transform')).not.toBe(before)
 await page.getByLabel('Formation',{exact:true}).selectOption('4-4-2')
 await expect(page.locator('[data-player-id]')).toHaveCount(11)
 await page.getByRole('button',{name:'Reset positions'}).click()
 await expect(page.getByLabel('Formation',{exact:true})).toHaveValue('4-4-2')
})

test('simulation final score is repeatable and accessible with reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/simulator')
 const run=page.getByRole('button',{name:'Run illustration',exact:true})
 await run.click()
 await expect(page.getByTestId('simulation-phase')).toHaveText('FINAL WHISTLE')
 const score=await page.locator('.sim-stage > strong').textContent()
 await run.click()
 await expect(page.locator('.sim-stage > strong')).toHaveText(score!)
})

test('fantasy sorting rearranges source points without changing them',async({page})=>{
 await page.goto('/fantasy')
 const board=page.locator('.rank-board');await expect(board.locator('button').first()).toBeVisible()
 const first=await board.locator('button b').first().textContent()
 await page.getByRole('button',{name:'Lowest first',exact:true}).click()
 await page.getByRole('button',{name:'Highest first',exact:true}).click()
 await expect(board.locator('button b').first()).toHaveText(first!)
})
