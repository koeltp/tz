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
        return `20${year}年第${week}周`;
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
        // 获取站点配置
        const siteConfig = await App.initSiteConfig();
        
        if (!siteConfig || !siteConfig.sources || siteConfig.sources.length === 0) {
            console.log('没有配置数据源');
            return;
        }
        
        console.log('开始加载综合数据，数据源数量:', siteConfig.sources.length);
        
        // 收集所有站点的数据
        const allSourcesData = [];
        let allWeeks = new Set();
        
        for (const source of siteConfig.sources) {
            try {
                console.log(`加载数据源: ${source.id}`);
                
                // 加载该数据源的所有周报 - 使用与App相同的方式
                const reports = await loadAllReportsForSource(source.id, source.startDate);
                
                if (!reports || reports.length === 0) {
                    console.warn(`数据源 ${source.id} 没有周报数据`);
                    continue;
                }
                
                console.log(`数据源 ${source.id} 加载成功，周报数量:`, reports.length);
                
                allSourcesData.push({
                    sourceId: source.id,
                    sourceName: source.sitename || source.name || source.id,
                    reports: reports,
                    initialInvestment: source.initialInvestment || 0,
                    currency: source.currency || 'USD'
                });
                
                // 收集所有周次
                reports.forEach(report => allWeeks.add(report.id));
            } catch (error) {
                console.warn(`加载数据源 ${source.id} 失败:`, error);
            }
        }
        
        console.log('成功加载的数据源数量:', allSourcesData.length);
        console.log('所有周次数量:', allWeeks.size);
        
        if (allSourcesData.length === 0) {
            console.log('没有可用的数据源数据');
            return;
        }
        
        // 按周次排序
        const sortedWeeks = Array.from(allWeeks).sort();
        console.log('排序后的周次:', sortedWeeks);
        
        // 按货币类型分组计算资产
        const currencies = ['USD', 'CNY'];
        const currencyData = {};
        
        // 初始化每种货币的数据结构
        currencies.forEach(currency => {
            currencyData[currency] = {
                assets: [],
                initialInvestment: 0
            };
        });
        
        // 计算每种货币的初始投资总和
        allSourcesData.forEach(sourceData => {
            if (currencies.includes(sourceData.currency)) {
                currencyData[sourceData.currency].initialInvestment += sourceData.initialInvestment || 0;
            }
        });
        
        // 计算每周每种货币的资产总和
        const combinedData = sortedWeeks.map(weekId => {
            const weekData = { weekId };
            
            currencies.forEach(currency => {
                let totalAssets = 0;
                
                allSourcesData.forEach(sourceData => {
                    if (sourceData.currency === currency) {
                        // 查找该周的数据
                        const weekReport = sourceData.reports.find(r => r.id === weekId);
                        let assets = 0;
                        
                        if (weekReport) {
                            assets = weekReport.totalAssets;
                        } else {
                            // 如果该周没有数据，使用最近一周的数据
                            const sortedReports = [...sourceData.reports].sort((a, b) => a.id.localeCompare(b.id));
                            const lastReport = sortedReports[sortedReports.length - 1];
                            if (lastReport && weekId > lastReport.id) {
                                // 如果查询的周次在该数据源最后一周之后，使用最后一周的数据
                                assets = lastReport.totalAssets;
                            } else {
                                // 查找最近的前一周数据
                                const prevReports = sortedReports.filter(r => r.id < weekId);
                                if (prevReports.length > 0) {
                                    const prevReport = prevReports[prevReports.length - 1];
                                    assets = prevReport.totalAssets;
                                } else {
                                    // 如果没有历史数据，使用启动资金
                                    assets = sourceData.initialInvestment;
                                }
                            }
                        }
                        
                        totalAssets += assets;
                    }
                });
                
                weekData[currency] = totalAssets;
            });
            
            return weekData;
        });
        
        console.log('综合数据计算完成，数据点数量:', combinedData.length);
        console.log('货币数据:', currencyData);
        
        // 提取标签和数据
        const labels = combinedData.map(data => {
            const [year, week] = data.weekId.match(/(\d{2})(\d{2})/).slice(1);
            return `20${year}年第${week}周`;
        });
        
        // 为每种货币准备数据
        const datasets = currencies.map(currency => {
            const assetsData = combinedData.map(data => data[currency]);
            const initialInvestmentData = combinedData.map(() => currencyData[currency].initialInvestment);
            
            return {
                currency: currency,
                assetsData: assetsData,
                initialInvestmentData: initialInvestmentData
            };
        });
        
        console.log('图表数据准备完成:', { labels: labels.length, datasets: datasets.length });
        
        // 绘制综合总资产图表
        drawCombinedAssetsChart(labels, datasets);
        
    } catch (error) {
        console.error('加载综合数据失败:', error);
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
                        text: '资产价值'
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
    
    console.log('绘制综合总资产图表:', { labels, datasets });
    
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
                        text: '资产价值'
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
