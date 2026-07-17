// ================================================================
//  👔 ADMIN MODULE
//  Handles admin dashboard operations
//  ================================================================

// ================================================================
//  RENDER ADMIN DASHBOARD
//  ================================================================
function renderAdminDashboard() {
    if (currentUserRole !== 'admin') return;

    const allOrders = window.orders || [];

    // Stats
    const total = allOrders.length;
    const completed = allOrders.filter(o => o.status === 'delivered').length;
    const active = allOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const revenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const vendorCost = allOrders.reduce((sum, o) => sum + (o.vendor_cost || 0), 0);
    const deliveryFees = allOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

    document.getElementById('adminTotalOrders').textContent = total;
    document.getElementById('adminCompletedOrders').textContent = completed;
    document.getElementById('adminActiveOrders').textContent = active;
    document.getElementById('adminTotalRevenue').textContent = formatPrice(revenue);
    document.getElementById('adminTotalVendorCost').textContent = formatPrice(vendorCost);
    document.getElementById('adminTotalDeliveryFees').textContent = formatPrice(deliveryFees);

    // Settings
    if (window.systemSettings) {
        document.getElementById('adminDeliveryFee').value = window.systemSettings.deliveryFee || 80;
        document.getElementById('adminVendorCostPercent').value = window.systemSettings.vendorCostPercent || 30;
        document.getElementById('adminVendorCostBase').value = window.systemSettings.vendorCostBase || 15;
    }

    // All Orders
    const orderList = document.getElementById('adminOrdersList');

    if (allOrders.length === 0) {
        orderList.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">No orders yet</div>';
    } else {
        const statusMap = {
            'pending_payment': '⏳ Pending',
            'payment_confirmed': '✅ Paid',
            'preparing': '⏱️ Preparing',
            'ready': '📦 Ready',
            'transit': '🚗 Transit',
            'delivered': '✅ Delivered'
        };

        let html = '';
        for (const o of allOrders.slice(0, 10)) {
            const rname = window.restaurants?.find(r => r.id === o.restaurant_id)?.name || 'Restaurant';
            const itemsText = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';

            html += `
                <div style="display:flex;justify-content:space-between;padding:6px 0;
                    border-bottom:1px solid #f5f2f0;font-size:12px;flex-wrap:wrap;gap:4px;">
                    <span><strong>${o.order_id}</strong></span>
                    <span style="color:var(--text-muted);">${rname}</span>
                    <span style="color:var(--text-muted);">${itemsText}</span>
                    <span style="font-weight:600;">${formatPrice(o.total)}</span>
                    <span style="font-size:10px;font-weight:600;padding:1px 8px;border-radius:30px;
                        background:${o.status === 'delivered' ? 'var(--success-bg)' :
                        o.status === 'transit' ? 'var(--warning-bg)' : '#f0edf0'};
                        color:${o.status === 'delivered' ? 'var(--success)' :
                        o.status === 'transit' ? 'var(--warning)' : 'var(--text-muted)'};">
                        ${statusMap[o.status] || o.status}
                    </span>
                </div>
            `;
        }
        orderList.innerHTML = html;
    }

    // All Users
    // This would typically come from a users table
    // For demo, we'll show hardcoded users
    const userList = document.getElementById('adminUsersList');
    const demoUsers = [
        { name: 'Thabo Mokoena', role: 'customer', icon: 'fa-user', color: '#1d7a3e' },
        { name: 'Grace Mokoena (Mama\'s Kitchen)', role: 'vendor', icon: 'fa-store', color: '#f5a623' },
        { name: 'Sipho Mthembu', role: 'driver', icon: 'fa-motorcycle', color: '#2d7aff' },
        { name: 'Admin User', role: 'admin', icon: 'fa-user-tie', color: '#764ba2' }
    ];

    let userHtml = '';
    for (const u of demoUsers) {
        userHtml += `
            <div style="display:flex;justify-content:space-between;padding:4px 0;
                border-bottom:1px solid #f5f2f0;font-size:12px;">
                <span><i class="fas ${u.icon}" style="color:${u.color};"></i> ${u.name}</span>
                <span style="color:var(--text-muted);font-size:10px;text-transform:uppercase;">${u.role}</span>
            </div>
        `;
    }
    userList.innerHTML = userHtml;

    // All Restaurants
    const restList = document.getElementById('adminRestaurantsList');
    const allRestaurants = window.restaurants || [];

    if (allRestaurants.length === 0) {
        restList.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">No restaurants</div>';
    } else {
        let restHtml = '';
        for (const r of allRestaurants) {
            const vendor = window.users?.find(u => u.id === r.vendor_id);

            restHtml += `
                <div style="display:flex;justify-content:space-between;padding:4px 0;
                    border-bottom:1px solid #f5f2f0;font-size:12px;">
                    <span><strong>${r.name}</strong>
                        <span style="color:var(--text-muted);font-size:10px;">${r.cuisine}</span>
                    </span>
                    <span style="color:var(--text-muted);">${vendor?.name || 'Unassigned'}</span>
                    <span style="font-size:10px;font-weight:600;padding:1px 8px;border-radius:30px;
                        background:${r.is_active ? 'var(--success-bg)' : 'var(--danger-bg)'};
                        color:${r.is_active ? 'var(--success)' : 'var(--danger)'};">
                        ${r.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            `;
        }
        restList.innerHTML = restHtml;
    }
}

// ================================================================
//  SAVE ADMIN SETTINGS
//  ================================================================
async function saveAdminSettings() {
    const deliveryFee = parseFloat(document.getElementById('adminDeliveryFee').value);
    const vendorCostPercent = parseFloat(document.getElementById('adminVendorCostPercent').value);
    const vendorCostBase = parseFloat(document.getElementById('adminVendorCostBase').value);

    if (isNaN(deliveryFee) || isNaN(vendorCostPercent) || isNaN(vendorCostBase)) {
        showToast('Please enter valid numbers', 'error');
        return;
    }

    try {
        await updateSystemSettings({
            deliveryFee,
            vendorCostPercent,
            vendorCostBase
        });

        // Update local settings
        window.systemSettings = {
            deliveryFee,
            vendorCostPercent,
            vendorCostBase
        };

        document.getElementById('deliveryFeeDisplay').textContent = formatPrice(deliveryFee);
        document.getElementById('deliveryFeeDisplayCart').textContent = formatPrice(deliveryFee);

        showToast('✅ Settings saved!', 'success');
        updateCartUI();
        renderVendorDashboard();
        renderAdminDashboard();

    } catch (error) {
        showToast('❌ Failed to save settings', 'error');
    }
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.renderAdminDashboard = renderAdminDashboard;
window.saveAdminSettings = saveAdminSettings;