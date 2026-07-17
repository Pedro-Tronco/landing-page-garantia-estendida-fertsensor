/**
 * FAQ Module
 * Handles FAQ category selection, question expansion/collapse, and delegated event listeners
 */

let currentFaqData = null;
let activeFaqCategoryId = 1;
let faqListenersInitialized = false;

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

function initFaq(faqData) {
    currentFaqData = faqData;

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
}

export { initFaq };
