// Print-time "page X of Y" markers for flowing <doc-page> documents.
// Chrome doesn't support @page margin-box content or counter(pages), and the
// repeating footer slot is identical on every page — so markers are absolutely
// positioned into each page's content band at beforeprint and removed after.
export function attachPageNumbers(getOpts) {
  let markers = [];
  const remove = () => { markers.forEach(el => el.remove()); markers = []; };
  const add = () => {
    remove();
    const o = getOpts();
    if (!o || o.position === 'none' || !o.root) return;
    const IN = 96;
    const pageH = o.paper === 'letter' ? 11 * IN : 297 * IN / 25.4;
    const ftrH = o.footer ? o.footer.offsetHeight : 0;
    const band = Math.max(o.marginPx, ftrH ? ftrH + 0.35 * IN : 0);
    const H = pageH - o.marginPx - band;
    const CH = o.root.scrollHeight;
    const total = Math.max(1, Math.ceil(CH / H));
    if (total < 2) return;
    for (let n = 1; n <= total; n++) {
      const d = document.createElement('div');
      d.className = 'print-only';
      d.setAttribute('data-omelette-injected', '');
      d.textContent = o.format.replace('{n}', n).replace('{N}', total);
      d.style.cssText = 'position:absolute;font-size:9px;line-height:1;color:#6b7280;letter-spacing:0.04em;' +
        'top:' + Math.round(Math.min(n * H, CH) - 14) + 'px;' +
        (o.position === 'bottom-left' ? 'left:0;' : o.position === 'bottom-center' ? 'left:50%;transform:translateX(-50%);' : 'right:0;');
      o.root.appendChild(d);
      markers.push(d);
    }
  };
  window.addEventListener('beforeprint', add);
  window.addEventListener('afterprint', remove);
  return () => { remove(); window.removeEventListener('beforeprint', add); window.removeEventListener('afterprint', remove); };
}
