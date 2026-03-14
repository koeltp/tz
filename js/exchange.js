// 汇率数据
let exchangeRates = {
    USD: 1,
    CNY: 7.1,
    HKD: 7.8
};
let previousRates = {};
let fromCurrency = 'CNY';
let toCurrency = 'USD';
let activeDropdown = null;

// 货币配置
const currencyConfig = {
    USD: { name: '美元', flag: 'images/icon/us.png', symbol: '$' },
    HKD: { name: '港币', flag: 'images/icon/hk.png', symbol: 'HK$' },
    CNY: { name: '人民币', flag: 'images/icon/cn.png', symbol: '¥' }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    // 初始化汇率数据
    fetchExchangeRates();
    
    // 每30分钟更新一次汇率
    setInterval(fetchExchangeRates, 30 * 60 * 1000);
    
    // 事件监听器
    document.getElementById('convert-amount').addEventListener('input', function() {
        updateConverter('from');
    });
    
    document.getElementById('result-amount').addEventListener('input', function() {
        updateConverter('to');
    });
    
    document.getElementById('from-select').addEventListener('click', function(e) {
        e.stopPropagation();
        showDropdown('from');
    });
    
    document.getElementById('to-select').addEventListener('click', function(e) {
        e.stopPropagation();
        showDropdown('to');
    });
    
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', hideAllDropdowns);
    
    // 初始化下拉菜单项点击事件
    initDropdownItems();
    
    // 初始更新
    updateConverter('from');
    updateExchangeGrid();
    updateLastUpdateTime();
});

// 初始化下拉菜单项点击事件
function initDropdownItems() {
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const currency = this.getAttribute('data-currency');
            const flag = this.getAttribute('data-flag');
            const name = this.getAttribute('data-name');
            
            if (activeDropdown === 'from') {
                fromCurrency = currency;
                document.getElementById('from-flag').src = flag;
                document.getElementById('from-flag').alt = currency;
                document.getElementById('from-code').textContent = currency;
                document.getElementById('from-name').textContent = name;
            } else if (activeDropdown === 'to') {
                toCurrency = currency;
                document.getElementById('to-flag').src = flag;
                document.getElementById('to-flag').alt = currency;
                document.getElementById('to-code').textContent = currency;
                document.getElementById('to-name').textContent = name;
            }
            
            hideAllDropdowns();
            updateConverter('from');
        });
    });
}

// 获取汇率数据
function fetchExchangeRates() {
    const url = 'https://open.er-api.com/v6/latest/USD';
    
    // 保存之前的汇率
    previousRates = { ...exchangeRates };
    
    // 显示更新状态
    document.getElementById('last-update').innerHTML = '<span class="status-indicator updating"><span class="status-dot"></span>正在更新汇率...</span>';
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                exchangeRates = data.rates;
                
                // 更新汇率卡片
                updateExchangeGrid();
                
                // 更新货币转换器
                updateConverter('from');
                
                // 更新最后更新时间
                updateLastUpdateTime();
            } else {
                console.error('获取汇率失败:', data.error);
                document.getElementById('last-update').textContent = '获取汇率失败，使用默认汇率';
                // 使用默认汇率
                useDefaultRates();
            }
        })
        .catch(error => {
            console.error('获取汇率出错:', error);
            document.getElementById('last-update').textContent = '网络错误，使用默认汇率';
            // 使用默认汇率
            useDefaultRates();
        });
}

// 使用默认汇率
function useDefaultRates() {
    exchangeRates = {
        USD: 1,
        CNY: 7.1,
        HKD: 7.8
    };
    updateExchangeGrid();
    updateConverter('from');
    updateLastUpdateTime();
}

// 更新汇率卡片
function updateExchangeGrid() {
    const grid = document.getElementById('exchange-grid');
    grid.innerHTML = '';
    
    const currencyPairs = [
        { from: 'USD', to: 'CNY' },
        { from: 'CNY', to: 'USD' },
        { from: 'USD', to: 'HKD' },
        { from: 'HKD', to: 'USD' },
        { from: 'CNY', to: 'HKD' },
        { from: 'HKD', to: 'CNY' }
    ];
    
    currencyPairs.forEach(pair => {
        const rate = getExchangeRate(pair.from, pair.to);
        const previousRate = getPreviousRate(pair.from, pair.to);
        
        let changeClass = '';
        let changeSymbol = '';
        let change = 0;
        
        if (previousRate) {
            change = ((rate - previousRate) / previousRate) * 100;
            if (change > 0) {
                changeClass = 'positive';
                changeSymbol = '↑';
            } else if (change < 0) {
                changeClass = 'negative';
                changeSymbol = '↓';
            }
        }
        
        const card = document.createElement('div');
        card.className = 'exchange-card';
        card.innerHTML = `
            <div class="currency-pair">
                <div class="currency-from">
                    <img src="${currencyConfig[pair.from].flag}" alt="${pair.from}" style="width: 24px; height: 16px; border-radius: 2px;">
                    <span>${pair.from}</span>
                </div>
                <i class="fas fa-arrow-right exchange-arrow"></i>
                <div class="currency-to">
                    <span>${pair.to}</span>
                    <img src="${currencyConfig[pair.to].flag}" alt="${pair.to}" style="width: 24px; height: 16px; border-radius: 2px;">
                </div>
            </div>
            <div class="exchange-rate">
                ${rate.toFixed(4)}
            </div>
            <div style="text-align: center;">
                <span class="rate-change ${changeClass}">
                    ${changeSymbol} ${Math.abs(change).toFixed(2)}%
                </span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 获取汇率
function getExchangeRate(from, to) {
    if (from === to) return 1;
    if (from === 'USD') return exchangeRates[to];
    if (to === 'USD') return 1 / exchangeRates[from];
    
    // 交叉汇率
    return exchangeRates[to] / exchangeRates[from];
}

// 获取之前的汇率
function getPreviousRate(from, to) {
    if (!previousRates.USD) return null;
    return getExchangeRate(from, to);
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('last-update').textContent = `最后更新: ${timeString}`;
}

// 货币转换
function updateConverter(direction) {
    if (Object.keys(exchangeRates).length === 0) {
        document.getElementById('convert-amount').value = '0';
        document.getElementById('result-amount').value = '0';
        return;
    }

    if (direction === 'from') {
        const amount = parseFloat(document.getElementById('convert-amount').value) || 0;
        const rate = getExchangeRate(fromCurrency, toCurrency);
        const result = amount * rate;
        document.getElementById('result-amount').value = result.toFixed(4);
    } else if (direction === 'to') {
        const amount = parseFloat(document.getElementById('result-amount').value) || 0;
        const rate = getExchangeRate(toCurrency, fromCurrency);
        const result = amount * rate;
        document.getElementById('convert-amount').value = result.toFixed(4);
    }
}

// 交换货币
function swapCurrencies() {
    const temp = fromCurrency;
    fromCurrency = toCurrency;
    toCurrency = temp;
    
    // 交换显示
    const fromFlag = document.getElementById('from-flag').src;
    const fromCode = document.getElementById('from-code').textContent;
    const fromName = document.getElementById('from-name').textContent;
    
    document.getElementById('from-flag').src = document.getElementById('to-flag').src;
    document.getElementById('from-flag').alt = document.getElementById('to-code').textContent;
    document.getElementById('from-code').textContent = document.getElementById('to-code').textContent;
    document.getElementById('from-name').textContent = document.getElementById('to-name').textContent;
    
    document.getElementById('to-flag').src = fromFlag;
    document.getElementById('to-flag').alt = fromCode;
    document.getElementById('to-code').textContent = fromCode;
    document.getElementById('to-name').textContent = fromName;
    
    // 交换金额
    const tempAmount = document.getElementById('convert-amount').value;
    document.getElementById('convert-amount').value = document.getElementById('result-amount').value;
    document.getElementById('result-amount').value = tempAmount;
    
    // 更新转换
    updateConverter('from');
}

// 显示下拉菜单
function showDropdown(type) {
    // 先隐藏所有下拉菜单
    hideAllDropdowns();
    
    const dropdownId = type === 'from' ? 'from-dropdown' : 'to-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    activeDropdown = type;
    dropdown.style.display = 'block';
}

// 隐藏所有下拉菜单
function hideAllDropdowns() {
    document.getElementById('from-dropdown').style.display = 'none';
    document.getElementById('to-dropdown').style.display = 'none';
    activeDropdown = null;
}
