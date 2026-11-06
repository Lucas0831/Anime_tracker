export const ICON_PATHS = {
  timeline: '<circle cx="4.5" cy="6.5" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="17.5" r="1.4"/><path d="M9 6.5h11M9 12h11M9 17.5h11"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  calendar7: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6L20 20"/>',
  back: '<path d="M14.5 5L7.5 12l7 7M7.8 12H20"/>',
  clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.7V12l2.9 1.8"/>',
  broadcast: '<circle cx="12" cy="12" r="1.7"/><path d="M8.4 8.6a5 5 0 0 0 0 6.8M15.6 8.6a5 5 0 0 1 0 6.8M5.7 5.9a8.5 8.5 0 0 0 0 12.2M18.3 5.9a8.5 8.5 0 0 1 0 12.2"/>',
  globe: '<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c2.5 2.6 3.7 5.4 3.7 8.3S14.5 17.7 12 20.3c-2.5-2.6-3.7-5.4-3.7-8.3S9.5 6.3 12 3.7z"/>',
  layers: '<path d="M12 3.5l8.4 4.6-8.4 4.6-8.4-4.6z"/><path d="M3.6 12.6l8.4 4.6 8.4-4.6"/><path d="M3.6 17l8.4 4.6 8.4-4.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowUp: '<path d="M12 19V5M6.5 10.5L12 5l5.5 5.5"/>',
  arrowUpRight: '<path d="M7 17L17 7M9.5 7H17v7.5"/>',
  book: '<path d="M4.5 5.5c2.4-.8 4.6-.3 7.5 1.2v12c-2.9-1.5-5.1-2-7.5-1.2zM19.5 5.5c-2.4-.8-4.6-.3-7.5 1.2v12c2.9-1.5 5.1-2 7.5-1.2z"/>',
  calendarX: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17M9.5 13.5l5 4M14.5 13.5l-5 4"/>',
  x: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>'
};

export function iconUri(name, color) {
  const paths = ICON_PATHS[name] || '';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
    (color || '#17171a') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
