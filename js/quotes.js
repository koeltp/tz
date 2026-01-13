// quotes.js - 投资语录管理
const QuotesManager = {
    // 投资语录数据库 - 100条精选投资语录
    quotes: [
        {
            content: "在别人贪婪时恐惧，在别人恐惧时贪婪。",
            author: "沃伦·巴菲特"
        },
        {
            content: "价格是你付出的，价值是你得到的。",
            author: "沃伦·巴菲特"
        },
        {
            content: "股市短期是投票机，长期是称重机。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "投资最重要的不是预测未来，而是理解现在。",
            author: "彼得·林奇"
        },
        {
            content: "风险来自于你不知道自己在做什么。",
            author: "沃伦·巴菲特"
        },
        {
            content: "最好的投资时机总是现在，只要你找到了价值。",
            author: "约翰·邓普顿"
        },
        {
            content: "分散投资是唯一免费的午餐。",
            author: "哈利·马科维茨"
        },
        {
            content: "不要把所有鸡蛋放在一个篮子里。",
            author: "投资谚语"
        },
        {
            content: "市场会奖励耐心，惩罚冲动。",
            author: "查理·芒格"
        },
        {
            content: "成功的投资需要时间和耐心，而不是频繁交易。",
            author: "约翰·博格"
        },
        {
            content: "投资自己是最好的投资。",
            author: "沃伦·巴菲特"
        },
        {
            content: "永远不要用借来的钱投资股票。",
            author: "杰西·利弗莫尔"
        },
        {
            content: "牛市生于悲观，长于怀疑，成于乐观，死于狂热。",
            author: "约翰·邓普顿"
        },
        {
            content: "投资是场马拉松，不是百米冲刺。",
            author: "投资谚语"
        },
        {
            content: "市场总是错的，而价值总是对的。",
            author: "乔治·索罗斯"
        },
        {
            content: "长期持有优质资产，时间会是你的朋友。",
            author: "投资智慧"
        },
        {
            content: "投资的第一原则是不要亏损，第二原则是记住第一条。",
            author: "沃伦·巴菲特"
        },
        {
            content: "如果你不打算持有一只股票十年，那么连十分钟都不要持有。",
            author: "沃伦·巴菲特"
        },
        {
            content: "成功的投资不是买好的，而是买得好。",
            author: "霍华德·马克斯"
        },
        {
            content: "投资最重要的不是选择好的股票，而是选择好的公司。",
            author: "菲利普·费雪"
        },
        {
            content: "市场会波动，但价值不会说谎。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "投资的秘诀是，当别人卖出时你买入，当别人买入时你卖出。",
            author: "约翰·邓普顿"
        },
        {
            content: "永远不要因为股价上涨而买入，也不要因为股价下跌而卖出。",
            author: "沃伦·巴菲特"
        },
        {
            content: "投资者最大的敌人不是市场，而是自己。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "在投资中，理性比智商更重要。",
            author: "沃伦·巴菲特"
        },
        {
            content: "不要试图预测市场，而要准备好应对市场。",
            author: "彼得·林奇"
        },
        {
            content: "最好的投资机会往往出现在最悲观的时候。",
            author: "约翰·邓普顿"
        },
        {
            content: "投资不是游戏，而是一门严肃的生意。",
            author: "沃伦·巴菲特"
        },
        {
            content: "耐心是投资者最重要的美德。",
            author: "查理·芒格"
        },
        {
            content: "市场先生时而乐观，时而悲观，但价值始终在那里。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "成功的投资者都有一份冷静的头脑和一颗耐心的心。",
            author: "投资智慧"
        },
        {
            content: "投资最好的时间是十年前，其次是现在。",
            author: "投资谚语"
        },
        {
            content: "不要追逐热点，要寻找价值。",
            author: "沃伦·巴菲特"
        },
        {
            content: "风险控制比追求高回报更重要。",
            author: "乔治·索罗斯"
        },
        {
            content: "投资的关键在于理解企业的内在价值。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "市场短期是情绪化的，长期是理性的。",
            author: "约翰·梅纳德·凯恩斯"
        },
        {
            content: "不要因为便宜而买入，要因为价值而买入。",
            author: "查理·芒格"
        },
        {
            content: "投资中最危险的一句话是：这次不一样。",
            author: "约翰·邓普顿"
        },
        {
            content: "成功的投资者都懂得等待合适的时机。",
            author: "菲利普·费雪"
        },
        {
            content: "投资不是要战胜市场，而是要战胜自己。",
            author: "投资智慧"
        },
        {
            content: "最好的防御就是选择优秀的公司。",
            author: "彼得·林奇"
        },
        {
            content: "复利是世界第八大奇迹。",
            author: "阿尔伯特·爱因斯坦"
        },
        {
            content: "投资要像乌龟一样慢，而不是像兔子一样快。",
            author: "投资谚语"
        },
        {
            content: "市场总是会回归均值。",
            author: "约翰·博格"
        },
        {
            content: "不要试图抓住每一个机会，只抓住那些你理解的机会。",
            author: "沃伦·巴菲特"
        },
        {
            content: "投资最重要的是保本，其次是保本，第三还是保本。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "优秀的公司即使在不好的市场也能表现良好。",
            author: "彼得·林奇"
        },
        {
            content: "投资中最重要的是避免重大的永久性损失。",
            author: "霍华德·马克斯"
        },
        {
            content: "市场会奖赏那些有耐心的人，惩罚那些没有耐心的人。",
            author: "查理·芒格"
        },
        {
            content: "价值投资不是一种策略，而是一种哲学。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "最好的投资是那些你可以安心睡觉的投资。",
            author: "沃伦·巴菲特"
        },
        {
            content: "不要试图预测经济，而要理解企业。",
            author: "彼得·林奇"
        },
        {
            content: "投资中最重要的是独立思考。",
            author: "查理·芒格"
        },
        {
            content: "市场短期是非理性的，但长期会反映企业的真实价值。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "成功的投资需要纪律、耐心和独立思考。",
            author: "投资智慧"
        },
        {
            content: "不要因为恐惧而卖出，也不要因为贪婪而买入。",
            author: "投资谚语"
        },
        {
            content: "投资就像打棒球，你需要等待合适的投球。",
            author: "沃伦·巴菲特"
        },
        {
            content: "理解企业的护城河比预测股价更重要。",
            author: "沃伦·巴菲特"
        },
        {
            content: "最好的投资者是那些知道自己不知道什么的人。",
            author: "查理·芒格"
        },
        {
            content: "市场波动不是风险，本金的永久性损失才是风险。",
            author: "霍华德·马克斯"
        },
        {
            content: "投资不是关于正确预测未来，而是关于正确评估现在。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "耐心等待合适的投资机会，然后重仓出击。",
            author: "菲利普·费雪"
        },
        {
            content: "不要试图在市场的顶部卖出，底部买入。",
            author: "约翰·博格"
        },
        {
            content: "最好的投资是那些你愿意持有十年的投资。",
            author: "沃伦·巴菲特"
        },
        {
            content: "市场短期是情绪驱动的，长期是价值驱动的。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "成功的投资需要逆向思维。",
            author: "约翰·邓普顿"
        },
        {
            content: "不要因为股价下跌而恐慌，要因为价值上涨而兴奋。",
            author: "投资智慧"
        },
        {
            content: "投资中最重要的是避免犯大错误。",
            author: "查理·芒格"
        },
        {
            content: "理解企业的商业模式比关注股价更重要。",
            author: "彼得·林奇"
        },
        {
            content: "市场会过度反应，这是价值投资者的机会。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "最好的投资机会往往隐藏在市场的恐惧之中。",
            author: "约翰·邓普顿"
        },
        {
            content: "投资不是科学，而是一门艺术。",
            author: "沃伦·巴菲特"
        },
        {
            content: "理解复利的力量并尽早开始投资。",
            author: "投资智慧"
        },
        {
            content: "不要试图在短期内战胜市场，而要在长期内获得稳定回报。",
            author: "约翰·博格"
        },
        {
            content: "市场总是会给那些有耐心的人奖励。",
            author: "查理·芒格"
        },
        {
            content: "投资中最重要的是避免永久性资本损失。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "最好的投资是那些你完全理解的投资。",
            author: "沃伦·巴菲特"
        },
        {
            content: "市场短期是情绪化的，长期是价值回归的。",
            author: "投资智慧"
        },
        {
            content: "不要因为别人的意见而改变你的投资决策。",
            author: "菲利普·费雪"
        },
        {
            content: "成功的投资者都有一份自己的投资清单。",
            author: "查理·芒格"
        },
        {
            content: "投资中最重要的是保持理性，而不是追逐热点。",
            author: "彼得·林奇"
        },
        {
            content: "市场波动是朋友，而不是敌人。",
            author: "沃伦·巴菲特"
        },
        {
            content: "最好的防御性投资就是选择优秀的企业。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "投资不是要成为最聪明的人，而是要避免成为最愚蠢的人。",
            author: "查理·芒格"
        },
        {
            content: "市场总是会犯错，这是价值投资者的机会。",
            author: "约翰·邓普顿"
        },
        {
            content: "不要试图预测市场的短期走势，而要关注企业的长期价值。",
            author: "沃伦·巴菲特"
        },
        {
            content: "成功的投资需要勇气、耐心和纪律。",
            author: "投资智慧"
        },
        {
            content: "最好的投资是那些你可以持有到永远的投资。",
            author: "沃伦·巴菲特"
        },
        {
            content: "市场短期是情绪驱动的，长期是基本面驱动的。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "投资中最重要的是避免重大的错误。",
            author: "查理·芒格"
        },
        {
            content: "不要因为市场下跌而卖出，要因为价值下跌而买入。",
            author: "约翰·邓普顿"
        },
        {
            content: "理解企业的竞争优势比关注宏观经济更重要。",
            author: "彼得·林奇"
        },
        {
            content: "投资不是关于复杂的计算，而是关于简单的常识。",
            author: "沃伦·巴菲特"
        },
        {
            content: "市场总是会回归理性，只是时间问题。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "成功的投资者都懂得控制自己的情绪。",
            author: "投资智慧"
        },
        {
            content: "最好的投资机会往往出现在危机之中。",
            author: "约翰·邓普顿"
        },
        {
            content: "投资不是要追求最高回报，而是要避免最大风险。",
            author: "霍华德·马克斯"
        },
        {
            content: "理解价值，耐心等待，果断行动。",
            author: "投资谚语"
        },
        {
            content: "市场短期是投票机，但最终是称重机。",
            author: "本杰明·格雷厄姆"
        },
        {
            content: "成功的投资者都有一份长期的视角。",
            author: "沃伦·巴菲特"
        },
        {
            content: "不要因为短期波动而放弃长期价值。",
            author: "查理·芒格"
        },
        {
            content: "投资中最重要的是坚持自己的原则。",
            author: "菲利普·费雪"
        },
        {
            content: "市场总是会给那些有耐心的人丰厚的回报。",
            author: "投资智慧"
        },
        {
            content: "理解复利，利用时间，创造财富。",
            author: "投资谚语"
        }
    ],
    
    // 获取随机语录
    getRandomQuote: function() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    },
    
    // 更新语录显示
    updateQuoteDisplay: function() {
        const quoteContent = document.getElementById('quoteContent');
        const quoteAuthor = document.getElementById('quoteAuthor');
        
        if (quoteContent && quoteAuthor) {
            const quote = this.getRandomQuote();
            quoteContent.textContent = quote.content;
            quoteAuthor.textContent = quote.author;
        }
    },
    
    // 绑定刷新按钮事件
    bindRefreshButton: function() {
        const refreshButton = document.getElementById('refreshQuote');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.updateQuoteDisplay();
                
                // 添加按钮点击动画
                refreshButton.classList.add('clicked');
                setTimeout(() => {
                    refreshButton.classList.remove('clicked');
                }, 300);
            });
        }
    },
    
    // 初始化
    init: function() {
        // 检查页面是否有语录元素
        const quoteContent = document.getElementById('quoteContent');
        if (!quoteContent) {
            console.log('当前页面没有投资语录模块');
            return; // 如果页面没有语录模块，不执行初始化
        }
        
        // 初始显示一条语录
        this.updateQuoteDisplay();
        
        // 绑定刷新按钮事件
        this.bindRefreshButton();
        
        console.log('投资语录模块初始化完成');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    QuotesManager.init();
});