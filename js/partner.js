// Partner页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 监听数据源变化
    window.addEventListener('sourceChanged', async function() {
        await loadPartnerData();
    });
    
    // 确保数据源已经初始化
    setTimeout(async function() {
        if (App.getCurrentSource()) {
            // 数据源已初始化，直接加载
            await loadPartnerData();
        } else {
            // 数据源未初始化，尝试初始化
            await App.initSiteConfig();
            await App.loadSourceFromStorage();
            await loadPartnerData();
        }
    }, 100);
});

// 加载Partner数据
async function loadPartnerData() {
    const partnerListContainer = document.getElementById('partner-list');
    if (!partnerListContainer) return;
    
    // 获取当前数据源
    const source = App.getCurrentSource();
    
    // 检查数据源是否有效
    if (!source) {
        partnerListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>数据源配置错误</h3>
                <p>无法获取有效的数据源配置，请刷新页面重试</p>
            </div>
        `;
        return;
    }
    
    // 显示加载状态
    partnerListContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>加载Partner数据中...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`data/partner/${source}.json`);
        if (!response.ok) {
            // 如果文件不存在，显示暂无数据
            if (response.status === 404) {
                partnerListContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>暂无Partner数据</h3>
                        <p>该数据源下还没有添加任何合伙人</p>
                    </div>
                `;
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const partnerData = await response.json();
        
        // 更新页面标题
        updatePartnerHeader(source);
        
        // 渲染Partner列表
        renderPartnerList(partnerData);
        
    } catch (error) {
        console.error('加载Partner数据失败:', error);
        partnerListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>无法加载Partner数据，请检查网络连接</p>
            </div>
        `;
    }
}

// 更新Partner页面标题
function updatePartnerHeader(source) {
    const partnerHeader = document.querySelector('.partner-header');
    if (!partnerHeader) return;
    
    const sourceName = App.getCurrentSourceName();
    partnerHeader.innerHTML = `
        <h1><i class="fas fa-users"></i> ${sourceName} - Partner (合伙人) 列表</h1>
        <p class="partner-subtitle">展示${sourceName}的投资者信息和投资情况</p>
    `;
    
    // 更新页面标题
    document.title = `${sourceName} - Partner (合伙人) 列表`;
}

// 渲染Partner列表
function renderPartnerList(partnerData) {
    const partnerListContainer = document.getElementById('partner-list');
    if (!partnerListContainer) return;
    
    partnerListContainer.innerHTML = '';
    
    if (!partnerData || partnerData.length === 0) {
        partnerListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>暂无Partner数据</h3>
                <p>还没有添加任何合伙人</p>
            </div>
        `;
        return;
    }
    
    // 按ID的大小排序
    const sortedPartnerData = [...partnerData].sort((a, b) => {
        // 提取ID中的数字部分进行比较
        const idA = parseInt(a.id.split('-')[1]);
        const idB = parseInt(b.id.split('-')[1]);
        return idA - idB;
    });
    
    sortedPartnerData.forEach(partner => {
        const partnerCard = document.createElement('div');
        partnerCard.className = 'partner-card';
        
        const avatarPath = `images/partner/${partner.avatar || 'default.png'}`;
        
        // 使用site.json中的currencyLocales映射
        const currency = partner.currency || 'CNY';
        const locale = App.siteConfig?.currencyLocales?.[currency] || (currency === 'USD' ? 'en-US' : 'zh-CN');
        
        const formattedInvestment = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(partner.investment);
        
        partnerCard.innerHTML = `
            <div class="partner-avatar">
                <img src="${avatarPath}" alt="${partner.name}的头像" />
            </div>
            <h3 class="partner-name">${partner.name}</h3>
            <p class="partner-role">${partner.role || '有限合伙人'}</p>
            <p class="partner-investment">投资金额: ${formattedInvestment}</p>
            <p class="partner-join-date">加入日期: ${App.formatDate(partner.joinDate)}</p>
        `;
        
        partnerListContainer.appendChild(partnerCard);
    });
}