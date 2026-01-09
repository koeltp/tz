// 周报详情页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 获取周报ID
    const reportId = App.getReportId();
    
    if (!reportId) {
        // 如果没有ID，尝试加载最新周报
        const latestWeekId = await App.getLatestWeekId();
        
        if (latestWeekId) {
            window.location.href = `detail.html?id=${latestWeekId}`;
            return;
        } else {
            showError('未指定周报ID且无最新周报数据');
            return;
        }
    }
    
    try {
        // 获取所有周报
        const allReports = await App.getAllWeeklyReports();
        
        if (!allReports || allReports.length === 0) {
            showError('暂无周报数据');
            return;
        }
        
        // 查找当前周报
        const currentReport = allReports.find(r => r.id === reportId);
        
        if (!currentReport) {
            showError('未找到指定的周报数据');
            return;
        }
        
        // 计算周度收益和可用资金
        const currentReportWithCalculations = calculateWeeklyData(currentReport, allReports);
        
        // 显示周报详情
        displayWeeklyReport(currentReportWithCalculations);
        
        // 设置导航按钮
        setupNavigation(allReports, reportId);
        
    } catch (error) {
        console.error('加载周报详情失败:', error);
        showError('加载周报数据失败，请检查网络连接');
    }
});

// 计算周度数据
function calculateWeeklyData(currentReport, allReports) {
    const result = { ...currentReport };
    
    // 查找当前报告的索引
    const currentIndex = allReports.findIndex(r => r.id === currentReport.id);
    
    // 计算周度收益
    if (currentIndex < allReports.length - 1) {
        const previousReport = allReports[currentIndex + 1];
        const weeklyChange = App.calculateWeeklyChange(currentReport, previousReport);
        result.weeklyChangeAmount = weeklyChange.amount;
        result.weeklyChangePercent = weeklyChange.percent;
    } else {
        // 如果是第一份周报（最旧的），没有前一周数据
        result.weeklyChangeAmount = 0;
        result.weeklyChangePercent = 0;
    }
    
    // 计算可用资金
    result.availableFunds = currentReport.totalAssets - currentReport.totalMarketValue;
    
    return result;
}

// 显示周报详情
function displayWeeklyReport(report) {
    // 更新周报标题
    updateWeekHeader(report);
    
    // 更新周度统计
    updateWeekStats(report);
    
    // 更新持仓列表
    updateHoldingsList(report.holdings);
    
    // 更新交易列表
    updateTransactionsList(report.weeklyTransactions);
}

// 更新周报标题
function updateWeekHeader(report) {
    const weekHeader = document.getElementById('week-header');
    
    // 解析日期范围
    const [startDate, endDate] = report.dateRange.split(' 至 ');
    const formattedStartDate = App.formatDate(startDate);
    const formattedEndDate = App.formatDate(endDate);
    
    weekHeader.innerHTML = `
        <h1 class="week-title">${report.year}年第${report.weekNumber}周投资周报</h1>
        <p class="week-subtitle">${formattedStartDate} - ${formattedEndDate}</p>
    `;
}

// 更新周度统计
function updateWeekStats(report) {
    document.getElementById('week-total-assets').textContent = 
        App.formatCurrency(report.totalAssets);
    
    document.getElementById('week-market-value').textContent = 
        App.formatCurrency(report.totalMarketValue);
    
    document.getElementById('week-available-funds').textContent = 
        App.formatCurrency(report.availableFunds);
    
    const weekChangeElement = document.getElementById('week-change');
    weekChangeElement.textContent = `${report.weeklyChangeAmount >= 0 ? '+' : ''}${App.formatCurrency(report.weeklyChangeAmount)}`;
    weekChangeElement.className = `stat-value ${report.weeklyChangeAmount >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('week-change-percent').textContent = 
        App.formatPercent(report.weeklyChangePercent);
    
    const changePercentElement = document.getElementById('week-change-percent');
    changePercentElement.parentElement.className = 
        `stat-change ${report.weeklyChangePercent >= 0 ? 'positive' : 'negative'}`;
}

// 更新持仓列表
function updateHoldingsList(holdings) {
    const holdingsList = document.getElementById('holdings-list');
    const holdingsCount = document.getElementById('holdings-count');
    
    if (!holdings || holdings.length === 0) {
        holdingsCount.textContent = '0 只股票';
        holdingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>本周暂无持仓记录</p>
            </div>
        `;
        return;
    }
    
    holdingsCount.textContent = `${holdings.length} 只股票`;
    holdingsList.innerHTML = '';
    
    // 按占比排序
    const sortedHoldings = [...holdings].sort((a, b) => b.weight - a.weight);
    
    sortedHoldings.forEach(holding => {
        const holdingElement = document.createElement('div');
        holdingElement.className = 'holding-item';
        holdingElement.innerHTML = `
            <span class="holding-name">${holding.name}</span>
            <span class="holding-weight">${holding.weight.toFixed(1)}%</span>
        `;
        
        holdingsList.appendChild(holdingElement);
    });
}

// 更新交易列表
function updateTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    const transactionsCount = document.getElementById('transactions-count');
    
    if (!transactions || transactions.length === 0) {
        transactionsCount.textContent = '0 笔交易';
        transactionsList.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    本周暂无交易记录
                </td>
            </tr>
        `;
        return;
    }
    
    transactionsCount.textContent = `${transactions.length} 笔交易`;
    transactionsList.innerHTML = '';
    
    // 按日期排序（从新到旧）
    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${App.formatDate(transaction.date)}</td>
            <td>
                <span class="badge ${transaction.type === '买入' ? 'buy' : 'sell'}">
                    ${transaction.type}
                </span>
            </td>
            <td>${transaction.stockName}</td>
        `;
        
        transactionsList.appendChild(row);
    });
}

// 设置导航按钮
function setupNavigation(allReports, currentReportId) {
    if (!allReports || allReports.length === 0) return;
    
    // 查找当前报告的索引
    const currentIndex = allReports.findIndex(r => r.id === currentReportId);
    
    // 上一周按钮（较新的周）
    const prevWeekBtn = document.getElementById('prev-week-btn');
    if (currentIndex > 0) {
        const prevReport = allReports[currentIndex - 1];
        prevWeekBtn.href = `detail.html?id=${prevReport.id}`;
    } else {
        // 已经是第一周（最新周），禁用按钮
        prevWeekBtn.classList.add('disabled');
        prevWeekBtn.style.opacity = '0.6';
        prevWeekBtn.style.cursor = 'not-allowed';
        prevWeekBtn.href = '#';
        prevWeekBtn.onclick = function(e) {
            e.preventDefault();
        };
    }
    
    // 下一周按钮（较旧的周）
    const nextWeekBtn = document.getElementById('next-week-btn');
    if (currentIndex < allReports.length - 1) {
        const nextReport = allReports[currentIndex + 1];
        nextWeekBtn.href = `detail.html?id=${nextReport.id}`;
    } else {
        // 已经是最后一周（最旧周），禁用按钮
        nextWeekBtn.classList.add('disabled');
        nextWeekBtn.style.opacity = '0.6';
        nextWeekBtn.style.cursor = 'not-allowed';
        nextWeekBtn.href = '#';
        nextWeekBtn.onclick = function(e) {
            e.preventDefault();
        };
    }
}

// 显示错误信息
function showError(message) {
    const weekHeader = document.getElementById('week-header');
    weekHeader.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>${message}</p>
            <a href="index.html" class="nav-btn" style="margin-top: 20px;">
                <i class="fas fa-arrow-left"></i>
                <span>返回周报列表</span>
            </a>
        </div>
    `;
    
    // 隐藏其他部分
    document.querySelectorAll('section, .navigation-buttons').forEach(el => {
        el.style.display = 'none';
    });
}