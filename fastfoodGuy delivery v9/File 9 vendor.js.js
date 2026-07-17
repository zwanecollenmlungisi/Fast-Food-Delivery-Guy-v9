// ================================================================
//  🏪 VENDOR MODULE
//  Handles vendor dashboard operations
//  ================================================================

// ================================================================
//  RENDER VENDOR DASHBOARD
//  ================================================================
function renderVendorDashboard() {
    if (currentUserRole !== 'vendor') return;

    const vendorRestaurant = window.restaurants?.find(r => r.vendor_id === currentUserId);
    const vendorOrders = window.orders?.filter(o => o.restaurant_id === vendorRestaurant?.id) || [];

    document.getElementById('vendorNameDisplay').textContent =
        'Welcome, ' + (currentUser.business_name || currentUser.name);

    // Restaurant info
    const infoDiv = document.getElementById('vendorRestaurantInfo');
    if (vendorRestaurant) {
        infoDiv.innerHTML = `
            <div style="font-weight:600;">${vendorRestaurant.name}</div>
            <div style="font-size:13px;color:var(--text-muted);">${vendorRestaurant.address}</div>
            <div style="font-size:13px;color:var(--text-muted);">⭐ ${vendorRestaurant.rating} · ${vendorRestaurant.cuisine}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                Min order: ${formatPrice(vendorRestaurant.min_order)}
            </div>
        `;
    } else {
        infoDiv.innerHTML =
            '<div class="text-muted fs-13">No restaurant registered yet. Contact admin to set up your restaurant.</div>';
    }

    // Orders
    const orderList = document.getElementById('vendorOrdersList');
    const incoming = vendorOrders.filter(o =>
        o.status === 'payment_confirmed' || o.status === 'preparing' || o.status === 'ready'
    );

    document.getElementById('vendorOrderBadge').textContent = incoming.length;

    if (incoming.length === 0) {
        orderList.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">No incoming orders</div>';
    } else {
        let html = '';
        for (const o of incoming) {
            const itemsText = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';
            const statusLabel = o.status === 'payment_confirmed' ? '⏳ Paid - Prepare' :
                o.status === 'preparing' ? '⏱️ Preparing' :
                o.status === 'ready' ? '📦 Ready for pickup' : o.status;

            html += `
                <div style="background:#faf8f6;border-radius:10px;padding:12px 14px;border:1px solid var(--border);margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;font-weight:600;font-size:13px;">
                        <span>${o.order_id}</span>
                        <span style="color:var(--primary);">${formatPrice(o.total)}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);">${itemsText}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                        <i class="fas fa-user"></i> Customer · ${o.customer_address}
                    </div>
                    <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
                        <span style="font-size:10px;font-weight:600;padding:2px 10px;border-radius:30px;
                            background:${o.status === 'ready' ? 'var(--success-bg)' : 'var(--warning-bg)'};
                            color:${o.status === 'ready' ? 'var(--success)' : 'var(--warning)'};">
                            ${statusLabel}
                        </span>
                        ${o.status === 'payment_confirmed' ?
                            `<button class="vendor-prepare-btn" data-id="${o.id}" style="font-size:10px;padding:3px 12px;border-radius:30px;border:none;background:var(--primary);color:white;cursor:pointer;font-weight:600;">
                                Start Preparing
                            </button>` : ''}
                        ${o.status === 'preparing' ?
                            `<button class="vendor-ready-btn" data-id="${o.id}" style="font-size:10px;padding:3px 12px;border-radius:30px;border:none;background:var(--success);color:white;cursor:pointer;font-weight:600;">
                                Mark Ready
                            </button>` : ''}
                    </div>
                </div>
            `;
        }
        orderList.innerHTML = html;

        // Event listeners
        orderList.querySelectorAll('.vendor-prepare-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                await updateOrderStatus(id, 'preparing');
                await loadOrders(currentUserId, currentUserRole);
                renderVendorDashboard();
                renderDriverDashboard();
                renderAdminDashboard();
                renderOrderHistory();
                showToast('👨‍🍳 Order is being prepared', 'success');
            });
        });

        orderList.querySelectorAll('.vendor-ready-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                await updateOrderStatus(id, 'ready');
                await loadOrders(currentUserId, currentUserRole);
                renderVendorDashboard();
                renderDriverDashboard();
                renderAdminDashboard();
                renderOrderHistory();
                showToast('📦 Order ready for pickup!', 'success');
            });
        });
    }

    // Stats
    const todayOrders = vendorOrders.filter(o => {
        const d = new Date(o.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    });

    document.getElementById('vendorOrderCount').textContent = todayOrders.length;
    const revenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('vendorRevenue').textContent = formatPrice(revenue);
    const vendorCost = todayOrders.reduce((sum, o) => sum + (o.vendor_cost || 0), 0);
    document.getElementById('vendorCostDisplay').textContent = formatPrice(vendorCost);

    renderVendorMenu();
}

// ================================================================
//  RENDER VENDOR MENU
//  ================================================================
function renderVendorMenu() {
    const container = document.getElementById('vendorMenuList');
    if (!container) return;

    const vendorItems = window.menuItems?.filter(m => m.vendor_id === currentUserId) || [];

    if (vendorItems.length === 0) {
        container.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">No menu items yet</div>';
        return;
    }

    let html = '';
    for (const item of vendorItems) {
        const statusLabel = item.available ? 'Available' : 'Unavailable';
        const statusBg = item.available ? 'var(--success-bg)' : 'var(--danger-bg)';
        const statusColor = item.available ? 'var(--success)' : 'var(--danger)';

        html += `
            <div class="menu-item-row" data-id="${item.id}">
                <div class="mi-left">
                    <div class="mi-name">${item.name}${item.popular ? ' 🔥' : ''}</div>
                    <div class="mi-desc">${item.description || ''} · ${item.category || 'General'}</div>
                </div>
                <div class="mi-right">
                    <span class="mi-price">${formatPrice(item.price)}</span>
                    <span style="font-size:11px;font-weight:600;padding:2px 10px;border-radius:30px;
                        background:${statusBg};color:${statusColor};">
                        ${statusLabel}
                    </span>
                    <div style="display:flex;gap:3px;">
                        <button class="vendor-edit-btn" data-id="${item.id}"
                            style="background:none;border:1px solid var(--border);border-radius:50%;width:28px;height:28px;cursor:pointer;">
                            <i class="fas fa-edit" style="font-size:12px;"></i>
                        </button>
                        <button class="vendor-toggle-btn" data-id="${item.id}"
                            style="background:none;border:1px solid var(--border);border-radius:50%;width:28px;height:28px;cursor:pointer;
                            color:${item.available ? 'var(--success)' : 'var(--danger)'};">
                            <i class="fas fa-${item.available ? 'toggle-on' : 'toggle-off'}"></i>
                        </button>
                        <button class="vendor-delete-btn" data-id="${item.id}"
                            style="background:none;border:1px solid var(--border);border-radius:50%;width:28px;height:28px;cursor:pointer;color:var(--danger);">
                            <i class="fas fa-trash" style="font-size:12px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    // Toggle availability
    container.querySelectorAll('.vendor-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            const item = window.menuItems?.find(m => m.id === id);
            if (item) {
                await updateMenuItem(id, { available: !item.available });
            }
        });
    });

    // Delete item
    container.querySelectorAll('.vendor-delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (!confirm('Remove this item?')) return;
            await deleteMenuItem(id);
        });
    });

    // Edit item
    container.querySelectorAll('.vendor-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const item = window.menuItems?.find(m => m.id === id);
            if (!item) return;

            const newName = prompt('Item name:', item.name);
            if (newName !== null && newName.trim()) {
                const newPrice = prompt('Price (R):', item.price);
                if (newPrice !== null && !isNaN(parseFloat(newPrice)) && parseFloat(newPrice) >= 0) {
                    const newDesc = prompt('Description:', item.description || '');
                    if (newDesc !== null) {
                        updateMenuItem(id, {
                            name: newName.trim(),
                            price: parseFloat(newPrice),
                            description: newDesc
                        });
                    }
                }
            }
        });
    });
}

// ================================================================
//  MENU ITEM OPERATIONS
//  ================================================================
async function addMenuItem(name, price, description, category) {
    if (currentUserRole !== 'vendor') {
        showToast('Only vendors can add items', 'error');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{
                vendor_id: currentUserId,
                restaurant_id: window.restaurants?.find(r => r.vendor_id === currentUserId)?.id || null,
                name: name,
                description: description || '',
                price: price,
                category: category || 'General',
                available: true,
                popular: false
            }])
            .select()
            .single();

        if (error) throw error;

        window.menuItems.push(data);
        renderVendorMenu();
        renderMenu();
        showToast('✅ "' + name + '" added to menu', 'success');
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

async function updateMenuItem(itemId, updates) {
    if (currentUserRole !== 'vendor') return;

    try {
        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', itemId)
            .eq('vendor_id', currentUserId)
            .select()
            .single();

        if (error) throw error;

        const idx = window.menuItems?.findIndex(m => m.id === itemId);
        if (idx !== -1) {
            window.menuItems[idx] = data;
            renderVendorMenu();
            renderMenu();
            showToast('✅ Item updated', 'success');
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

async function deleteMenuItem(itemId) {
    if (currentUserRole !== 'vendor') return;

    try {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', itemId)
            .eq('vendor_id', currentUserId);

        if (error) throw error;

        window.menuItems = window.menuItems?.filter(m => m.id !== itemId) || [];
        renderVendorMenu();
        renderMenu();
        showToast('✅ Item removed', 'success');
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.renderVendorDashboard = renderVendorDashboard;
window.renderVendorMenu = renderVendorMenu;
window.addMenuItem = addMenuItem;
window.updateMenuItem = updateMenuItem;
window.deleteMenuItem = deleteMenuItem;