// 数据源切换器
const SourceSwitcher = {
    init: async function() {
        // 初始化站点配置
        await App.initSiteConfig();
        
        // 从localStorage加载数据源
        await App.loadSourceFromStorage();
        
        // 动态生成下拉菜单选项
        this.generateDropdownMenu();
        
        // 绑定下拉菜单点击事件
        this.bindDropdownEvents();
        
        // 绑定数据源切换事件
        this.bindSourceSwitchEvents();
    },
    
    generateDropdownMenu: function() {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (!dropdownMenu) return;
        
        if (!App.siteConfig || !App.siteConfig.sources) {
            console.error('站点配置未加载');
            return;
        }
        
        // 清空现有选项
        dropdownMenu.innerHTML = '';
        
        // 根据site.json中的sources数组生成选项
        App.siteConfig.sources.forEach(source => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" class="dropdown-item" data-source="${source.id}">
                    <i class="fas ${this.getIconForSource(source.id)}"></i>
                    <span>${source.sitename}</span>
                </a>
            `;
            dropdownMenu.appendChild(li);
        });
    },
    
    getIconForSource: function(sourceId) {
        const iconMap = {
            'tptz': 'fa-chart-line',
            'xszb': 'fa-chart-bar'
        };
        return iconMap[sourceId] || 'fa-chart-pie';
    },
    
    bindDropdownEvents: function() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdown = document.querySelector('.dropdown');
        
        if (dropdownToggle && dropdown) {
            // 点击下拉切换按钮
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
            
            // 点击外部关闭下拉菜单
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    },
    
    bindSourceSwitchEvents: function() {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const source = this.getAttribute('data-source');
                if (source) {
                    App.switchSource(source);
                }
            });
        });
    }
};

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        SourceSwitcher.init();
    });
} else {
    // DOM已经加载完成
    SourceSwitcher.init();
}