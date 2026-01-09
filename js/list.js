// 周报列表页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 加载投资总览数据
    const summary = await App.loadSummary();
    
    // 更新概览数据
    updateSummary(summary);
    
    // 获取并更新周报列表
    await updateWeeklyReportsList();
});

// 更新概览数据
function updateSummary(summary) {
    document.getElementById('initial-investment').textContent = 
        App.formatCurrency(summary.initialInvestment);
    
    // 总资产和累计收益将在周报列表加载后计算
}

// 更新周报列表
async function updateWeeklyReportsList() {
    const reportsList = document.getElementById('reports-list');
    reportsList.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>加载周报数据中...</span>
        </div>
    `;
    
    try {
        // 获取所有周报
        const reports = await App.getAllWeeklyReports();
        
        if (!reports || reports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>暂无周报数据</h3>
                    <p>尚未添加任何投资周报记录</p>
                </div>
            `;
            return;
        }
        
        // 计算累计总资产（最新一周的总资产）
        const totalAssets = reports.length > 0 ? reports[0].totalAssets : 0;
        
        // 计算累计收益
        const summary = await App.loadSummary();
        const totalReturn = totalAssets - summary.initialInvestment;
        const totalReturnRate = (totalReturn / summary.initialInvestment) * 100;
        
        // 更新总览数据
        document.getElementById('total-assets').textContent = 
            App.formatCurrency(totalAssets);
        
        document.getElementById('total-return').textContent = 
            App.formatCurrency(totalReturn);
        
        const totalChangeElement = document.getElementById('total-change');
        totalChangeElement.textContent = App.formatPercent(totalReturnRate);
        totalChangeElement.parentElement.className = 
            `stat-change ${totalReturn >= 0 ? 'positive' : 'negative'}`;
        
        // 渲染周报列表
        renderReportsList(reports);
        
    } catch (error) {
        console.error('更新周报列表失败:', error);
        reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>无法加载周报数据，请检查网络连接</p>
            </div>
        `;
    }
}

// 渲染周报列表
function renderReportsList(reports) {
    const reportsList = document.getElementById('reports-list');
    reportsList.innerHTML = '';
    
    reports.forEach((report, index) => {
        const reportElement = document.createElement('div');
        reportElement.className = 'report-card';
        reportElement.dataset.id = report.id;
        
        // 解析日期范围
        const [startDate, endDate] = report.dateRange.split(' 至 ');
        const formattedStartDate = App.formatDate(startDate);
        const formattedEndDate = App.formatDate(endDate);
        
        // 计算周度收益
        let weeklyChange = { amount: 0, percent: 0 };
        if (index < reports.length - 1) {
            const previousReport = reports[index + 1];
            weeklyChange = App.calculateWeeklyChange(report, previousReport);
        }
        
        reportElement.innerHTML = `
            <div>
                <div class="report-title">${report.year}年第${report.weekNumber}周</div>
                <div class="report-date">${formattedStartDate} - ${formattedEndDate}</div>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="report-stat-label">总资产</span>
                    <span class="report-stat-value">${App.formatCurrency(report.totalAssets)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-label">周度收益</span>
                    <span class="report-stat-value ${weeklyChange.amount >= 0 ? 'positive' : 'negative'}">
                        ${weeklyChange.amount >= 0 ? '+' : ''}${App.formatCurrency(weeklyChange.amount)}
                    </span>
                </div>
            </div>
        `;
        
        // 点击整个卡片进入详情
        reportElement.addEventListener('click', function() {
            window.location.href = `detail.html?id=${report.id}`;
        });
        
        reportsList.appendChild(reportElement);
    });
}