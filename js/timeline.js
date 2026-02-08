// 时光机页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化站点配置
    await App.initSiteConfig();
    // 加载时光机数据
    await loadTimelineData();
});

// 加载时光机数据
async function loadTimelineData() {
    const timelineContainer = document.querySelector('.timeline');
    const timelineHeader = document.querySelector('.timeline-header');
    
    if (!timelineContainer) return;
    
    try {
        // 根据当前数据源加载对应的timeline数据
        const source = App.getCurrentSource();
        const response = await fetch(`data/timeline/${source}.json`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const timelineData = await response.json();
        
        // 更新页面标题
        updateTimelineHeader(source);
        
        // 渲染timeline数据
        renderTimeline(timelineData);
        
    } catch (error) {
        console.error('加载时光机数据失败:', error);
        timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>无法加载时光机数据，请检查网络连接</p>
            </div>
        `;
    }
}

// 更新时光机标题
function updateTimelineHeader(source) {
    const timelineHeader = document.querySelector('.timeline-header');
    if (!timelineHeader) return;
    
    const sourceName = App.getCurrentSourceName();
    timelineHeader.innerHTML = `
        <h1><i class="fas fa-hourglass-half"></i> <span>${sourceName}</span> 时光机</h1>
        <p class="timeline-subtitle">记录投资历程中的重要时刻与里程碑</p>
    `;
    
    // 更新页面标题
    document.title = `${sourceName}时光机 - 投资历程记录与时间线分析`;
}

// 渲染timeline数据
function renderTimeline(timelineData) {
    const timelineContainer = document.querySelector('.timeline');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = '';
    
    if (!timelineData || timelineData.length === 0) {
        timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>暂无时光机数据</h3>
                <p>还没有记录任何时光机事件</p>
            </div>
        `;
        return;
    }
    
    // 按日期排序（从新到旧）
    const sortedData = [...timelineData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedData.forEach(item => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const formattedDate = App.formatDate(item.date);
        
        timelineItem.innerHTML = `
            <div class="timeline-date">
                <span class="date-badge">${formattedDate}</span>
            </div>
            <div class="timeline-point"></div>
            <div class="timeline-content">
                <p class="timeline-description">
                    ${item.description}
                </p>
            </div>
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
}