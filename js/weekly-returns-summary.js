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
 * 计算资金流水的累计流入（净流入 = 转入 - 转出）
 * @param {array} cashFlows - 资金流水数组
 * @param {string} endDateStr - 结束日期字符串
 * @returns {number} 累计资金净流入
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
 * 生成每周收益汇总
 */
function generateWeeklyReturnsSummary() {
    const siteConfig = readJsonFile('data/site.json');
    if (!siteConfig || !siteConfig.sources) {
        console.error('无法读取站点配置文件');
        return;
    }

    const sources = siteConfig.sources;
    const weeklyReturnsSummary = {};

    sources.forEach(source => {
        const { id: sourceId, currency, initialInvestment, sitename } = source;

        const sourceDir = path.join('data', sourceId);
        if (!fs.existsSync(sourceDir)) {
            console.log(`站点 ${sourceId} 的数据目录不存在，跳过`);
            return;
        }

        const cashFlowPath = path.join('data', 'cashFlows', `${sourceId}.json`);
        let cashFlows = [];
        if (fs.existsSync(cashFlowPath)) {
            const cashFlowData = readJsonFile(cashFlowPath);
            if (cashFlowData) {
                cashFlows = cashFlowData.cashFlows || [];
            }
        }

        const reportFiles = fs.readdirSync(sourceDir)
            .filter(file => file.match(/^\d{4}\.json$/))
            .sort()
            .reverse();

        // 原代码跳过了最新周，这里注释掉，改为处理所有周
        // const latestWeek = reportFiles.length > 0 ? reportFiles[0] : null;

        reportFiles.forEach((file, index) => {
            // 原跳过逻辑：if (file === latestWeek) return; 现在去掉，处理全部周文件
            // 如需跳过最新一周，请取消下面注释
            if (index === 0) return;  // 跳过最新的第一周

            const weekId = file.replace('.json', '');
            const reportPath = path.join(sourceDir, file);

            const report = readJsonFile(reportPath);
            if (!report || !report.totalAssets) {
                return;
            }

            const cumulativeCashInflow = calculateCumulativeCashInflow(
                cashFlows,
                report.updateDate ? report.updateDate.split(' ')[0] : null
            );

            const adjustedInvestment = initialInvestment + cumulativeCashInflow;

            const totalReturn = report.totalAssets - adjustedInvestment;
            const totalChange = adjustedInvestment > 0 ? (totalReturn / adjustedInvestment) * 100 : 0;

            let weekChange = 0;
            let weekChangePercent = 0;

            // 计算周度收益：需要扣除本周净现金流入
            if (index < reportFiles.length - 1) {
                const previousFile = reportFiles[index + 1];
                const previousReportPath = path.join(sourceDir, previousFile);
                const previousReport = readJsonFile(previousReportPath);

                if (previousReport && previousReport.totalAssets) {
                    // 截止本周结束的累计净流入
                    const currentDateStr = report.updateDate ? report.updateDate.split(' ')[0] : null;
                    const cumInflowCurrent = calculateCumulativeCashInflow(cashFlows, currentDateStr);

                    // 截止上周结束的累计净流入
                    const prevDateStr = previousReport.updateDate ? previousReport.updateDate.split(' ')[0] : null;
                    const cumInflowPrev = calculateCumulativeCashInflow(cashFlows, prevDateStr);

                    // 本周净现金流入（正值表示净转入，负值表示净转出）
                    const weekNetInflow = cumInflowCurrent - cumInflowPrev;

                    // 原始资产变化
                    const rawWeekChange = report.totalAssets - previousReport.totalAssets;

                    // 扣除本周净现金流入，得到真实周度收益
                    weekChange = rawWeekChange - weekNetInflow;
                    weekChangePercent = previousReport.totalAssets > 0
                        ? (weekChange / previousReport.totalAssets) * 100
                        : 0;
                }
            }

            if (!weeklyReturnsSummary[weekId]) {
                weeklyReturnsSummary[weekId] = {};
            }

            weeklyReturnsSummary[weekId][sourceId] = {
                siteName: sitename,
                currency: currency,
                totalReturn: formatNumber(totalReturn),
                totalChange: formatNumber(totalChange),
                weekChange: formatNumber(weekChange),
                weekChangePercent: formatNumber(weekChangePercent),
                totalAssets: formatNumber(report.totalAssets),
                adjustedInvestment: formatNumber(adjustedInvestment)
            };
        });
    });

    return weeklyReturnsSummary;
}

/**
 * 输出汇总结果
 * @param {object} weeklyReturnsSummary - 汇总数据
 */
function outputSummary(weeklyReturnsSummary) {
    const sortedWeeks = Object.keys(weeklyReturnsSummary).sort();

    console.log('=== 各站点每周收益汇总 ===\n');
    sortedWeeks.forEach(weekId => {
        const weekData = weeklyReturnsSummary[weekId];
        console.log(`周 ${weekId}:`);

        Object.keys(weekData).forEach(sourceId => {
            const sourceData = weekData[sourceId];
            console.log(`  ${sourceData.siteName} (${sourceData.currency}):`);
            console.log(`    累计收益: ${sourceData.totalReturn.toFixed(2)} ${sourceData.currency}`);
            console.log(`    累计收益率: ${sourceData.totalChange.toFixed(2)}%`);
            console.log(`    周度收益: ${sourceData.weekChange.toFixed(2)} ${sourceData.currency}`);
            console.log(`    周度收益率: ${sourceData.weekChangePercent.toFixed(2)}%`);
            console.log(`    总资产: ${sourceData.totalAssets.toFixed(2)} ${sourceData.currency}`);
            console.log(`    调整后初始投资: ${sourceData.adjustedInvestment.toFixed(2)} ${sourceData.currency}`);
            console.log('');
        });
    });

    const summaryPath = path.join('data', 'weekly-returns-summary.json');
    try {
        fs.writeFileSync(summaryPath, JSON.stringify(weeklyReturnsSummary, null, 2));
        console.log(`\n汇总数据已写入到 ${summaryPath}`);
    } catch (error) {
        console.error(`写入文件 ${summaryPath} 失败:`, error.message);
    }
}

function main() {
    console.log('开始生成每周收益汇总...');

    const weeklyReturnsSummary = generateWeeklyReturnsSummary();
    if (weeklyReturnsSummary) {
        outputSummary(weeklyReturnsSummary);
    }

    console.log('收益汇总完成！');
}

if (require.main === module) {
    main();
}

module.exports = {
    generateWeeklyReturnsSummary,
    outputSummary
};