// ================================================================
//  🚗 DRIVER MODULE
//  Handles driver dashboard operations
//  ================================================================

// ================================================================
//  RENDER DRIVER DASHBOARD
//  ================================================================
function renderDriverDashboard() {
    if (currentUserRole !== 'driver') return;

    document.getElementById('driverNameDisplay').textContent =
        'Welcome, ' + (currentUser.name || 'Driver');

    // Available orders (ready for pickup, no driver assigned)
    const available = window.orders?.filter(o => o.status === 'ready' && !o.driver_id) || [];
    const availContainer = document.getElementById('driverAvailableList');

    if (available.length === 0) {
        availContainer.innerHTML =
            '<div class="text-muted text-center" style="padding:20px 0;">No orders available</div>';
    } else {
        let html = '';
        for (const o of available) {
            const itemsText = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';
            const rname = window.restaurants?.find(r => r.id === o.restaurant_id)?.name || 'Restaurant';

            html += `
                <div class="order-card" data-order-id="${o.id}">
                    <div class="order-header">
                        <span class="order-id">${o.order_id}</span>
                        <span class="order-status ready">📦 Ready</span>
                    </div>
                    <div class="order-details"><strong>${rname}</strong></div>
                    <div class="order-details">${itemsText}</div>
                    <div class="order-details">Customer: ${o.customer_address}</div>
                    <div class="order-details">Total: ${formatPrice(o.total)} (Delivery: ${formatPrice(o.delivery_fee)})</div>
                    <div class="order-actions">
                        <button class="btn-accept" data-order-id="${o.id}">Accept & Deliver</button>
                    </div>
                </div>
            `;
        }
        availContainer.innerHTML = html;

        availContainer.querySelectorAll('.btn-accept').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.orderId;
                await updateOrderStatus(id, 'transit', currentUserId);

                // Load updated data
                await loadOrders(currentUserId, currentUserRole);
                renderDriverDashboard();
                renderVendorDashboard();
                renderAdminDashboard();
                renderOrderHistory();

                showToast('🛵 Order accepted! Delivering...', 'success');

                // Auto-deliver after a few seconds (demo)
                setTimeout(async () => {
                    await updateOrderStatus(id, 'delivered');
                    await loadOrders(currentUserId, currentUserRole);
                    renderDriverDashboard();
                    renderVendorDashboard();
                    renderAdminDashboard();
                    renderOrderHistory();
                    showToast('✅ Order delivered!', 'success');
                }, 5000);
            });
        });
    }

    // My active orders
    const myOrders = window.orders?.filter(o =>
        o.driver_id === currentUserId && o.status !== 'delivered'
    ) || [];

    const myContainer = document.getElementById('driverMyOrdersList');

    if (myOrders.length === 0) {
        myContainer.innerHTML =
            '<div class="text-muted text-center" style="padding:20px 0;">No active orders</div>';
    } else {
        let html = '';
        for (const o of myOrders) {
            const itemsText = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';
            const rname = window.restaurants?.find(r => r.id === o.restaurant_id)?.name || 'Restaurant';
            const statusLabel = o.status === 'transit' ? '🚗 In Transit' :
                o.status === 'ready' ? '📦 Ready' : o.status;

            html += `
                <div class="order-card" data-order-id="${o.id}">
                    <div class="order-header">
                        <span class="order-id">${o.order_id}</span>
                        <span class="order-status ${o.status}">${statusLabel}</span>
                    </div>
                    <div class="order-details"><strong>${rname}</strong></div>
                    <div class="order-details">${itemsText}</div>
                    <div class="order-details">Customer: ${o.customer_address}</div>
                    <div class="order-details">Total: ${formatPrice(o.total)}</div>
                    ${o.status === 'transit' ?
                        `<div class="order-actions">
                            <button class="btn-deliver" data-order-id="${o.id}">✅ Deliver</button>
                        </div>` : ''}
                </div>
            `;
        }
        myContainer.innerHTML = html;

        myContainer.querySelectorAll('.btn-deliver').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.orderId;
                await updateOrderStatus(id, 'delivered');

                await loadOrders(currentUserId, currentUserRole);
                renderDriverDashboard();
                renderVendorDashboard();
                renderAdminDashboard();
                renderOrderHistory();

                showToast('✅ Order delivered!', 'success');
            });
        });
    }

    // Update status badge
    const hasActive = myOrders.length > 0;
    document.getElementById('driverStatusBadge').textContent = hasActive ? 'Busy' : 'Available';
    document.getElementById('driverStatusBadge').className = 'status-badge ' +
        (hasActive ? 'busy' : 'available');
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.renderDriverDashboard = renderDriverDashboard;