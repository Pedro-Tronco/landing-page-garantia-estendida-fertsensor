const langToggle = document.getElementById('lang-toggle');
let currentFaqData = null;
let activeFaqCategoryId = 1;
let faqListenersInitialized = false;

async function loadPage(lang = 'pt-br') {
    try {
        const response = await fetch(`lang/${lang}.json`);
        const data = await response.json();
        currentFaqData = data['faq-content'] || data['faq_content'] || data.faqContent || data.faq;

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
            const categoryExists = currentFaqData.categories.some((cat) => cat.id == activeFaqCategoryId);
            if (!categoryExists) {
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
            if (!button) return;
            const categoryId = parseInt(button.dataset.categoryId, 10);
            if (!Number.isNaN(categoryId)) {
                setActiveFaqCategory(categoryId);
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
                const btn = item.querySelector('.faq-question-btn');
                if (btn) btn.classList.remove('active');
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

    let activeCategory = currentFaqData.categories.find((cat) => cat.id === categoryId || cat.id == categoryId);
    if (!activeCategory) {
        activeCategory = currentFaqData.categories[0];
        activeFaqCategoryId = activeCategory.id;
    }

    const questionsTemplate = document.getElementById('faq-questions-template');
    const questionsTarget = document.getElementById('faq-questions-target');

    if (questionsTemplate && questionsTarget) {
        questionsTarget.innerHTML = activeCategory
            ? Mustache.render(questionsTemplate.innerHTML, { questions: activeCategory.questions })
            : '';
    }

    document.querySelectorAll('.faq-category-btn').forEach((btn) => {
        const btnCategoryId = parseInt(btn.dataset.categoryId, 10);
        btn.classList.toggle('active', btnCategoryId === activeFaqCategoryId);
    });
}

langToggle.addEventListener('change', (e) => {
    loadPage(e.target.value);
});

const savedLang = localStorage.getItem('pageLang') || 'pt-br';
loadPage(savedLang);
