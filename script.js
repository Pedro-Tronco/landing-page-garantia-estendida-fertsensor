const langToggle = document.getElementById('lang-toggle');
let currentFaqData = null;
let activeFaqCategoryId = 1;
let faqListenersInitialized = false;

async function loadPage(lang = 'pt-br') {
    try {
        const response = await fetch(`lang/${lang}.json`);
        const data = await response.json();
        currentFaqData = data['faq-content'];

        // set document title from lang file (use "pageTitle" or fallback)
        if (data.pageTitle) {
            document.title = data.pageTitle;
        } else if (data.page?.title) {
            document.title = data.page.title;
        }

        document.querySelectorAll('[id$="-template"]').forEach((template) => {
            const keyword = template.id.replace('-template', '');
            const target = document.getElementById(`${keyword}-target`);
            if (target) {
                target.innerHTML = Mustache.render(template.innerHTML, data);
            }
        });

        document.documentElement.lang = lang;
        langToggle.value = lang;
        localStorage.setItem('pageLang', lang);

        if (!faqListenersInitialized) {
            initFaqDelegatedListeners();
            faqListenersInitialized = true;
        }

        if (currentFaqData?.categories?.length) {
            if (!currentFaqData.categories.some((cat) => cat.id == activeFaqCategoryId)) {
                activeFaqCategoryId = currentFaqData.categories[0].id;
            }
        }

        setActiveFaqCategory(activeFaqCategoryId);
    } catch (error) {
        console.error(error);
    }
}

function initFaqDelegatedListeners() {
    const categoriesTarget = document.getElementById('faq-categories-target');
    const questionsTarget = document.getElementById('faq-questions-target');

    if (categoriesTarget) {
        categoriesTarget.addEventListener('click', (event) => {
            const button = event.target.closest('.faq-category-btn');
            if (button) {
                const categoryId = parseInt(button.dataset.categoryId, 10);
                if (!isNaN(categoryId)) {
                    setActiveFaqCategory(categoryId);
                }
            }
        });
    }

    if (questionsTarget) {
        questionsTarget.addEventListener('click', (event) => {
            const button = event.target.closest('.faq-question-btn');
            if (!button) return;

            const questionItem = button.closest('.faq-question-item');
            const answerDiv = questionItem.querySelector('.faq-answer');
            const toggle = button.querySelector('.faq-question-toggle');
            const isOpen = answerDiv.style.display !== 'none';

            document.querySelectorAll('.faq-question-item').forEach((item) => {
                item.querySelector('.faq-answer').style.display = 'none';
                item.querySelector('.faq-question-toggle').textContent = '+';
                item.classList.remove('open');
                item.querySelector('.faq-question-btn')?.classList.remove('active');
            });

            if (!isOpen) {
                answerDiv.style.display = 'block';
                toggle.textContent = '−';
                questionItem.classList.add('open');
                button.classList.add('active');
            }
        });
    }
}

function setActiveFaqCategory(categoryId) {
    if (!currentFaqData?.categories) return;

    activeFaqCategoryId = categoryId;
    const activeCategory = currentFaqData.categories.find((cat) => cat.id == categoryId) || currentFaqData.categories[0];
    
    if (activeCategory?.id !== categoryId) {
        activeFaqCategoryId = activeCategory.id;
    }

    const questionsTemplate = document.getElementById('faq-questions-template');
    const questionsTarget = document.getElementById('faq-questions-target');

    if (questionsTemplate && questionsTarget) {
        questionsTarget.innerHTML = Mustache.render(questionsTemplate.innerHTML, { questions: activeCategory?.questions || [] });
    }

    document.querySelectorAll('.faq-category-btn').forEach((btn) => {
        btn.classList.toggle('active', parseInt(btn.dataset.categoryId, 10) === activeFaqCategoryId);
    });
}

async function getAvailableLangs() {
    try {
        const response = await fetch('lang/manifest.json');
        const data = await response.json();
        return data.languages || ['pt-br'];
    } catch (error) {
        console.error('Failed to fetch language manifest:', error);
        return ['pt-br'];
    }
}

function chooseLangFromNavigator(navigatorLanguages = [], available = ['pt-br']) {
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

async function populateLangToggle(availableLangs) {
    const langData = await Promise.all(
        availableLangs.map(async (lang) => {
            try {
                const response = await fetch(`lang/${lang}.json`);
                const data = await response.json();
                return { code: lang, label: data.langLabel || lang.toUpperCase() };
            } catch (error) {
                console.error(`Failed to load lang metadata for ${lang}:`, error);
                return { code: lang, label: lang.toUpperCase() };
            }
        })
    );

    const template = document.getElementById('lang-toggle-template');
    const select = document.getElementById('lang-toggle');
    if (template && select) {
        select.innerHTML = Mustache.render(template.innerHTML, { languages: langData });
    }
}

langToggle.addEventListener('change', (e) => {
    loadPage(e.target.value);
});

(async () => {
    const available = await getAvailableLangs();
    await populateLangToggle(available);
    const savedLang = localStorage.getItem('pageLang') || chooseLangFromNavigator(navigator.languages, available);
    loadPage(savedLang);
})();
