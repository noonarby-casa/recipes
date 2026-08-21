/**
 * Centralized SVG icon definitions loaded from raw SVG files.
 */

export type IconName =
  | 'bbq'
  | 'book'
  | 'bowl'
  | 'bread'
  | 'breakfast'
  | 'calendar'
  | 'chef-hat'
  | 'clock'
  | 'coffee'
  | 'dessert'
  | 'dice'
  | 'drink'
  | 'edit'
  | 'filter'
  | 'heart'
  | 'minus'
  | 'pasta'
  | 'pause'
  | 'pizza'
  | 'play'
  | 'plus'
  | 'reset'
  | 'rice'
  | 'salad'
  | 'sandwich'
  | 'seafood'
  | 'search'
  | 'shopping-cart'
  | 'snack'
  | 'swap'
  | 'tacos'
  | 'timer'
  | 'trash'
  | 'user'
  | 'utensils'
  | 'x';

const rawSvgModules = import.meta.glob<string>('../../../icons/*.svg', {
  query: '?raw',
  eager: true,
  import: 'default',
});

function extractInnerSvg(svgContent: string): string {
  const match = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return match ? match[1].trim() : svgContent.trim();
}

export const ICON_DEFINITIONS: Record<IconName, string> = Object.entries(
  rawSvgModules,
).reduce(
  (acc, [filePath, content]) => {
    const iconName = filePath
      .split('/')
      .pop()
      ?.replace(/\.svg$/, '') as IconName | undefined;
    if (iconName) {
      acc[iconName] = extractInnerSvg(content);
    }
    return acc;
  },
  {} as Record<IconName, string>,
);
