// 仪表板页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化站点配置
        await App.initSiteConfig();
        
        // 加载当前数据源的周报数据
        const allReports = await App.getAllWeeklyReports();
        
        if (!allReports || allReports.length === 0) {
            showError('暂无周报数据');
            return;
        }
        
        // 处理当前数据源的数据并绘制图表
        processDashboardData(allReports);
        
        // 加载所有站点的数据并绘制综合图表
        await loadCombinedData();
        
    } catch (error) {
        console.error('加载仪表板数据失败:', error);
        showError('加载仪表板数据失败，请检查网络连接');
    }
});

// 处理仪表板数据
async function processDashboardData(reports) {
    // 按日期排序（从旧到新）
    const sortedReports = [...reports].sort((a, b) => a.id.localeCompare(b.id));
    
    // 获取启动资金和资金流水数据
    const summary = await App.loadSummary();
    const initialInvestment = summary ? summary.initialInvestment : 0;
    
    // 从新的资金流水文件加载数据
    const cashFlows = await App.loadCashFlows(App.currentSource);
    
    // 提取数据
    const labels = sortedReports.map(report => {
        const [year, week] = report.id.match(/(\d{2})(\d{2})/).slice(1);
        return `${year}${week}`;
    });
    
    const assetsData = sortedReports.map(report => report.totalAssets);
    
    // 为每个周报计算到该时间点为止的调整后初始投资
    const adjustedInitialInvestmentData = sortedReports.map(report => {
        // 获取周报的结束日期
        const reportEndDate = new Date(report.dateRange.split(' 至 ')[1]);
        
        // 计算到该周报结束日期为止的累计资金流入
        let cumulativeCashInflow = 0;
        cashFlows.forEach(flow => {
            const flowDate = new Date(flow.date);
            if (flowDate <= reportEndDate) {
                if (flow.type === '转入') {
                    cumulativeCashInflow += flow.amount;
                } else if (flow.type === '转出') {
                    cumulativeCashInflow -= flow.amount;
                }
            }
        });
        
        // 计算调整后的初始投资
        return initialInvestment + cumulativeCashInflow;
    });
    
    // 计算每周收益率（相对于调整后的初始投资）
    const returnData = sortedReports.map((report, index) => {
        const adjustedInvestment = adjustedInitialInvestmentData[index];
        return adjustedInvestment > 0 ? ((report.totalAssets - adjustedInvestment) / adjustedInvestment) * 100 : 0;
    });
    
    // 绘制资产与收益率趋势图（合并版）
    drawCombinedTrendChart(labels, assetsData, adjustedInitialInvestmentData, returnData);
    
    // 计算绩效指标
    await calculatePerformanceMetrics(sortedReports, initialInvestment);
}

// 加载所有站点的综合数据
async function loadCombinedData() {
    try {
        // 从data/dashboard.json加载汇总数据
        const response = await fetch('data/dashboard.json');
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const dashboardData = await response.json();
        
        // 提取所有周次并排序
        const sortedWeeks = Object.keys(dashboardData).sort();
        
        if (sortedWeeks.length === 0) {
            console.log('没有可用的汇总数据');
            return;
        }
        
        // 提取标签和数据
        const labels = sortedWeeks.map(weekId => {
            const [year, week] = weekId.match(/(\d{2})(\d{2})/).slice(1);
            return `${year}${week}`;
        });
        
        // 为每种货币准备数据
        const currencies = ['USD', 'CNY'];
        const datasets = currencies.map(currency => {
            const assetsData = sortedWeeks.map(weekId => {
                return dashboardData[weekId][currency].totalAssets || 0;
            });
            
            const initialInvestmentData = sortedWeeks.map(weekId => {
                return dashboardData[weekId][currency].totalInvestment || 0;
            });
            
            return {
                currency: currency,
                assetsData: assetsData,
                initialInvestmentData: initialInvestmentData
            };
        });
        
        // 绘制综合总资产图表
        drawCombinedAssetsChart(labels, datasets);
        
        // 加载各站点最新一周数据并绘制环形图
        await loadLatestWeekDataForDoughnutCharts();
        
    } catch (error) {
        console.error('加载综合数据失败:', error);
    }
}

// 加载各站点最新一周数据并绘制环形图
async function loadLatestWeekDataForDoughnutCharts() {
    try {
        // 获取站点配置
        if (!App.siteConfig || !App.siteConfig.sources) {
            console.error('站点配置未加载');
            return;
        }
        
        const sources = App.siteConfig.sources;
        const latestWeekData = [];
        
        // 计算当前周ID
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);
        const yearShort = year.toString().slice(-2);
        const weekStr = week.toString().padStart(2, '0');
        const currentWeekId = yearShort + weekStr;
        
        // 尝试获取当前周和前一周的数据
        const weekIds = [currentWeekId];
        // 如果当前周没有数据，尝试前一周
        const prevWeek = week > 1 ? week - 1 : 52;
        const prevYearShort = week > 1 ? yearShort : (parseInt(yearShort) - 1).toString().padStart(2, '0');
        const prevWeekStr = prevWeek.toString().padStart(2, '0');
        const prevWeekId = prevYearShort + prevWeekStr;
        weekIds.push(prevWeekId);
        
        // 遍历所有站点
        for (const source of sources) {
            let foundData = false;
            
            // 尝试加载最近的周数据
            for (const weekId of weekIds) {
                try {
                    const response = await fetch(`data/${source.id}/${weekId}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        latestWeekData.push({
                            sourceId: source.id,
                            sourceName: source.sitename,
                            currency: source.currency,
                            totalAssets: data.totalAssets || 0
                        });
                        foundData = true;
                        break;
                    }
                } catch (error) {
                    // 文件不存在，继续尝试下一周
                }
            }
            
            if (!foundData) {
                // 如果没有找到数据，添加默认值
                latestWeekData.push({
                    sourceId: source.id,
                    sourceName: source.sitename,
                    currency: source.currency,
                    totalAssets: 0
                });
            }
        }
        
        // 绘制环形图
        drawUSDDoughnutChart(latestWeekData);
        drawCNYDoughnutChart(latestWeekData);
        
    } catch (error) {
        console.error('加载环形图数据失败:', error);
    }
}

// 加载指定数据源的所有周报
async function loadAllReportsForSource(sourceId, startDate) {
    const reports = [];
    
    // 生成从startDate到当前日期的所有周ID
    const start = new Date(startDate);
    const now = new Date();
    
    let current = new Date(start);
    while (current <= now) {
        // 计算周ID (格式: YYWW)
        const year = current.getFullYear();
        const week = getWeekNumber(current);
        const yearShort = year.toString().slice(-2);
        const weekStr = week.toString().padStart(2, '0');
        const weekId = yearShort + weekStr;
        
        try {
            // 尝试加载该周的报告
            const response = await fetch(`data/${sourceId}/${weekId}.json`);
            if (response.ok) {
                const report = await response.json();
                report.id = weekId;
                reports.push(report);
            }
        } catch (error) {
            // 文件不存在，忽略
        }
        
        // 移动到下一周
        current.setDate(current.getDate() + 7);
    }
    
    return reports;
}

// 获取日期所在的周数
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 绘制资产与收益率趋势图（合并版）
function drawCombinedTrendChart(labels, assetsData, initialInvestmentData, returnData) {
    const ctx = document.getElementById('combinedTrendChart').getContext('2d');
    
    // 获取当前站点的币种
    const getCurrencySymbol = function() {
        if (!App.siteConfig || !App.currentSource) return '$';
        
        const source = App.siteConfig.sources.find(s => s.id === App.currentSource);
        if (!source || !source.currency) return '$';
        
        switch (source.currency) {
            case 'CNY':
                return '¥';
            case 'USD':
                return '$';
            default:
                return '$';
        }
    };
    
    const currencySymbol = getCurrencySymbol();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '总资产',
                    data: assetsData,
                    borderColor: 'var(--accent-color)',
                    backgroundColor: 'rgba(1, 190, 243, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: 'var(--accent-color)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '启动资金',
                    data: initialInvestmentData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y'
                },
                {
                    label: '收益率',
                    data: returnData,
                    borderColor: '#27ae60',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.yAxisID === 'y') {
                                return `${context.dataset.label}: ${currencySymbol}${context.parsed.y.toFixed(2)}`;
                            } else {
                                return `${context.dataset.label}: ${context.parsed.y >= 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '金额'
                    },
                    ticks: {
                        callback: function(value) {
                            return `${currencySymbol}${value.toFixed(0)}`;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '收益率 (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间'
                    }
                }
            }
        }
    });
}

// 绘制综合总资产图表
function drawCombinedAssetsChart(labels, datasets) {
    const ctx = document.getElementById('combinedAssetsChart').getContext('2d');
    
    // 货币颜色配置
    const currencyColors = {
        'USD': {
            main: 'var(--accent-color)',
            secondary: '#e74c3c',
            background: 'rgba(1, 190, 243, 0.1)'
        },
        'CNY': {
            main: '#2ecc71',
            secondary: '#f39c12',
            background: 'rgba(46, 204, 113, 0.1)'
        }
    };
    
    // 构建数据集
    const chartDatasets = [];
    
    datasets.forEach((dataset, index) => {
        const currency = dataset.currency;
        const colors = currencyColors[currency] || currencyColors['USD'];
        
        // 资产数据
        chartDatasets.push({
            label: `${currency} 总资产`,
            data: dataset.assetsData,
            borderColor: colors.main,
            backgroundColor: colors.background,
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: colors.main,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        });
        
        // 启动资金数据
        chartDatasets.push({
            label: `${currency} 启动资金`,
            data: dataset.initialInvestmentData,
            borderColor: colors.secondary,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0,
            fill: false,
            pointBackgroundColor: colors.secondary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
        });
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            // 提取货币类型
                            const label = context.dataset.label;
                            const currency = label.split(' ')[0];
                            const value = context.parsed.y;
                            
                            // 根据货币类型格式化
                            if (currency === 'USD') {
                                return `${label}: $${value.toFixed(2)}`;
                            } else if (currency === 'CNY') {
                                return `${label}: ¥${value.toFixed(2)}`;
                            }
                            return `${label}: ${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '金额'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间'
                    }
                }
            }
        }
    });
}

// 计算绩效指标
async function calculatePerformanceMetrics(reports, initialInvestment) {
    if (reports.length === 0) return;
    
    // 按日期排序（从旧到新）
    const sortedReports = [...reports].sort((a, b) => a.id.localeCompare(b.id));
    
    // 当前总资产
    const currentAssets = sortedReports[sortedReports.length - 1].totalAssets;
    document.getElementById('current-assets').textContent = App.formatCurrency(currentAssets);
    
    // 从新的资金流水文件加载数据
    const cashFlows = await App.loadCashFlows(App.currentSource);
    const totalCashInflow = App.getTotalCashInflow(cashFlows);
    
    // 计算调整后的初始投资（启动资金 + 累计资金流入）
    const adjustedInitialInvestment = initialInvestment + totalCashInflow;
    
    // 累计收益和收益率（基于调整后的初始投资）
    const totalChange = currentAssets - adjustedInitialInvestment;
    const returnRate = adjustedInitialInvestment > 0 ? (totalChange / adjustedInitialInvestment) * 100 : 0;
    
    const totalChangeElement = document.getElementById('total-change');
    totalChangeElement.textContent = `${totalChange >= 0 ? '+' : ''}${App.formatCurrency(totalChange)}`;
    totalChangeElement.className = `stat-value ${totalChange >= 0 ? 'positive' : 'negative'}`;
    
    const returnRateElement = document.getElementById('return-rate');
    returnRateElement.textContent = `${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`;
    returnRateElement.className = `stat-value ${returnRate >= 0 ? 'positive' : 'negative'}`;
    
    // 显示累计资金流入
    const cashInflowElement = document.getElementById('cash-inflow');
    if (cashInflowElement) {
        cashInflowElement.textContent = `${totalCashInflow >= 0 ? '+' : ''}${App.formatCurrency(totalCashInflow)}`;
        cashInflowElement.className = `stat-value ${totalCashInflow >= 0 ? 'positive' : 'negative'}`;
    }
}

// 绘制USD站点资产分布环形图
function drawUSDDoughnutChart(data) {
    const ctx = document.getElementById('usdPolarChart').getContext('2d');
    
    // 筛选USD站点数据
    const usdData = data.filter(item => item.currency === 'USD');
    
    if (usdData.length === 0) {
        // 没有USD站点数据
        ctx.canvas.parentElement.innerHTML = `
            <div class="empty-chart">
                <i class="fas fa-info-circle"></i>
                <p>暂无USD站点数据</p>
            </div>
        `;
        return;
    }
    
    const labels = usdData.map(item => item.sourceName);
    const values = usdData.map(item => item.totalAssets);
    
    // 生成颜色
    const backgroundColors = usdData.map((_, index) => {
        const hue = (index * 137.508) % 360;
        return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    const borderColors = usdData.map((_, index) => {
        const hue = (index * 137.508) % 360;
        return `hsla(${hue}, 70%, 50%, 1)`;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: '总资产 (USD)',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 绘制CNY站点资产分布环形图
function drawCNYDoughnutChart(data) {
    const ctx = document.getElementById('cnyPolarChart').getContext('2d');
    
    // 筛选CNY站点数据
    const cnyData = data.filter(item => item.currency === 'CNY');
    
    if (cnyData.length === 0) {
        // 没有CNY站点数据
        ctx.canvas.parentElement.innerHTML = `
            <div class="empty-chart">
                <i class="fas fa-info-circle"></i>
                <p>暂无CNY站点数据</p>
            </div>
        `;
        return;
    }
    
    const labels = cnyData.map(item => item.sourceName);
    const values = cnyData.map(item => item.totalAssets);
    
    // 生成颜色
    const backgroundColors = cnyData.map((_, index) => {
        const hue = (index * 137.508) % 360;
        return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    const borderColors = cnyData.map((_, index) => {
        const hue = (index * 137.508) % 360;
        return `hsla(${hue}, 70%, 50%, 1)`;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: '总资产 (CNY)',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 显示错误信息
function showError(message) {
    const dashboardContent = document.querySelector('.dashboard-content');
    dashboardContent.innerHTML = `
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
}
