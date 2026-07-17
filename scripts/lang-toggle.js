/**
 * Language Toggle Module
 * Handles language switching, manifest loading, and language preference persistence
 */

import { backend_url } from './load-page.js';

async function getAvailableLangs() {
    let avaliableLangs;
    try {
        const response = await fetch(`${backend_url}/content/manifest`);
        const result = await response.json();
        avaliableLangs = result.languages
    } catch (error) {
        console.error('Failed to fetch language manifest:', error);
        avaliableLangs = [{  "code": "en-us", "label": "EN 🇺🇸"  }];
        throw error
    }

    const template = document.getElementById('lang-toggle-template');
    const select = document.getElementById('lang-toggle');
    if (template && select) {
        select.innerHTML = Mustache.render(template.innerHTML, {languages: avaliableLangs});
    }

    return avaliableLangs.map(lang => lang.code)
}

function chooseLangFromNavigator(navigatorLanguages = [], available = ['en-us']) {
    const candidates = [
        ...navigatorLanguages.map(s => String(s || '').toLowerCase()),
        (navigator.language || '').toLowerCase()
    ].filter(Boolean);

    // Try exact match
    for (const c of candidates) {
        const normalized = c.replace('_', '-');
        if (available.includes(normalized)) return normalized;
    }

    // Try primary subtag match (en-GB -> en-us)
    for (const c of candidates) {
        const primary = c.split('-')[0];
        const found = available.find(a => a.split('-')[0] === primary);
        if (found) return found;
    }

    return available[0];
}

function initLangToggle(onLangChange) {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('change', (e) => {
            onLangChange(e.target.value);
        });
    }
}

export { getAvailableLangs, chooseLangFromNavigator, initLangToggle };
