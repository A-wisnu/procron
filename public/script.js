document.addEventListener('DOMContentLoaded', () => {
    const langSelector = document.getElementById('lang-selector');
    let currentLang = langSelector.value;

    const elements = {
        mainTitle: document.getElementById('main-title'),
        mainSubtitle: document.getElementById('main-subtitle'),
        topicInput: document.getElementById('topic-input'),
        generateBtn: document.getElementById('generate-btn'),
        loadingText: document.querySelector('#loading p'),
        errorText: document.querySelector('#error p'),
        prosTitle: document.getElementById('pros-title'),
        consTitle: document.getElementById('cons-title'),
        compareTitle: document.getElementById('compare-title'),
        compareFooter: document.getElementById('compare-footer'),
        affiliateLink: document.getElementById('affiliate-link'),
        footerText: document.getElementById('footer-text'),
    };
    
    const translations = {
        'id': {
            mainTitle: "Generator Pro & Kontra",
            mainSubtitle: "Dapatkan analisis keuntungan dan kerugian instan untuk topik apa pun.",
            topicInput: "Masukkan topik, contoh: 'Beli mobil listrik'",
            generateBtn: "Buat Daftar",
            loadingText: "Sedang membuat analisis...",
            errorText: "Maaf, terjadi kesalahan. Silakan coba lagi.",
            prosTitle: "Pro",
            consTitle: "Kontra",
            compareTitle: "Bandingkan Harga",
            compareFooter: "Temukan lebih banyak penawaran dan penjual.",
            affiliateLink: "Lihat di Google Shopping",
            footerText: "&copy; 2025 ProKontra AI. Ditenagai oleh Gemini."
        },
        'en': {
            mainTitle: "Pro & Con Generator",
            mainSubtitle: "Get instant pro and con analysis for any topic.",
            topicInput: "Enter a topic, e.g., 'Buy an electric car'",
            generateBtn: "Generate List",
            loadingText: "Generating analysis...",
            errorText: "Sorry, an error occurred. Please try again.",
            prosTitle: "Pros",
            consTitle: "Cons",
            compareTitle: "Compare Prices",
            compareFooter: "Find more offers and sellers.",
            affiliateLink: "See on Google Shopping",
            footerText: "&copy; 2025 ProContra AI. Powered by Gemini."
        }
    };

    const setLanguage = (lang) => {
        if (!translations[lang]) return;
        currentLang = lang;
        const t = translations[lang];
        elements.mainTitle.textContent = t.mainTitle;
        elements.mainSubtitle.textContent = t.mainSubtitle;
        elements.topicInput.placeholder = t.topicInput;
        elements.generateBtn.textContent = t.generateBtn;
        elements.loadingText.textContent = t.loadingText;
        elements.errorText.textContent = t.errorText;
        elements.prosTitle.textContent = t.prosTitle;
        elements.consTitle.textContent = t.consTitle;
        elements.compareTitle.textContent = t.compareTitle;
        elements.compareFooter.textContent = t.compareFooter;
        elements.affiliateLink.textContent = t.affiliateLink;
        elements.footerText.innerHTML = t.footerText;
    };

    langSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    
    // Initial UI setup
    setLanguage(currentLang);

    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-btn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('result');
    const prosList = document.getElementById('pros-list');
    const consList = document.getElementById('cons-list');
    const affiliateSection = document.getElementById('affiliate-section');
    const affiliateLink = document.getElementById('affiliate-link');
    const priceComparisonList = document.getElementById('price-comparison-list');

    const generateLists = async () => {
        const topic = topicInput.value.trim();
        if (!topic) {
            const errorMsg = currentLang === 'id' ? "Topik tidak boleh kosong." : "Topic cannot be empty.";
            showError(errorMsg);
            return;
        }

        // Reset UI
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        affiliateSection.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic, language: currentLang }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMsg = errorData ? errorData.error : `HTTP error! status: ${response.status}`;
                throw new Error(errorMsg);
            }

            const data = await response.json();
            displayResults(data);

        } catch (err) {
            console.error("Error fetching data:", err);
            showError(err.message || translations[currentLang].errorText);
        } finally {
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    };

    const displayResults = (data) => {
        const { pros, cons, priceComparisons, shoppingLink } = data;
        prosList.innerHTML = '';
        consList.innerHTML = '';
        priceComparisonList.innerHTML = '';

        if (pros && pros.length > 0) {
            pros.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                prosList.appendChild(li);
            });
        } else {
            prosList.innerHTML = `<li>${currentLang === 'id' ? 'Tidak ada pro yang ditemukan.' : 'No pros found.'}</li>`;
        }


        if (cons && cons.length > 0) {
            cons.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                consList.appendChild(li);
            });
        } else {
            consList.innerHTML = `<li>${currentLang === 'id' ? 'Tidak ada kontra yang ditemukan.' : 'No cons found.'}</li>`;
        }

        if (priceComparisons && priceComparisons.length > 0 && shoppingLink) {
            priceComparisons.forEach(item => {
                const priceItem = document.createElement('div');
                priceItem.className = 'price-item';

                const storeSpan = document.createElement('span');
                storeSpan.className = 'store';
                storeSpan.textContent = item.store;

                const priceSpan = document.createElement('span');
                priceSpan.className = 'price';
                priceSpan.textContent = item.price;

                priceItem.appendChild(storeSpan);
                priceItem.appendChild(priceSpan);
                priceComparisonList.appendChild(priceItem);
            });
            
            affiliateLink.href = shoppingLink;
            affiliateSection.classList.remove('hidden');
        } else {
            affiliateSection.classList.add('hidden');
        }

        resultDiv.classList.remove('hidden');
    };

    const showError = (message) => {
        elements.errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    };
    
    generateBtn.addEventListener('click', generateLists);

    topicInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            generateLists();
        }
    });
}); 