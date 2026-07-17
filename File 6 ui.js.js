// ================================================================
//  🎨 UI MODULE
//  Handles all user interface updates
//  ================================================================

// ================================================================
//  TOAST NOTIFICATIONS
//  ================================================================
let toastTimeout;

function showToast(message, type) {
    type = type || 'info';
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast show ' + type;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        el.classList.remove('show');
    }, 3500);
}

// ================================================================
//  TAB SWITCHING
//  ================================================================
function switchTab(tabId) {
    const panels = {
        'tab-customer': document.getElementById('tab-customer'),
        'tab-vendor': document.getElementById('tab-vendor'),
        'tab-menu': document.getElementById('tab-menu'),
        'tab-driver': document.getElementById('tab-driver'),
        'tab-admin': document.getElementById('tab-admin'),
        'tab-whatsapp': document.getElementById('tab-whatsapp')
    };

    const navItems = document.querySelectorAll('.bottom-nav .nav-item');

    Object.values(panels).forEach(p => {
        if (p) p.classList.remove('active');
    });
    if (panels[tabId]) panels[tabId].classList.add('active');

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });

    const content = document.getElementById('appContent');
    if (content) content.scrollTop = 0;

    // Refresh content based on tab
    if (tabId === 'tab-customer') {
        renderRestaurants();
        renderOrderHistory();
    }
    if (tabId === 'tab-vendor') {
        renderVendorDashboard();
    }
    if (tabId === 'tab-menu') {
        renderMenu();
        updateCartUI();
    }
    if (tabId === 'tab-driver') {
        renderDriverDashboard();
    }
    if (tabId === 'tab-admin') {
        renderAdminDashboard();
    }
    if (tabId === 'tab-whatsapp') {
        updateWhatsAppPreview();
    }
}

// ================================================================
//  ROLE HELPERS
//  ================================================================
function getRoleBadgeClass(role) {
    const map = {
        customer: 'customer',
        vendor: 'vendor',
        driver: 'driver',
        admin: 'admin'
    };
    return map[role] || 'customer';
}

function getRoleIcon(role) {
    const map = {
        customer: 'fa-user',
        vendor: 'fa-store',
        driver: 'fa-motorcycle',
        admin: 'fa-user-tie'
    };
    return map[role] || 'fa-user';
}

function getRoleLabel(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
}

function updateHeaderRole() {
    const badge = document.getElementById('headerRoleBadge');
    if (badge && currentUserRole) {
        badge.textContent = getRoleLabel(currentUserRole);
        badge.className = 'role-badge-header ' + getRoleBadgeClass(currentUserRole);
    }

    const avatar = document.getElementById('avatarBtn');
    if (avatar && currentUser) {
        const name = currentUser.name || 'User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatar.textContent = initials;
    }

    updateNavVisibility();
}

function updateNavVisibility() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const role = currentUserRole || 'customer';
    const visibleTabs = {
        customer: ['tab-customer', 'tab-menu', 'tab-whatsapp'],
        vendor: ['tab-vendor', 'tab-menu', 'tab-whatsapp'],
        driver: ['tab-driver', 'tab-whatsapp'],
        admin: ['tab-admin', 'tab-whatsapp']
    };

    const allowed = visibleTabs[role] || ['tab-customer', 'tab-menu'];
    navItems.forEach(item => {
        const tab = item.dataset.tab;
        const shouldShow = allowed.includes(tab);
        item.style.display = shouldShow ? 'flex' : 'none';
        if (!shouldShow && item.classList.contains('active')) {
            item.classList.remove('active');
            for (const nav of navItems) {
                if (nav.style.display !== 'none') {
                    nav.classList.add('active');
                    switchTab(nav.dataset.tab);
                    break;
                }
            }
        }
    });
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.showToast = showToast;
window.switchTab = switchTab;
window.getRoleBadgeClass = getRoleBadgeClass;
window.getRoleIcon = getRoleIcon;
window.getRoleLabel = getRoleLabel;
window.updateHeaderRole = updateHeaderRole;
window.updateNavVisibility = updateNavVisibility;