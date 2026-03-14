const fs = require('fs');
const path = require('path');

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @returns {object} JSON数据
 */
function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`读取文件 ${filePath} 失败:`, error.message);
        return null;
    }
}

/**
 * 计算资金流水的累计流入
 * @param {array} cashFlows - 资金流水数组
 * @param {string} endDateStr - 结束日期字符串
 * @returns {number} 累计资金流入
 */
function calculateCumulativeCashInflow(cashFlows, endDateStr) {
    if (!cashFlows || !endDateStr) {
        return 0;
    }

    const weekEndDate = new Date(endDateStr);
    weekEndDate.setHours(23, 59, 59, 999);

    return cashFlows.reduce((total, flow) => {
        const flowDate = new Date(flow.date);
        flowDate.setHours(0, 0, 0, 0);

        if (flowDate <= weekEndDate) {
            if (flow.type === '转入') {
                return total + flow.amount;
            } else if (flow.type === '转出') {
                return total - flow.amount;
            }
        }
        return total;
    }, 0);
}

/**
 * 格式化数字为两位小数
 * @param {number} value - 原始值
 * @returns {number} 格式化后的值
 */
function formatNumber(value) {
    return Math.round(value * 100) / 100;
}

/**
 * 生成每周数据汇总
 */
function generateWeeklySummary() {
    // 读取site.json配置文件
    const siteConfig = readJsonFile('data/site.json');
    if (!siteConfig || !siteConfig.sources) {
        console.error('无法读取站点配置文件');
        return;
    }

    const sources = siteConfig.sources;
    const weeklySummary = {};

    // 遍历每个站点
    sources.forEach(source => {
        const { id: sourceId, currency, initialInvestment } = source;
        
        // 检查站点数据目录是否存在
        const sourceDir = path.join('data', sourceId);
        if (!fs.existsSync(sourceDir)) {
            console.log(`站点 ${sourceId} 的数据目录不存在，跳过`);
            return;
        }
        
        // 读取该站点的资金流水数据
        const cashFlowPath = path.join('data', 'cashFlows', `${sourceId}.json`);
        let cashFlows = [];
        if (fs.existsSync(cashFlowPath)) {
            const cashFlowData = readJsonFile(cashFlowPath);
            if (cashFlowData) {
                cashFlows = cashFlowData.cashFlows || [];
            }
        }
        
        // 读取该站点的所有周报文件
        const reportFiles = fs.readdirSync(sourceDir)
            .filter(file => file.match(/^\d{4}\.json$/));
        
        // 遍历每个周报文件
        reportFiles.forEach(file => {
            const weekId = file.replace('.json', '');
            const reportPath = path.join(sourceDir, file);
            
            const report = readJsonFile(reportPath);
            if (!report) {
                return;
            }
            
            // 初始化该周的数据结构
            if (!weeklySummary[weekId]) {
                weeklySummary[weekId] = {
                    USD: { totalAssets: 0, totalMarketValue: 0, totalInvestment: 0 },
                    CNY: { totalAssets: 0, totalMarketValue: 0, totalInvestment: 0 }
                };
            }
            
            // 累加资产和市值数据
            if (report.totalAssets) {
                weeklySummary[weekId][currency].totalAssets = formatNumber(
                    weeklySummary[weekId][currency].totalAssets + report.totalAssets
                );
            }
            
            if (report.totalMarketValue) {
                weeklySummary[weekId][currency].totalMarketValue = formatNumber(
                    weeklySummary[weekId][currency].totalMarketValue + report.totalMarketValue
                );
            }
            
            // 计算该站点到该时间点的累计资金流入
            const cumulativeCashInflow = calculateCumulativeCashInflow(
                cashFlows, 
                report.updateDate ? report.updateDate.split(' ')[0] : null
            );
            
            // 计算调整后的初始投资
            const adjustedInvestment = initialInvestment + cumulativeCashInflow;
            weeklySummary[weekId][currency].totalInvestment = formatNumber(
                weeklySummary[weekId][currency].totalInvestment + adjustedInvestment
            );
        });
    });

    return weeklySummary;
}

/**
 * 输出汇总结果
 * @param {object} weeklySummary - 汇总数据
 */
function outputSummary(weeklySummary) {
    // 按周ID排序
    const sortedWeeks = Object.keys(weeklySummary).sort();
    
    // 输出汇总结果
    console.log('=== 各站点每周数据汇总 ===\n');
    sortedWeeks.forEach(weekId => {
        const weekData = weeklySummary[weekId];
        console.log(`周 ${weekId}:`);
        console.log(`  USD - 总资产: ${weekData.USD.totalAssets.toFixed(2)}, 总市值: ${weekData.USD.totalMarketValue.toFixed(2)}, 启动资金: ${weekData.USD.totalInvestment.toFixed(2)}`);
        console.log(`  CNY - 总资产: ${weekData.CNY.totalAssets.toFixed(2)}, 总市值: ${weekData.CNY.totalMarketValue.toFixed(2)}, 启动资金: ${weekData.CNY.totalInvestment.toFixed(2)}`);
        console.log('');
    });
    
    // 输出JSON格式的汇总数据
    console.log('=== JSON格式汇总数据 ===');
    console.log(JSON.stringify(weeklySummary, null, 2));
    
    // 写入到data/dashboard.json
    const dashboardPath = path.join('data', 'dashboard.json');
    try {
        fs.writeFileSync(dashboardPath, JSON.stringify(weeklySummary, null, 2));
        console.log(`\n汇总数据已写入到 ${dashboardPath}`);
    } catch (error) {
        console.error(`写入文件 ${dashboardPath} 失败:`, error.message);
    }
}

// 主函数
function main() {
    console.log('开始生成每周数据汇总...');
    
    const weeklySummary = generateWeeklySummary();
    if (weeklySummary) {
        outputSummary(weeklySummary);
    }
    
    console.log('数据汇总完成！');
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    generateWeeklySummary,
    outputSummary
};