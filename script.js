const langToggle = document.getElementById('lang-toggle');

async function loadPage(lang = 'pt-br') {
    try {
        const response = await fetch(`lang/${lang}.json`);
        const data = await response.json();

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
    } catch (error) {
        console.error(error);
    }
}

langToggle.addEventListener('change', (e) => {
    loadPage(e.target.value);
});

const savedLang = localStorage.getItem('pageLang') || 'pt-br';
loadPage(savedLang);
