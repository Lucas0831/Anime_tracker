// 自定义线性图标：24×24 网格、2px 安全区、1.5px 等宽描边、圆角端点，仅描边不填充
export const ICON_PATHS = {
  timeline: '<circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h9M10 12h9M10 18h9"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  calendar7: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v3.5M16 3v3.5M3.5 9.5h17"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M15.6 15.6L20 20"/>',
  back: '<path d="M15 5.5L8.5 12l6.5 6.5M8.5 12H20"/>',
  clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.5V12l2.8 1.8"/>',
  broadcast: '<circle cx="12" cy="12" r="1.6"/><path d="M9.2 9.2a4 4 0 0 0 0 5.6M14.8 9.2a4 4 0 0 1 0 5.6M6.5 6.5a7.8 7.8 0 0 0 0 11M17.5 6.5a7.8 7.8 0 0 1 0 11"/>',
  globe: '<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6"/><ellipse cx="12" cy="12" rx="3.9" ry="8.3"/>',
  layers: '<path d="M12 4.5l7.5 3.5L12 11.5 4.5 8z"/><path d="M4.5 12.5L12 16l7.5-3.5"/><path d="M4.5 17L12 20.5l7.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowUp: '<path d="M12 19V5M6.5 10.5L12 5l5.5 5.5"/>',
  arrowUpRight: '<path d="M7 17L17 7M9.5 7H17v7.5"/>',
  book: '<path d="M4.5 5.5c2.4-.8 4.6-.3 7.5 1.2v12c-2.9-1.5-5.1-2-7.5-1.2zM19.5 5.5c-2.4-.8-4.6-.3-7.5 1.2v12c2.9-1.5 5.1-2 7.5-1.2z"/>',
  calendarX: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v3.5M16 3v3.5M3.5 9.5h17M10 13.5l4 4M14 13.5l-4 4"/>',
  x: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>'
};

export function iconUri(name, color) {
  const paths = ICON_PATHS[name] || '';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
    (color || '#17171a') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
