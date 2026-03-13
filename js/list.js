// 周报列表页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 加载投资总览数据
    const summary = await App.loadSummary();
    
    // 更新概览数据
    updateSummary(summary);
    
    // 获取并更新周报列表
    await updateWeeklyReportsList();
    
    // 加载并更新资金流水数据
    await updateCashFlowsList();
});

// 更新概览数据
function updateSummary(summary) {
    document.getElementById('initial-investment').textContent = 
        App.formatCurrency(summary.adjustedInvestment || summary.initialInvestment);
    
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
        
        // 计算累计收益（考虑资金流水）
        const summary = await App.loadSummary();
        const adjustedInvestment = summary.adjustedInvestment || summary.initialInvestment;
        const totalReturn = totalAssets - adjustedInvestment;
        const totalReturnRate = adjustedInvestment > 0 ? (totalReturn / adjustedInvestment) * 100 : 0;
        
        // 更新总览数据
        document.getElementById('total-assets').textContent = 
            App.formatCurrency(totalAssets);
        
        const totalReturnElement = document.getElementById('total-return');
        totalReturnElement.textContent = App.formatCurrency(totalReturn);
        totalReturnElement.className = 
            `stat-value ${totalReturn >= 0 ? 'positive' : 'negative'}`;
        
        const totalChangeElement = document.getElementById('total-change');
        totalChangeElement.textContent = App.formatPercent(totalReturnRate);
        totalChangeElement.parentElement.className = 
            `stat-change ${totalReturn >= 0 ? 'positive' : 'negative'}`;
        
        // 渲染周报列表
        await renderReportsList(reports);
        
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
async function renderReportsList(reports) {
    const reportsList = document.getElementById('reports-list');
    reportsList.innerHTML = '';
    
    // 计算所有周报的周度收益
    const reportsWithWeeklyChange = await Promise.all(reports.map(async (report, index) => {
        let weeklyChange = { amount: 0, percent: 0 };
        if (index < reports.length - 1) {
            const previousReport = reports[index + 1];
            // 使用完整的周度收益计算（排除资金转入转出）
            try {
                weeklyChange = await App.calculateWeeklyChange(report, previousReport);
            } catch (error) {
                console.error('计算周度收益失败:', error);
                // 计算失败时使用简化计算
                weeklyChange = {
                    amount: report.totalAssets - previousReport.totalAssets,
                    percent: previousReport.totalAssets > 0 ? ((report.totalAssets - previousReport.totalAssets) / previousReport.totalAssets) * 100 : 0
                };
            }
        }
        return { ...report, weeklyChange };
    }));
    
    // 渲染周报列表
    reportsWithWeeklyChange.forEach((report, index) => {
        const reportElement = document.createElement('div');
        reportElement.className = 'report-card';
        reportElement.dataset.id = report.id;
        
        // 解析日期范围
        const [startDate, endDate] = report.dateRange.split(' 至 ');
        const formattedStartDate = App.formatDate(startDate);
        const formattedEndDate = App.formatDate(endDate);
        
        // 使用<a>标签替代div点击事件，优化SEO
        const aTag = document.createElement('a');
        aTag.href = `detail.html?id=${report.id}`;
        aTag.className = 'report-link';
        
        aTag.innerHTML = `
            <div>
                <div class="report-title">${report.year}年第${report.weekNumber}周投资周报</div>
                <div class="report-date">${formattedStartDate} - ${formattedEndDate}</div>
                <div class="report-update-date">更新日期：${App.formatDateTime(report.updateDate)}</div>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="report-stat-label">总资产</span>
                    <span class="report-stat-value">${App.formatCurrency(report.totalAssets)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-label">周度收益</span>
                    <span class="report-stat-value ${report.weeklyChange.amount >= 0 ? 'positive' : 'negative'}">
                        ${report.weeklyChange.amount >= 0 ? '+' : ''}${App.formatCurrency(report.weeklyChange.amount)}
                    </span>
                </div>
            </div>
        `;
        
        reportElement.appendChild(aTag);
        
        reportsList.appendChild(reportElement);
    });
}

// 更新资金流水列表
async function updateCashFlowsList() {
    const cashFlowsList = document.getElementById('cash-flows-list');
    const cashFlowsCount = document.getElementById('cash-flows-count');
    
    // 检查元素是否存在
    if (!cashFlowsList || !cashFlowsCount) {
        console.warn('资金流水相关元素不存在');
        return;
    }
    
    try {
        // 从新的资金流水文件加载数据
        const cashFlows = await App.loadCashFlows(App.currentSource);
        
        if (!cashFlows || cashFlows.length === 0) {
            cashFlowsCount.textContent = '0 笔流水';
            cashFlowsList.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        暂无资金流水记录
                    </td>
                </tr>
            `;
            return;
        }
        
        cashFlowsCount.textContent = `${cashFlows.length} 笔流水`;
        cashFlowsList.innerHTML = '';
        
        // 按日期排序（从新到旧）
        const sortedCashFlows = [...cashFlows].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        sortedCashFlows.forEach(flow => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${App.formatDate(flow.date)}</td>
                <td>
                    <span class="badge ${flow.type === '转入' ? 'cash-in' : 'cash-out'}">
                        ${flow.type}
                    </span>
                </td>
                <td>${App.formatCurrency(flow.amount)}</td>
                <td>${flow.description || '-'}</td>
            `;
            
            cashFlowsList.appendChild(row);
        });
    } catch (error) {
        console.error('加载资金流水失败:', error);
        // 确保元素存在后再设置内容
        if (cashFlowsCount) {
            cashFlowsCount.textContent = '0 笔流水';
        }
        if (cashFlowsList) {
            cashFlowsList.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        加载资金流水失败
                    </td>
                </tr>
            `;
        }
    }
}