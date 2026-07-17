// ================================================================
//  📋 ORDERS MODULE
//  Handles order creation and management
//  ================================================================

let pendingOrderData = null;

// ================================================================
//  CREATE ORDER
//  ================================================================
async function createOrder(orderData) {
    try {
        // Generate order ID
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const orderNumber = String((count || 0) + 1).padStart(3, '0');
        const orderId = 'ORD-' + orderNumber;

        // Insert order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                order_id: orderId,
                customer_id: orderData.customer_id,
                restaurant_id: orderData.restaurant_id,
                subtotal: orderData.subtotal,
                delivery_fee: orderData.delivery_fee,
                vendor_cost: orderData.vendor_cost,
                total: orderData.total,
                customer_address: orderData.customer_address,
                customer_phone: orderData.customer_phone,
                status: 'pending_payment',
                payment_status: 'pending'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert order items
        const orderItems = orderData.items.map(i => ({
            order_id: order.id,
            menu_item_id: i.menu_item_id,
            name: i.name,
            qty: i.qty,
            price: i.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
        if (itemsError) throw itemsError;

        console.log('✅ Order created:', orderId);
        return order;
    } catch (error) {
        console.error('❌ Create order error:', error);
        throw error;
    }
}

// ================================================================
//  UPDATE ORDER STATUS
//  ================================================================
async function updateOrderStatus(orderId, status, driverId) {
    try {
        const updates = {
            status: status,
            updated_at: new Date()
        };
        if (driverId) updates.driver_id = driverId;
        if (status === 'transit') updates.picked_up_at = new Date();
        if (status === 'delivered') updates.delivered_at = new Date();

        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Order status updated:', status);
        return data;
    } catch (error) {
        console.error('❌ Update order status error:', error);
        throw error;
    }
}

// ================================================================
//  PLACE ORDER
//  ================================================================
function placeOrder() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }

    if (currentUserRole !== 'customer') {
        showToast('Only customers can place orders', 'error');
        return;
    }

    const { subtotal, delivery, vendorCost, total } = calcCartTotal();
    const minOrder = 50;

    if (subtotal < minOrder) {
        showToast('Minimum order is ' + formatPrice(minOrder), 'error');
        return;
    }

    const restaurant = window.restaurants?.find(r => r.id === currentRestaurantId);

    const orderData = {
        customer_id: currentUserId,
        restaurant_id: restaurant ? restaurant.id : null,
        items: cart.map(c => {
            const item = window.menuItems?.find(m => m.id === c.menuId);
            return {
                menu_item_id: c.menuId,
                name: item?.name || 'Unknown',
                qty: c.qty,
                price: item?.price || 0
            };
        }),
        subtotal: subtotal,
        delivery_fee: delivery,
        vendor_cost: vendorCost,
        total: total,
        customer_address: currentUser.address || 'No address',
        customer_phone: currentUser.phone || 'No phone'
    };

    // Store for payment processing
    pendingOrderData = orderData;

    // Show payment modal
    const modal = document.getElementById('paymentModal');
    const body = document.getElementById('paymentBody');

    const itemsText = orderData.items.map(i => `${i.qty}× ${i.name}`).join(', ');
    body.innerHTML = `
        <strong>Order Summary:</strong><br>
        ${itemsText}<br><br>
        <strong>Subtotal:</strong> ${formatPrice(orderData.subtotal)}<br>
        <strong>Delivery:</strong> ${formatPrice(orderData.delivery_fee)}<br>
        <strong>Vendor Cost:</strong> ${formatPrice(orderData.vendor_cost)}<br>
        <strong>Total:</strong> ${formatPrice(orderData.total)}<br><br>
        💳 Please complete payment via WhatsApp to confirm your order.<br>
        📲 Admin will receive your payment request.
    `;

    modal.classList.add('active');
    showToast('✅ Order placed!', 'success');

    // Clear cart
    clearCart();
    renderOrderHistory();
    updateWhatsAppPreview();

    // Notify vendor
    setTimeout(() => {
        showToast('📢 Vendor notified of your order', 'info');
    }, 1000);
}

// ================================================================
//  PROCESS WHATSAPP PAYMENT
//  ================================================================
async function processWhatsAppPayment() {
    if (!pendingOrderData) return;

    const modal = document.getElementById('paymentModal');
    modal.classList.remove('active');

    // Build message for admin
    const message =
        '🍔 FastFood Guy — New Order Payment Request\n\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '👤 Customer: ' + (currentUser ? currentUser.name : 'Unknown') + '\n' +
        '📍 Address: ' + (currentUser ? currentUser.address : 'N/A') + '\n' +
        '📞 Phone: ' + (currentUser ? currentUser.phone : 'N/A') + '\n\n' +
        '🛒 Order: ' + pendingOrderData.items.map(i => `${i.qty}× ${i.name}`).join(', ') + '\n' +
        '💰 Total: ' + formatPrice(pendingOrderData.total) + '\n' +
        '💳 Vendor Cost: ' + formatPrice(pendingOrderData.vendor_cost) + '\n\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '💳 Payment Instructions for Customer:\n' +
        'Bank: Capitec\n' +
        'Account: 1234567890\n' +
        'Reference: ORD-' + String((window.orders?.length || 0) + 1).padStart(3, '0') + '\n\n' +
        '📱 Please confirm payment once received.\n' +
        '✅ Order will be confirmed upon payment verification.\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '📲 Admin: +27 78 868 2541';

    const encoded = encodeURIComponent(message);
    const adminPhone = '27788682541';
    window.open('https://wa.me/' + adminPhone + '?text=' + encoded, '_blank');

    // Create order in Supabase
    try {
        const order = await createOrder(pendingOrderData);
        showToast('💬 Payment request sent to Admin!', 'success');
        showToast('⏳ Admin will confirm payment.', 'info');

        // Load updated orders
        await loadOrders(currentUserId, currentUserRole);
        renderOrderHistory();

        // Auto-simulate payment confirmation after delay (demo)
        setTimeout(async () => {
            await updateOrderStatus(order.id, 'payment_confirmed');
            showToast('✅ Payment confirmed by Admin! Order is being prepared.', 'success');
            await loadOrders(currentUserId, currentUserRole);
            renderOrderHistory();
            renderVendorDashboard();
            renderDriverDashboard();
            renderAdminDashboard();
        }, 5000);

    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }

    pendingOrderData = null;
}

// ================================================================
//  RENDER ORDER HISTORY
//  ================================================================
function renderOrderHistory() {
    const container = document.getElementById('recentOrdersPreview');
    if (!container) return;

    const userOrders = window.orders?.filter(o => o.customer_id === currentUserId) || [];

    if (userOrders.length === 0) {
        container.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">No orders yet</div>';
        return;
    }

    const recent = userOrders.slice(0, 3);
    let html = '';

    for (const o of recent) {
        const statusMap = {
            'pending_payment': '⏳ Pending Payment',
            'payment_confirmed': '✅ Paid',
            'preparing': '⏱️ Preparing',
            'ready': '📦 Ready',
            'transit': '🚗 In Transit',
            'delivered': '✅ Delivered'
        };

        const statusLabel = statusMap[o.status] || o.status;
        const statusClass = o.status === 'delivered' ? 'delivered' :
            o.status === 'transit' ? 'transit' :
            o.status === 'preparing' || o.status === 'ready' ? 'preparing' : 'cancelled';

        const itemsText = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';
        const rname = window.restaurants?.find(r => r.id === o.restaurant_id)?.name || 'Restaurant';

        html += `
            <div class="order-history-item">
                <div class="oh-left">
                    <span class="oh-id">${o.order_id}</span>
                    <span class="oh-rest">${rname} · ${itemsText}</span>
                </div>
                <div class="oh-right">
                    <div class="oh-total">${formatPrice(o.total)}</div>
                    <span class="oh-status ${statusClass}">${statusLabel}</span>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    document.getElementById('viewAllOrders').onclick = function() {
        const allOrders = window.orders?.filter(o => o.customer_id === currentUserId) || [];
        if (allOrders.length === 0) {
            showToast('No orders yet', 'warning');
            return;
        }
        let msg = '📋 All Orders:\n\n';
        for (const o of allOrders) {
            const items = o.items?.map(i => `${i.qty}× ${i.name}`).join(', ') || 'No items';
            const rname = window.restaurants?.find(r => r.id === o.restaurant_id)?.name || 'Restaurant';
            msg += `${o.order_id} | ${rname} | ${items} | ${formatPrice(o.total)} | ${o.status}\n`;
        }
        showToast(msg, 'info');
    };
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.createOrder = createOrder;
window.updateOrderStatus = updateOrderStatus;
window.placeOrder = placeOrder;
window.processWhatsAppPayment = processWhatsAppPayment;
window.renderOrderHistory = renderOrderHistory;
window.pendingOrderData = pendingOrderData;