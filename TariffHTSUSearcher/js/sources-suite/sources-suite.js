// sources-suite.js
import { initApp1 } from './app1_sources.js';
import { initApp2 } from './app2_multisearch.js';
import { initApp3 } from './app3_datasets.js';
import { initApp4 } from './app4_minimal_se.js';

export function initializeSourcesSuite() {
  const tabs = document.querySelectorAll('[data-suite-tab]');
  const panes = {
    'suite-app1': document.getElementById('suite-app1'),
    'suite-app2': document.getElementById('suite-app2'),
    'suite-app3': document.getElementById('suite-app3'),
    'suite-app4': document.getElementById('suite-app4')
  };
  const inited = new Set();

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('border-blue-600'));
      btn.classList.add('border-blue-600');
      Object.values(panes).forEach(p => (p.style.display = 'none'));
      const id = btn.dataset.suiteTab;
      panes[id].style.display = 'block';
      if (!inited.has(id)) {
        if (id === 'suite-app1') initApp1(panes[id]);
        if (id === 'suite-app2') initApp2(panes[id]);
        if (id === 'suite-app3') initApp3(panes[id]);
        if (id === 'suite-app4') initApp4(panes[id]);
        inited.add(id);
      }
    });
  });

  // 預設顯示 App1
  tabs[0]?.click();
}
if (typeof window !== 'undefined') window.initializeSourcesSuite = initializeSourcesSuite;
