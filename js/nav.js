// 导航栏交互逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 移动端导航切换
    const navToggle = document.getElementById('navToggle');
    const headerNav = document.getElementById('headerNav');
    
    if (navToggle && headerNav) {
        navToggle.addEventListener('click', function() {
            headerNav.classList.toggle('active');
            
            // 切换图标
            const icon = navToggle.querySelector('i');
            if (headerNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // 点击导航链接后关闭菜单（移动端）
        const navLinks = document.querySelectorAll('.header-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (headerNav.classList.contains('active')) {
                    headerNav.classList.remove('active');
                    const icon = navToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // 高亮当前页面导航链接
    highlightActiveNavLink();
    
    // 滚动时隐藏移动端导航
    window.addEventListener('scroll', function() {
        if (headerNav && headerNav.classList.contains('active')) {
            headerNav.classList.remove('active');
            if (navToggle) {
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
});

// 高亮当前页面导航链接
function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.header-nav-link');
    
    navLinks.forEach(link => {
        // 移除所有active类
        link.classList.remove('active');
        
        // 首页特殊处理
        if (currentPage === 'index.html' || currentPage === '') {
            if (link.getAttribute('href') === 'index.html') {
                link.classList.add('active');
            }
        }
        // 详情页时高亮首页
        else if (currentPage === 'detail.html') {
            if (link.getAttribute('href') === 'index.html') {
                link.classList.add('active');
            }
        }
        // 时光机页面
        else if (currentPage === 'timeline.html') {
            if (link.getAttribute('href') === 'timeline.html') {
                link.classList.add('active');
            }
        }
    });
}