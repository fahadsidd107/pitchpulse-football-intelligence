import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const destinations = ['/matches', '/competitions', '/clubs', '/players', '/rankings', '/ai-analyst', '/tactical-lab', '/simulator', '/fantasy', '/news', '/transfers']

test('homepage has navigable demo sections without fabricated football facts', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  for (const href of destinations) {
    expect(await page.locator(`a[href="${href}"]`).count(), href).toBeGreaterThan(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByText(/DEMO/).first()).toBeVisible()
})

test('search filters destinations and restores focus after Escape', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Search', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Search PitchPulse' })
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('searchbox')
  await input.fill('rankings')
  await dialog.getByRole('link', { name: /Rankings/ }).click()
  await expect(page).toHaveURL('/rankings')
  await expect(dialog).not.toBeVisible()
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('reduced motion uses a static pitch without loading the 3D chunk', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const sceneRequests: string[] = []
  page.on('request', request => { if (request.url().includes('PitchScene')) sceneRequests.push(request.url()) })
  await page.goto('/')
  await expect(page.getByTestId('pitch-hero')).toHaveAttribute('data-render-mode', 'fallback')
  expect(await page.locator('canvas').count()).toBe(0)
  expect(sceneRequests).toEqual([])
  await expect(page.getByRole('main')).toBeVisible()
})

test('missing WebGL falls back and keeps navigation usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByTestId('pitch-hero')).toHaveAttribute('data-render-mode', 'fallback')
  await page.getByRole('main').locator('a[href="/matches"]').first().click()
  await expect(page).toHaveURL('/matches')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('design primitives have accessible dialogs, tables and tooltips', async ({ page }) => {
  await page.goto('/design-system')
  const trigger = page.getByRole('button', { name: 'Open example dialog' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'A focused conversation' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab')
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await page.getByRole('button', { name: 'About demo data' }).focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await expect(page.getByRole('table', { name: 'Standings example' })).toBeVisible()
})

for (const route of ['/', '/design-system', '/matches']) {
  test(`accessibility baseline: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations).toEqual([])
  })
}

test('a tactical selection changes the static play without requiring motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const stadium = page.locator('.hero')
  await stadium.getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(stadium.getByRole('button', { name: 'Finish', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(stadium).toContainText('cutback')
  await expect(stadium.locator('canvas')).toHaveCount(0)
})

test('filtering results updates the spotlight and preserves unknown scores', async ({ page }) => {
  await page.route('**/api/v1/matchday', route => route.fulfill({ json: {
    mode: 'DELAYED', source: 'football-data.org', fetched_at: 1793404800, stale: false,
    matches: [{ id: 1, home: 'Test Home', away: 'Test Away', competition: 'Test Cup', kickoff: '2026-10-31T14:00:00Z', status: 'TIMED', home_score: null, away_score: null }],
  } }))
  await page.goto('/matches')
  await expect(page.getByText(/Delayed scores/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Test Home/ })).toContainText('— : —')
  await page.getByRole('button', { name: 'Results', exact: true }).click()
  await expect(page.getByText(/No results fixtures/)).toBeVisible()
  await page.getByRole('button', { name: 'Upcoming', exact: true }).click()
  await expect(page.locator('.featured-fixture')).toContainText('Test Home v Test Away')
})
