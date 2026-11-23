export function contentRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('main .content') ?? document.querySelector<HTMLElement>('main article') ?? document.querySelector<HTMLElement>('main') ?? document.querySelector<HTMLElement>('article');
}
export function headingAnchor(heading: HTMLElement): string {
  return heading.id || heading.querySelector<HTMLElement>('[id]')?.id || '';
}
