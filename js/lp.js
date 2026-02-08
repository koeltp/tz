// 有限合伙人页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化站点配置
    await App.initSiteConfig();
    
    // 从localStorage加载数据源
    await App.loadSourceFromStorage();
    
    // 监听数据源变化
    window.addEventListener('sourceChanged', async function() {
        await loadLPData();
    });
    
    // 加载LP数据
    await loadLPData();
});

// 加载LP数据
async function loadLPData() {
    const lpListContainer = document.getElementById('lp-list');
    const lpHeader = document.querySelector('.lp-header');
    if (!lpListContainer) return;
    
    // 获取当前数据源
    const source = App.getCurrentSource();
    
    // 显示加载状态
    lpListContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>加载LP数据中...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`data/lp/${source}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const lpData = await response.json();
        
        // 更新页面标题
        updateLPHeader(source);
        
        // 渲染LP列表
        renderLPList(lpData);
        
    } catch (error) {
        console.error('加载LP数据失败:', error);
        lpListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>无法加载LP数据，请检查网络连接</p>
            </div>
        `;
    }
}

// 更新LP页面标题
function updateLPHeader(source) {
    const lpHeader = document.querySelector('.lp-header');
    if (!lpHeader) return;
    
    const sourceName = App.getCurrentSourceName();
    lpHeader.innerHTML = `
        <h1><i class="fas fa-users"></i> ${sourceName} - 有限合伙人 (LP) 列表</h1>
        <p class="lp-subtitle">展示${sourceName}的投资者信息和投资情况</p>
    `;
    
    // 更新页面标题
    document.title = `${sourceName} - 有限合伙人 (LP) 列表`;
}

// 渲染LP列表
function renderLPList(lpData) {
    const lpListContainer = document.getElementById('lp-list');
    if (!lpListContainer) return;
    
    lpListContainer.innerHTML = '';
    
    if (!lpData || lpData.length === 0) {
        lpListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>暂无LP数据</h3>
                <p>还没有添加任何有限合伙人</p>
            </div>
        `;
        return;
    }
    
    // 按ID的大小排序
    const sortedLPData = [...lpData].sort((a, b) => {
        // 提取ID中的数字部分进行比较
        const idA = parseInt(a.id.split('-')[1]);
        const idB = parseInt(b.id.split('-')[1]);
        return idA - idB;
    });
    
    sortedLPData.forEach(lp => {
        const lpCard = document.createElement('div');
        lpCard.className = 'lp-card';
        
        const avatarPath = `images/lp/${lp.avatar || 'default.png'}`;
        
        // 使用site.json中的currencyLocales映射
        const currency = lp.currency || 'CNY';
        const locale = App.siteConfig?.currencyLocales?.[currency] || (currency === 'USD' ? 'en-US' : 'zh-CN');
        
        const formattedInvestment = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(lp.investment);
        
        lpCard.innerHTML = `
            <div class="lp-avatar">
                <img src="${avatarPath}" alt="${lp.name}的头像" />
            </div>
            <h3 class="lp-name">${lp.name}</h3>
            <p class="lp-role">${lp.role || '有限合伙人'}</p>
            <p class="lp-investment">投资金额: ${formattedInvestment}</p>
            <p class="lp-join-date">加入日期: ${App.formatDate(lp.joinDate)}</p>
        `;
        
        lpListContainer.appendChild(lpCard);
    });
}