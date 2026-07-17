// ================================================================
//  💬 WHATSAPP MODULE
//  Handles WhatsApp integration
//  ================================================================

// ================================================================
//  WHATSAPP HELPERS
//  ================================================================
const ADMIN_WHATSAPP = '27788682541'; // Admin number (without +)

function getWhatsAppUrl(message) {
    const encoded = encodeURIComponent(message);
    return 'https://wa.me/' + ADMIN_WHATSAPP + '?text=' + encoded;
}

function openWhatsApp(message) {
    const url = getWhatsAppUrl(message);
    window.open(url, '_blank');
}

// ================================================================
//  UPDATE WHATSAPP PREVIEW
//  ================================================================
function updateWhatsAppPreview() {
    const client = currentUser || { name: 'Customer', address: 'Address', phone: 'Phone' };

    document.getElementById('waClientName').textContent = client.name || 'Customer';
    document.getElementById('waClientAddress').textContent = client.address || 'Address';
    document.getElementById('waClientPhone').textContent = client.phone || 'Phone';

    if (cart.length === 0) {
        document.getElementById('waOrderItems').textContent = 'No items in cart';
        document.getElementById('waTotal').textContent = 'R0';
        document.getElementById('waOrderRef').textContent = 'ORD-000';
        document.getElementById('sendWhatsAppBtn').disabled = true;
        return;
    }

    const items = cart.map(c => {
        const item = window.menuItems?.find(m => m.id === c.menuId);
        return item ? `${c.qty}× ${item.name}` : '';
    }).filter(Boolean).join(', ');

    document.getElementById('waOrderItems').textContent = items || 'No items';

    const { total } = calcCartTotal();
    document.getElementById('waTotal').textContent = formatPrice(total);

    const orderId = 'ORD-' + String((window.orders?.length || 0) + 1).padStart(3, '0');
    document.getElementById('waOrderRef').textContent = orderId;

    document.getElementById('sendWhatsAppBtn').disabled = false;
}

// ================================================================
//  SEND WHATSAPP PAYMENT REQUEST
//  ================================================================
function sendWhatsAppPaymentRequest() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    const client = currentUser || { name: 'Customer', address: 'Address', phone: 'Phone' };
    const { subtotal, delivery, vendorCost, total } = calcCartTotal();
    const itemsText = cart.map(c => {
        const item = window.menuItems?.find(m => m.id === c.menuId);
        return item ? `${c.qty}× ${item.name}` : '';
    }).filter(Boolean).join(', ');
    const orderId = 'ORD-' + String((window.orders?.length || 0) + 1).padStart(3, '0');

    const message =
        '🍔 FastFood Guy — New Order Payment Request\n\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '👤 Customer: ' + (client.name || 'Unknown') + '\n' +
        '📍 Address: ' + (client.address || 'N/A') + '\n' +
        '📞 Phone: ' + (client.phone || 'N/A') + '\n\n' +
        '🛒 Order: ' + itemsText + '\n' +
        '💰 Total: ' + formatPrice(total) + '\n' +
        '💳 Vendor Cost: ' + formatPrice(vendorCost) + '\n\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '💳 Payment Instructions for Customer:\n' +
        'Bank: Capitec\n' +
        'Account: 1234567890\n' +
        'Reference: ' + orderId + '\n\n' +
        '📱 Please confirm payment once received.\n' +
        '✅ Order will be confirmed upon payment verification.\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '📲 Admin: +27 78 868 2541';

    openWhatsApp(message);
    showToast('💬 Payment request sent to Admin!', 'success');
}

// ================================================================
//  SEND WHATSAPP ORDER CONFIRMATION
//  ================================================================
function sendWhatsAppOrderConfirmation(order) {
    const client = currentUser || { name: 'Customer' };

    const message =
        '🍔 FastFood Guy — Order Confirmation\n\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '👤 Customer: ' + (client.name || 'Unknown') + '\n' +
        '🛒 Order: ' + order.order_id + '\n' +
        '💰 Total: ' + formatPrice(order.total) + '\n' +
        '📦 Status: ' + order.status + '\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '✅ Order confirmed and being prepared.\n' +
        '📲 Admin: +27 78 868 2541';

    openWhatsApp(message);
    showToast('💬 Order confirmation sent!', 'success');
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.ADMIN_WHATSAPP = ADMIN_WHATSAPP;
window.getWhatsAppUrl = getWhatsAppUrl;
window.openWhatsApp = openWhatsApp;
window.updateWhatsAppPreview = updateWhatsAppPreview;
window.sendWhatsAppPaymentRequest = sendWhatsAppPaymentRequest;
window.sendWhatsAppOrderConfirmation = sendWhatsAppOrderConfirmation;