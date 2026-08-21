import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Icon from './Icon.svelte';

describe('Icon component', () => {
  it('renders standard icon with svg and path', () => {
    const { container } = render(Icon, { props: { name: 'heart', size: 20 } });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains('icon-heart')).toBe(true);
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('renders custom color and stroke width', () => {
    const { container } = render(Icon, {
      props: {
        name: 'search',
        color: '#ff0000',
        strokeWidth: 3,
        class: 'custom-class',
      },
    });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('#ff0000');
    expect(svg?.getAttribute('stroke-width')).toBe('3');
    expect(svg?.classList.contains('custom-class')).toBe(true);
  });

  it('falls back to default utensils icon for unknown icon name', () => {
    const { container } = render(Icon, {
      props: { name: 'unknown-icon-xyz' },
    });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.innerHTML).toContain('M3 2v7c0 1.1');
  });
});
