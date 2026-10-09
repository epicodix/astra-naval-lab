/* Display translation only. Simulation state, selectors and event payloads stay intact. */
function createNavalDisplayTranslator(catalog) {
  const exact = catalog.exact || {};
  const fragments = catalog.fragments || {};
  const keys = Object.keys(fragments).sort((a, b) => b.length - a.length);
  const escaped = keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.length ? new RegExp(escaped.join('|'), 'g') : null;
  return function translate(input) {
    if (!/[가-힣]/.test(input)) return input;
    if (Object.prototype.hasOwnProperty.call(exact, input)) return exact[input];
    const trimmed = input.trim();
    if (Object.prototype.hasOwnProperty.call(exact, trimmed)) {
      return input.replace(trimmed, exact[trimmed]);
    }
    let result = pattern ? input.replace(pattern, match => fragments[match]) : input;
    result = result.replace(/(\d+)번/g, 'No. $1').replace(/(\d+)문/g, '$1 guns')
      .replace(/(\d+)발/g, '$1 rounds').replace(/(\d+)탑/g, '$1 turrets');
    return result;
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {createNavalDisplayTranslator};
}
if (typeof document !== 'undefined') {
  (() => {
    const root = document.getElementById('naval-duel');
    const catalogElement = document.getElementById('astra-english-catalog');
    if (!root || !catalogElement) return;
    const translate = createNavalDisplayTranslator(JSON.parse(catalogElement.textContent));
    const rawText = new WeakMap(), rawAttributes = new WeakMap();
    const attributeNames = ['aria-label', 'data-tooltip', 'title', 'placeholder'];
    let language = root.dataset.publicLang === 'en' ? 'en' : 'ko';
    const ignored = element => !element || !!element.closest('script, style, noscript');

    function translateNode(node) {
      if (ignored(node.parentElement)) return;
      const value = node.nodeValue;
      let record = rawText.get(node);
      if (!record || value !== record.rendered) record = {raw: value, rendered: value};
      const rendered = language === 'en' ? translate(record.raw) : record.raw;
      record.rendered = rendered;
      rawText.set(node, record);
      if (value !== rendered) node.nodeValue = rendered;
    }
    function translateAttribute(element, name) {
      if (ignored(element) || !element.hasAttribute(name)) return;
      const value = element.getAttribute(name);
      let records = rawAttributes.get(element);
      if (!records) {records = {}; rawAttributes.set(element, records);}
      let record = records[name];
      if (!record || value !== record.rendered) record = {raw: value, rendered: value};
      const rendered = language === 'en' ? translate(record.raw) : record.raw;
      record.rendered = rendered; records[name] = record;
      if (value !== rendered) element.setAttribute(name, rendered);
    }
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {translateNode(node); return;}
      if (node.nodeType !== Node.ELEMENT_NODE || ignored(node)) return;
      for (const name of attributeNames) translateAttribute(node, name);
      for (const child of node.childNodes) walk(child);
    }
    const observe = () => observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: attributeNames,
    });
    const observer = new MutationObserver(records => {
      observer.disconnect();
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target);
        else if (record.type === 'attributes') translateAttribute(record.target, record.attributeName);
        else for (const node of record.addedNodes) walk(node);
      }
      observe();
    });
    function setLanguage(next) {
      language = next === 'en' ? 'en' : 'ko';
      observer.disconnect();
      document.documentElement.lang = language;
      document.title = language === 'en' ? 'Yamato vs Iowa Battleship Simulator | ASTRA NAVAL LAB'
        : '야마토 × 아이오와 · Built with GPT Astra';
      root.dataset.publicLang = language;
      walk(document.body);
      observe();
    }
    window.addEventListener('message', event => {
      if (event.source !== parent || event.data?.type !== 'astra-display-language'
        || !['en', 'ko'].includes(event.data.language)) return;
      setLanguage(event.data.language);
    });
    setLanguage(language);
  })();
}
