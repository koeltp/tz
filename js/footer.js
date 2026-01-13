// footer.js - 动态生成页脚内容
(function() {
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 找到页脚元素
        const footerElement = document.querySelector('.footer .container');
        
        if (footerElement) {
            // 创建页脚内容
            footerElement.innerHTML = `
                <div class="footer-info">
                    <p>© 2026 TP投资 - 股票投资周报</p>    
                    <div class="runtime-counter" id="runtime-counter">
                        小破站已运行 <span class="time-unit days" id="days">0</span> 天 
                        <span class="time-unit hours" id="hours">0</span> 时 
                        <span class="time-unit minutes" id="minutes">0</span> 分 
                        <span class="time-unit seconds" id="seconds">0</span> 秒
                    </div>
                    <p class="friend-link">友情链接：<a href="https://nav.taipi.top" target="_blank">太皮导航</a> | <a href="https://tools.taipi.top" target="_blank">太皮工具箱</a> | <a href="https://www.byteepoch.com/" target="_blank">字节时代</a> | <a href="https://nov.dev" target="_blank">NOV</a></p>
                    <p class="disclaimer">本报告仅供参考，不构成投资建议。投资有风险，入市需谨慎。</p>
                </div>
            `;
            
            // 开始运行时间计时器
            startRuntimeCounter();
        }
    });
    
    // 运行时间计时器
    function startRuntimeCounter() {
        // 起始时间：2026年1月8日 15:00:00
        const startTime = new Date('2026-01-08T15:00:00').getTime();
        
        function updateRuntime() {
            const now = new Date().getTime();
            const timeDiff = now - startTime;
            
            // 计算天、时、分、秒
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            // 更新显示
            const daysElement = document.getElementById('days');
            const hoursElement = document.getElementById('hours');
            const minutesElement = document.getElementById('minutes');
            const secondsElement = document.getElementById('seconds');
            
            if (daysElement) daysElement.textContent = days;
            if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
            if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
            if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
        
        // 立即更新一次
        updateRuntime();
        
        // 每秒更新一次
        setInterval(updateRuntime, 1000);
    }
})();