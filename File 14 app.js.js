// ================================================================
//  🚀 APP MODULE
//  Main application controller
//  ================================================================

// ================================================================
//  GLOBAL STATE
//  ================================================================
let currentUser = null;
let currentUserRole = null;
let currentUserId = null;
let restaurants = [];
let menuItems = [];
let orders = [];
let systemSettings = {};
let appData = {};

// ================================================================
//  UPDATE UI AFTER LOGIN
//  ================================================================
function updateUIAfterLogin() {
    // Update role badge
    const badge = document.getElementById('headerRoleBadge');
    if (badge && currentUserRole) {
        badge.textContent = getRoleLabel(currentUserRole);
        badge.className = 'role-badge-header ' + getRoleBadgeClass(currentUserRole);
    }

    // Update avatar
    const avatar = document.getElementById('avatarBtn');
    if (avatar && currentUser) {
        const name = currentUser.name || 'User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatar.textContent = initials;
    }

    // Update nav visibility
    updateNavVisibility();

    // Refresh data
    if (currentUser) {
        loadAllData();
    }
}

// ================================================================
//  LOAD ALL DATA
//  ================================================================
async function loadAllData() {
    try {
        // Load restaurants
        restaurants = await loadRestaurants();
        window.restaurants = restaurants;

        // Load menu items
        menuItems = await loadMenuItems();
        window.menuItems = menuItems;

        // Load system settings
        systemSettings = await loadSystemSettings();
        window.systemSettings = systemSettings;

        // Update delivery fee display
        document.getElementById('deliveryFeeDisplay').textContent = formatPrice(systemSettings.deliveryFee || 80);
        document.getElementById('deliveryFeeDisplayCart').textContent = formatPrice(systemSettings.deliveryFee || 80);

        // Load orders if logged in
        if (currentUser) {
            orders = await loadOrders(currentUserId, currentUserRole);
            window.orders = orders;
        }

        // Render UI based on role
        if (currentUserRole === 'customer') {
            renderRestaurants();
            renderOrderHistory();
            renderMenu();
            updateCartUI();
            updateWhatsAppPreview();
            switchTab('tab-customer');
        } else if (currentUserRole === 'vendor') {
            renderVendorDashboard();
            switchTab('tab-vendor');
        } else if (currentUserRole === 'driver') {
            renderDriverDashboard();
            initDriverMap();
            switchTab('tab-driver');
        } else if (currentUserRole === 'admin') {
            renderAdminDashboard();
            switchTab('tab-admin');
        }

        // Add restaurant markers
        addRestaurantMarkers();

        console.log('✅ All data loaded successfully');

    } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('⚠️ Error loading data: ' + error.message, 'error');
    }
}

// ================================================================
//  INITIALIZE APP
//  ================================================================
async function initApp() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('hidden');

    try {
        // Load data
        await loadAllData();

        // Check session
        const user = await checkSession();

        if (user) {
            currentUser = user;
            currentUserRole = user.role;
            currentUserId = user.id;
            hideAuthOverlay();
            updateUIAfterLogin();
        } else {
            showAuthOverlay();
            // Still load public data
            renderRestaurants();
        }

        // Initialize map
        setTimeout(initMap, 500);

        // Bind events
        bindEvents();

        // Setup realtime subscriptions
        setupRealtimeSubscriptions();

        // Time
        const now = new Date();
        document.getElementById('statusTime').textContent = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Update location
        const loc = appData.location;
        if (loc.lat && loc.lng) {
            userLocation = { lat: loc.lat, lng: loc.lng };
            setTimeout(() => {
                updateMap(loc.lat, loc.lng);
                if (currentUserRole === 'customer') renderRestaurants();
            }, 400);
        } else {
            getLocation();
        }

        console.log('🍔 FastFood Guy — App initialized');

    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('⚠️ Error loading app: ' + error.message, 'error');
    } finally {
        overlay.classList.add('hidden');
    }
}

// ================================================================
//  SETUP REALTIME SUBSCRIPTIONS
//  ================================================================
function setupRealtimeSubscriptions() {
    // Subscribe to orders changes
    const channel = supabase
        .channel('orders-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders'
        }, (payload) => {
            console.log('📡 Realtime order update:', payload);

            // Reload orders
            if (currentUser) {
                loadOrders(currentUserId, currentUserRole).then(newOrders => {
                    orders = newOrders;
                    window.orders = orders;

                    // Update UI based on role
                    if (currentUserRole === 'customer') {
                        renderOrderHistory();
                    } else if (currentUserRole === 'vendor') {
                        renderVendorDashboard();
                    } else if (currentUserRole === 'driver') {
                        renderDriverDashboard();
                    } else if (currentUserRole === 'admin') {
                        renderAdminDashboard();
                    }

                    showToast('🔄 Order updated', 'info');
                });
            }
        })
        .subscribe((status) => {
            console.log('📡 Realtime subscription status:', status);
        });

    // Store channel for cleanup
    window.realtimeChannel = channel;
}

// ================================================================
//  EXPOSE GLOBAL VARIABLES
//  ================================================================
window.currentUser = currentUser;
window.currentUserRole = currentUserRole;
window.currentUserId = currentUserId;
window.restaurants = restaurants;
window.menuItems = menuItems;
window.orders = orders;
window.systemSettings = systemSettings;
window.appData = appData;