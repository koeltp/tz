// 通用工具函数
const App = {
    // 当前数据源（从site.json中读取）
    currentSource: null,
    
    // 站点配置
    siteConfig: null,
    
    // 初始化站点配置
    initSiteConfig: async function() {
        try {
            const response = await fetch('data/site.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.siteConfig = await response.json();
            console.log('Site config loaded:', this.siteConfig);
        } catch (error) {
            console.error('加载站点配置失败:', error);
        }
    },
    
    // 获取当前货币
    getCurrentCurrency: function() {
        if (!this.siteConfig || !this.siteConfig.sources) {
            return 'USD';
        }
        const source = this.siteConfig.sources.find(s => s.id === this.currentSource);
        return source ? source.currency : 'USD';
    },
    
    // 获取当前数据源名称
    getCurrentSourceName: function() {
        if (!this.siteConfig || !this.siteConfig.sources) {
            return 'TP投资';
        }
        const source = this.siteConfig.sources.find(s => s.id === this.currentSource);
        return source ? source.sitename : 'TP投资';
    },
    
    // 格式化货币
    formatCurrency: function(value) {
        const currency = this.getCurrentCurrency();
        // 使用site.json中的currencyLocales映射
        const locale = App.siteConfig?.currencyLocales?.[currency] || (currency === 'CNY' ? 'zh-CN' : 'en-US');
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    },
    
    // 格式化百分比
    formatPercent: function(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    },
    
    // 格式化日期
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // 格式化日期时间（带时分秒）
    formatDateTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // 获取当前数据源
    getCurrentSource: function() {
        return this.currentSource;
    },
    
    // 切换数据源
    switchSource: function(source) {
        if (!this.siteConfig || !this.siteConfig.sources) {
            console.error('站点配置未加载');
            return;
        }
        
        const validSource = this.siteConfig.sources.find(s => s.id === source);
        if (validSource) {
            this.currentSource = source;
            // 保存到localStorage
            localStorage.setItem('currentSource', source);
            // 更新页面显示
            this.updateSourceDisplay();
            // 重新加载页面数据
            window.location.reload();
        } else {
            console.error('无效的数据源:', source);
        }
    },
    
    // 更新数据源显示
    updateSourceDisplay: function() {
        const currentSourceElement = document.getElementById('current-source');
        if (currentSourceElement) {
            const sourceName = this.getCurrentSourceName();
            currentSourceElement.textContent = sourceName;
        }
        
        // 更新下拉菜单的激活状态
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            const itemSource = item.getAttribute('data-source');
            if (itemSource === this.currentSource) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 触发数据源变化事件
        window.dispatchEvent(new CustomEvent('sourceChanged'));
    },
    
    // 从localStorage加载数据源
    loadSourceFromStorage: async function() {
        const savedSource = localStorage.getItem('currentSource');
        if (savedSource) {
            if (!this.siteConfig || !this.siteConfig.sources) {
                await this.initSiteConfig();
            }
            const validSource = this.siteConfig.sources.find(s => s.id === savedSource);
            if (validSource) {
                this.currentSource = savedSource;
            } else {
                // 如果保存的数据源无效，使用默认数据源
                this.currentSource = this.siteConfig.defaultSource || this.siteConfig.sources[0].id;
            }
        } else {
            // 如果没有保存的数据源，使用默认数据源
            if (!this.siteConfig || !this.siteConfig.sources) {
                await this.initSiteConfig();
            }
            this.currentSource = this.siteConfig.defaultSource || this.siteConfig.sources[0].id;
        }
        this.updateSourceDisplay();
    },
    
    // 加载投资总览数据
    loadSummary: async function() {
        try {
            if (!this.siteConfig || !this.siteConfig.sources) {
                await this.initSiteConfig();
            }
            
            const source = this.siteConfig.sources.find(s => s.id === this.currentSource);
            if (!source) {
                throw new Error(`Source ${this.currentSource} not found`);
            }
            
            return {
                initialInvestment: source.initialInvestment,
                startDate: source.startDate
            };
        } catch (error) {
            console.error('加载投资总览失败:', error);
        }
    },
    
    // 根据起始日期生成所有可能的周报ID
    generateAllWeekIds: function(startDate) {
        const weekIds = [];
        
        // 解析起始日期
        const start = new Date(startDate);
        const now = new Date();
        
        // 确保起始日期是周一
        const startMonday = this.getMondayOfWeek(start);
        
        // 当前日期所在周的周一
        const currentMonday = this.getMondayOfWeek(now);
        
        // 从起始周一到当前周一，每周生成一个ID
        let currentWeekStart = new Date(startMonday);
        
        while (currentWeekStart <= currentMonday) {
            const weekId = this.generateWeekIdFromDate(currentWeekStart);
            weekIds.push(weekId);
            
            // 增加一周（7天）
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        
        return weekIds;
    },
    
    // 获取日期所在周的周一
    getMondayOfWeek: function(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整周日的情况
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },
    
    // 根据日期生成周报ID
    generateWeekIdFromDate: function(date) {
        const monday = this.getMondayOfWeek(date);
        const year = monday.getFullYear();
        const yearShort = year.toString().slice(2); // 取后两位
        
        // 计算是该年的第几周
        const firstDayOfYear = new Date(year, 0, 1);
        const firstMonday = this.getMondayOfWeek(firstDayOfYear);
        
        // 如果第一个周一在1月1日之前（即1月1日不是周一），则调整
        if (firstMonday.getFullYear() < year) {
            firstMonday.setDate(firstMonday.getDate() + 7);
        }
        
        // 计算周数
        const diffTime = monday - firstMonday;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(diffDays / 7) + 1;
        
        // 格式化：周数两位数
        const weekStr = weekNumber.toString().padStart(2, '0');
        
        return yearShort + weekStr;
    },
    
    // 获取所有周报数据
    getAllWeeklyReports: async function() {
        try {
            // 加载投资总览数据获取起始日期
            const summary = await this.loadSummary();
            
            // 生成所有可能的周报ID
            const allWeekIds = this.generateAllWeekIds(summary.startDate);
            
            // 尝试加载所有周报，忽略不存在的文件
            const reportPromises = allWeekIds.map(async (weekId) => {
                try {
                    const report = await this.loadWeeklyReport(weekId);
                    if (report) {
                        // 为报告添加ID
                        report.id = weekId;
                        return report;
                    }
                } catch (error) {
                    // 文件不存在，忽略
                    return null;
                }
                return null;
            });
            
            // 等待所有请求完成
            const reports = await Promise.all(reportPromises);
            
            // 过滤掉null值（不存在的文件）
            const validReports = reports.filter(report => report !== null);
            
            // 按ID排序（从新到旧）
            return validReports.sort((a, b) => b.id.localeCompare(a.id));
            
        } catch (error) {
            console.error('获取周报文件列表失败:', error);
            return [];
        }
    },
    
    // 加载指定周报数据
    loadWeeklyReport: async function(weekId) {
        try {
            const response = await fetch(`data/${this.currentSource}/${weekId}.json`);
            if (!response.ok) {
                // 如果文件不存在，返回null
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let report = await response.json();
            
            // 根据ID生成weekNumber, year, dateRange
            const weekInfo = this.generateWeekInfoFromId(weekId);
            if (weekInfo) {
                report = { ...weekInfo, ...report };
            }
            
            return report;
        } catch (error) {
            // 如果文件不存在，返回null而不是抛出错误
            if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                console.log(`周报 ${weekId}.json 不存在，已忽略`);
                return null;
            }
            console.error(`加载周报 ${weekId} 失败:`, error);
            return null;
        }
    },
    
    // 根据ID生成周信息
    generateWeekInfoFromId: function(weekId) {
        // ID格式：年份后两位 + 周数（如"2442"表示2024年第42周）
        if (!weekId || weekId.length !== 4) {
            console.error('ID格式错误:', weekId);
            return null;
        }
        
        const yearStr = weekId.substring(0, 2);
        const weekStr = weekId.substring(2, 4);
        
        const year = 2000 + parseInt(yearStr, 10);
        const weekNumber = parseInt(weekStr, 10);
        
        if (isNaN(year) || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
            console.error('ID解析错误:', weekId);
            return null;
        }
        
        // 计算该周的日期范围（周一到周五）
        const dateRange = this.getWeekDateRange(year, weekNumber);
        
        return {
            weekNumber: weekNumber,
            year: year,
            dateRange: dateRange
        };
    },
    
    // 获取某年第n周的日期范围（周一到周五）
    getWeekDateRange: function(year, weekNumber) {
        // 计算该年1月1日是星期几（0=周日，1=周一，...，6=周六）
        const janFirst = new Date(year, 0, 1);
        const janFirstDayOfWeek = janFirst.getDay(); // 0-6
        
        // 调整：如果1月1日是周日，则视为第7天（这样方便计算）
        const daysOffset = janFirstDayOfWeek === 0 ? 6 : janFirstDayOfWeek - 1;
        
        // 计算该年第一个周一的日期
        let firstMonday;
        if (janFirstDayOfWeek === 1) {
            // 1月1日就是周一
            firstMonday = new Date(year, 0, 1);
        } else if (janFirstDayOfWeek === 0) {
            // 1月1日是周日，第一个周一是1月2日
            firstMonday = new Date(year, 0, 2);
        } else {
            // 1月1日之后的下一个周一
            firstMonday = new Date(year, 0, 1 + (8 - janFirstDayOfWeek));
        }
        
        // 计算第n周的周一的日期
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
        
        // 计算该周的周五的日期
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // 周一+4天=周五
        
        // 格式化日期为"YYYY-MM-DD"
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        
        return `${formatDate(weekStart)} 至 ${formatDate(weekEnd)}`;
    },
    
    // 获取最新的周报ID
    getLatestWeekId: async function() {
        try {
            const reports = await this.getAllWeeklyReports();
            if (reports.length > 0) {
                // 第一个报告就是最新的
                return reports[0].id;
            }
            return null;
        } catch (error) {
            console.error('获取最新周报ID失败:', error);
            return null;
        }
    },
    
    // 获取URL参数
    getUrlParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    // 获取周报ID
    getReportId: function() {
        const reportId = this.getUrlParam('id');
        return reportId;
    },
    
    // 计算周度收益
    calculateWeeklyChange: function(currentReport, previousReport) {
        if (!previousReport) {
            return { amount: 0, percent: 0 };
        }
        
        const amount = currentReport.totalAssets - previousReport.totalAssets;
        const percent = (amount / previousReport.totalAssets) * 100;
        
        return {
            amount: amount,
            percent: percent
        };
    },
};