export const THEME_KEY = 'dsh-gallery-theme';
export const THEMES = [
  { id: 'system', label: '跟随系统', hint: '当前 Gallery 外观' },
  { id: 'atelier', label: '墨绿黄铜', hint: '深色展厅' },
  { id: 'paper', label: '暖纸', hint: '柔和浅色' },
  { id: 'comic', label: '漫画印刷', hint: '粗墨分镜与彩色网点' },
  { id: 'astral', label: '鎏金星穹', hint: '星轨、流星与宝石榜单' },
  { id: 'teyvat', label: '原神 · 冒险手册', hint: '星空、羊皮纸与元素纹章' },
];
export function loadTheme(storage) {
  try {
    const value = storage?.getItem(THEME_KEY);
    return THEMES.some(theme => theme.id === value) ? value : 'system';
  } catch { return 'system'; }
}
export function saveTheme(storage, theme) {
  if (!THEMES.some(item => item.id === theme)) return false;
  try { storage?.setItem(THEME_KEY, theme); } catch { /* Theme still applies for this visit. */ }
  return true;
}
