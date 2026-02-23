// Metal Prices App - Gold Price Focus
const TROY_OZ_TO_GRAM = 31.1035;
const TROY_OZ_TO_KG = 0.0311035;
const OZ_PER_KG = 32.1507;

// Translations
const i18n = {
    en: {
        gold: 'Gold', silver: 'Silver', platinum: 'Platinum', palladium: 'Palladium',
        calculator: 'Calculator', updated: 'Updated every 60s • Data for informational purposes'
    },
    de: {
        gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
        calculator: 'Rechner', updated: 'Alle 60s aktualisiert • Nur zu Informationszwecken'
    },
    es: {
        gold: 'Oro', silver: 'Plata', platinum: 'Platino', palladium: 'Paladio',
        calculator: 'Calculadora', updated: 'Actualizado cada 60s • Datos solo informativos'
    },
    fr: {
        gold: 'Or', silver: 'Argent', platinum: 'Platine', palladium: 'Palladium',
        calculator: 'Calculatrice', updated: 'Mise à jour toutes les 60s • Données informatives'
    },
    it: {
        gold: 'Oro', silver: 'Argento', platinum: 'Platino', palladium: 'Palladio',
        calculator: 'Calcolatrice', updated: 'Aggiornato ogni 60s • Dati solo informativi'
    },
    pt: {
        gold: 'Ouro', silver: 'Prata', platinum: 'Platina', palladium: 'Paládio',
        calculator: 'Calculadora', updated: 'Atualizado a cada 60s • Dados informativos'
    },
    zh: {
        gold: '黄金', silver: '白银', platinum: '铂金', palladium: '钯金',
        calculator: '计算器', updated: '每60秒更新 • 仅供参考'
    },
    ja: {
        gold: '金', silver: '銀', platinum: 'プラチナ', palladium: 'パラジウム',
        calculator: '計算機', updated: '60秒ごとに更新 • 情報提供のみ'
    },
    hi: {
        gold: 'सोना', silver: 'चांदी', platinum: 'प्लैटिनम', palladium: 'पैलेडियम',
        calculator: 'कैलकुलेटर', updated: 'हर 60 सेकंड में अपडेट • केवल सूचना के लिए'
    },
    tr: {
        gold: 'Altın', silver: 'Gümüş', platinum: 'Platin', palladium: 'Paladyum',
        calculator: 'Hesap Makinesi', updated: 'Her 60 saniyede güncellenir • Bilgi amaçlı'
    },
    ru: {
        gold: 'Золото', silver: 'Серебро', platinum: 'Платина', palladium: 'Палладий',
        calculator: 'Калькулятор', updated: 'Обновляется каждые 60с • Только для информации'
    },
    ms: {
        gold: 'Emas', silver: 'Perak', platinum: 'Platinum', palladium: 'Paladium',
        calculator: 'Kalkulator', updated: 'Dikemas kini setiap 60s • Data untuk maklumat sahaja'
    }
};

let currentLang = 'en';

let prices = {
    gold: { price: 0, change: 0, changePct: 0, high: 0, low: 0 },
    silver: { price: 0, change: 0, changePct: 0, high: 0, low: 0 },
    platinum: { price: 0, change: 0, changePct: 0, high: 0, low: 0 },
    palladium: { price: 0, change: 0, changePct: 0, high: 0, low: 0 }
};

let currentCurrency = 'USD';
let currencyRates = { USD: 1, EUR: 0.84, GBP: 0.73, CNY: 7.25, INR: 90.74, MYR: 3.92, AUD: 1.40, CAD: 1.36 };
let selectedMetal = 'gold';

// Get text in current language
function t(key) {
    return i18n[currentLang]?.[key] || i18n.en[key] || key;
}

// Apply translations to UI
function applyTranslations() {
    // Metal tabs
    const tabGold = document.querySelector('#tab-gold .text-xs');
    const tabSilver = document.querySelector('#tab-silver .text-xs');
    const tabPlatinum = document.querySelector('#tab-platinum .text-xs');
    const tabPalladium = document.querySelector('#tab-palladium .text-xs');
    
    if (tabGold) tabGold.textContent = t('gold');
    if (tabSilver) tabSilver.textContent = t('silver');
    if (tabPlatinum) tabPlatinum.textContent = t('platinum');
    if (tabPalladium) tabPalladium.textContent = t('palladium');
    
    // All elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Footer
    const footerP = document.querySelector('footer p');
    if (footerP) footerP.textContent = t('updated');
    
    // Update metal name if needed
    if (prices[selectedMetal]) updateUI();
}

const metalConfig = {
    gold: { name: 'Gold', code: 'XAU/USD', tvSymbol: 'TVC:GOLD', color: '#FFD700', borderColor: 'border-yellow-500/50', bgColor: 'bg-yellow-500/20' },
    silver: { name: 'Silver', code: 'XAG/USD', tvSymbol: 'TVC:SILVER', color: '#C0C0C0', borderColor: 'border-slate-400/50', bgColor: 'bg-slate-400/20' },
    platinum: { name: 'Platinum', code: 'XPT/USD', tvSymbol: 'TVC:PLATINUM', color: '#60A5FA', borderColor: 'border-blue-400/50', bgColor: 'bg-blue-400/20' },
    palladium: { name: 'Palladium', code: 'XPD/USD', tvSymbol: 'TVC:PALLADIUM', color: '#E2E8F0', borderColor: 'border-slate-300/50', bgColor: 'bg-slate-300/20' }
};

// Fetch prices from Kitco
async function fetchPrices() {
    const symbols = { gold: 'AU', silver: 'AG', platinum: 'PT', palladium: 'PD' };
    
    for (const [metal, symbol] of Object.entries(symbols)) {
        try {
            const response = await fetch(`https://proxy.kitco.com/getPM?symbol=${symbol}&currency=USD`);
            const text = await response.text();
            const parts = text.split(',');
            
            if (parts.length >= 11) {
                prices[metal] = {
                    price: parseFloat(parts[4]) || 0,
                    change: parseFloat(parts[7]) || 0,
                    changePct: parseFloat(parts[8]) || 0,
                    low: parseFloat(parts[9]) || 0,
                    high: parseFloat(parts[10]) || 0
                };
            }
        } catch (e) {
            console.log(`Error fetching ${metal}:`, e);
        }
    }
    
    updateUI();
    updateLastUpdated();
}

function selectMetal(metal) {
    selectedMetal = metal;
    
    // Update tabs
    ['gold', 'silver', 'platinum', 'palladium'].forEach(m => {
        const tab = document.getElementById(`tab-${m}`);
        if (!tab) return;
        const config = metalConfig[m];
        if (m === metal) {
            tab.className = `metal-tab flex-1 py-3 px-4 rounded-xl ${config.bgColor} border-2 ${config.borderColor} active`;
        } else {
            tab.className = 'metal-tab flex-1 py-3 px-4 rounded-xl bg-slate-700/50 border-2 border-transparent';
        }
    });
    
    updateUI();
    loadTradingViewChart();
}

function updateUI() {
    const rate = currencyRates[currentCurrency];
    const symbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥', INR: '₹', MYR: 'RM', AUD: 'A$', CAD: 'C$' };
    const symbol = symbols[currentCurrency] || '$';
    const data = prices[selectedMetal];
    const config = metalConfig[selectedMetal];
    
    if (!data || !data.price) return;
    
    // Metal name and code
    const metalNameEl = document.getElementById('metalName');
    const metalCodeEl = document.getElementById('metalCode');
    if (metalNameEl) metalNameEl.textContent = t(selectedMetal);
    if (metalCodeEl) metalCodeEl.textContent = config.code;
    
    // Price
    const price = data.price * rate;
    const change = data.change * rate;
    const changePct = data.changePct || 0;
    
    const metalPriceEl = document.getElementById('metalPrice');
    if (metalPriceEl) metalPriceEl.textContent = `${symbol}${price.toFixed(2)}`;
    
    const changeEl = document.getElementById('metalChange');
    if (changeEl) {
        changeEl.textContent = change >= 0 ? `+${symbol}${Math.abs(change).toFixed(2)}` : `-${symbol}${Math.abs(change).toFixed(2)}`;
        changeEl.className = `text-sm ${change >= 0 ? 'price-up' : 'price-down'}`;
    }
    
    const pctEl = document.getElementById('metalChangePct');
    if (pctEl) {
        pctEl.textContent = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
        pctEl.className = `text-xs px-2 py-0.5 rounded-full ${changePct >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`;
    }
    
    // Unit prices
    const priceOz = data.price * rate;
    const priceGram = priceOz / TROY_OZ_TO_GRAM;
    const priceKg = priceOz * OZ_PER_KG;
    
    const priceOzEl = document.getElementById('priceOz');
    const priceGramEl = document.getElementById('priceGram');
    const priceKgEl = document.getElementById('priceKg');
    
    if (priceOzEl) priceOzEl.textContent = `${symbol}${priceOz.toFixed(2)}`;
    if (priceGramEl) priceGramEl.textContent = `${symbol}${priceGram.toFixed(2)}`;
    if (priceKgEl) priceKgEl.textContent = `${symbol}${priceKg.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    
    // All metals sidebar prices
    ['gold', 'silver', 'platinum', 'palladium'].forEach(metal => {
        const priceEl = document.getElementById(`${metal}Price`);
        const changeEl = document.getElementById(`${metal}Change`);
        
        if (priceEl && prices[metal]) {
            const p = prices[metal].price * rate;
            priceEl.textContent = `${symbol}${p.toFixed(2)}`;
        }
        if (changeEl && prices[metal]) {
            const pct = prices[metal].changePct || 0;
            changeEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
            changeEl.className = `text-xs ml-2 ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`;
        }
    });
    
    // Gold/Silver ratio
    const ratioEl = document.getElementById('goldSilverRatio');
    if (ratioEl && prices.gold.price > 0 && prices.silver.price > 0) {
        const ratio = prices.gold.price / prices.silver.price;
        ratioEl.textContent = `${ratio.toFixed(1)} oz Silver`;
    }
    
    updateCalculator();
}

function updateLastUpdated() {
    const el = document.getElementById('lastUpdate');
    if (el) el.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// TradingView Chart
let isDark = true;

function loadTradingViewChart() {
    const container = document.getElementById('tradingview-widget');
    if (!container) return;
    
    const config = metalConfig[selectedMetal];
    const theme = isDark ? 'dark' : 'light';
    
    container.innerHTML = `<iframe 
        src="https://www.tradingview.com/widgetembed/?symbol=${config.tvSymbol}&interval=60&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=000000&studies=[]&theme=${theme}&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en"
        style="width:100%;height:100%;border:none;"
        allowtransparency="true"
        frameborder="0"
        allowfullscreen
    ></iframe>`;
}

// Calculator
function updateCalculator() {
    const amountEl = document.getElementById('calcAmount');
    const unitEl = document.getElementById('calcUnit');
    const resultEl = document.getElementById('calcResult');
    
    if (!amountEl || !unitEl || !resultEl) return;
    
    const amount = parseFloat(amountEl.value) || 0;
    const unit = unitEl.value;
    const pricePerOz = prices[selectedMetal].price;
    
    let value;
    if (unit === 'oz') value = pricePerOz * amount;
    else if (unit === 'gram') value = (pricePerOz / TROY_OZ_TO_GRAM) * amount;
    else value = (pricePerOz / TROY_OZ_TO_KG) * amount;
    
    const rate = currencyRates[currentCurrency];
    const symbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥', INR: '₹', MYR: 'RM', AUD: 'A$', CAD: 'C$' };
    const symbol = symbols[currentCurrency] || '$';
    
    const locale = currentCurrency === 'INR' ? 'en-IN' : 'en-US';
    resultEl.textContent = `${symbol}${(value * rate).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Theme toggle
function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('light', !isDark);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = isDark ? '🌙' : '☀️';
    loadTradingViewChart();
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
    toggleTheme();
}

// Events
const currencyEl = document.getElementById('currency');
if (currencyEl) {
    currencyEl.addEventListener('change', e => { 
        currentCurrency = e.target.value; 
        localStorage.setItem('currency', currentCurrency);
        updateUI(); 
    });
}

const langEl = document.getElementById('language');
if (langEl) {
    langEl.addEventListener('change', e => { 
        currentLang = e.target.value; 
        localStorage.setItem('lang', currentLang);
        applyTranslations();
    });
}

const calcAmountEl = document.getElementById('calcAmount');
const calcUnitEl = document.getElementById('calcUnit');
if (calcAmountEl) calcAmountEl.addEventListener('input', updateCalculator);
if (calcUnitEl) calcUnitEl.addEventListener('change', updateCalculator);

// Detect language
function detectLanguage() {
    if (window.pageLang && i18n[window.pageLang]) return window.pageLang;
    const saved = localStorage.getItem('lang');
    if (saved && i18n[saved]) return saved;
    const browserLang = navigator.language.split('-')[0];
    if (i18n[browserLang]) return browserLang;
    return 'en';
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    currentLang = detectLanguage();
    const langSelect = document.getElementById('language');
    if (langSelect) langSelect.value = currentLang;
    
    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
        currentCurrency = savedCurrency;
        const currEl = document.getElementById('currency');
        if (currEl) currEl.value = savedCurrency;
    }
    
    // Fetch forex rates
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates) {
            currencyRates.EUR = data.rates.EUR || 0.84;
            currencyRates.GBP = data.rates.GBP || 0.73;
            currencyRates.INR = data.rates.INR || 90.74;
            currencyRates.MYR = data.rates.MYR || 3.92;
            currencyRates.AUD = data.rates.AUD || 1.40;
            currencyRates.CAD = data.rates.CAD || 1.36;
        }
    } catch (e) {
        console.log('Using default forex rates');
    }
    
    applyTranslations();
    loadTradingViewChart();
    await fetchPrices();
    setInterval(fetchPrices, 60000);
});
