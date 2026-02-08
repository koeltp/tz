// 数据源切换器
const SourceSwitcher = {
    init: async function() {
        // 初始化站点配置
        await App.initSiteConfig();
        
        // 从localStorage加载数据源
        await App.loadSourceFromStorage();
        
        // 动态生成下拉菜单选项
        this.generateDropdownMenu();
        
        // 绑定事件
        this.bindEvents();
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
            const iconClass = source.icon || 'images/icon/default.png';
            
            li.innerHTML = `
                <a href="#" class="dropdown-item" data-source="${source.id}">
                    <img src="${iconClass}" alt="${source.sitename} icon" class="source-icon">
                    <span>${source.sitename}</span>
                </a>
            `;
            
            dropdownMenu.appendChild(li);
            
            // 直接绑定点击事件
            const link = li.querySelector('.dropdown-item');
            if (link) {
                link.addEventListener('click', this.handleSourceSwitch.bind(this));
            }
        });
    },
    
    bindEvents: function() {
        this.bindDropdownToggle();
        this.bindClickOutside();
    },
    
    bindDropdownToggle: function() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdown = document.querySelector('.dropdown');
        
        if (dropdownToggle && dropdown) {
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
        }
    },
    
    bindClickOutside: function() {
        const dropdown = document.querySelector('.dropdown');
        
        if (dropdown) {
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    },
    
    handleSourceSwitch: function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const source = e.currentTarget.getAttribute('data-source');
        if (source) {
            App.switchSource(source);
        }
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