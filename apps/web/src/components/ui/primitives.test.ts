import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MatchScore from './MatchScore.vue'
import UiTable from './UiTable.vue'
import UiButton from './UiButton.vue'
import ResponsiveImage from './ResponsiveImage.vue'
import { searchSections } from '../../app/sections'
describe('honest shell primitives', () => {
  it('does not turn unknown scores into zero', () => {
    const wrapper = mount(MatchScore, { props: { home: 'Home', away: 'Away' } })
    expect(wrapper.get('strong').attributes('aria-label')).toBe('Score unavailable')
    expect(wrapper.get('strong').text()).toBe('— : —')
    const played = mount(MatchScore, { props: { home: 'Home', away: 'Away', homeScore: 0, awayScore: 2 } })
    expect(played.get('strong').attributes('aria-label')).toBe('0 to 2')
  })
  it('labels empty tables without invented rows', () => {
    const wrapper = mount(UiTable, { props: { caption: 'Demo standings', columns: ['Club', 'Points'], rows: [] } })
    expect(wrapper.get('caption').text()).toBe('Demo standings')
    expect(wrapper.get('td').attributes('colspan')).toBe('2')
    expect(wrapper.text()).toContain('not connected')
  })
  it('keeps disabled actions inert', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true }, slots: { default: 'Save' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  it('reserves image dimensions and supports responsive lazy sources', () => {
    const wrapper = mount(ResponsiveImage, { props: { src: '/pitch.png', srcset: '/pitch.png 640w, /pitch-large.png 1280w', alt: 'Pitch', width: 640, height: 360 } })
    expect(wrapper.attributes('loading')).toBe('lazy')
    expect(wrapper.attributes('width')).toBe('640')
    expect(wrapper.attributes('srcset')).toContain('1280w')
  })
  it('searches known sections only and trims case-insensitively', () => {
    expect(searchSections('  PLAYER ')).toEqual([expect.objectContaining({ path: '/players' })])
    expect(searchSections('a fabricated player')).toEqual([])
  })
})
