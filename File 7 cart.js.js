// ================================================================
//  🛒 CART MODULE
//  Handles cart operations
//  ================================================================

let cart = [];
let currentRestaurantId = null;

// ================================================================
//  CART HELPERS
//  ================================================================
function getDeliveryFee() {
    return window.systemSettings?.deliveryFee || 80;
}

function getVendorCost(subtotal) {
    const percent = window.systemSettings?.vendorCostPercent || 30;
    const base = window.systemSettings?.vendorCostBase || 15;
    return Math.round((subtotal * percent / 100) + base);
}

function calcCartTotal() {
    let subtotal = 0;
    for (const item of cart) {
        const mi = window.menuItems?.find(m => m.id === item.menuId);
        if (mi) subtotal += mi.price * item.qty;
    }
    const delivery = getDeliveryFee();
    const vendorCost = getVendorCost(subtotal);
    return { subtotal, delivery, vendorCost, total: subtotal + delivery + vendorCost };
}

function formatPrice(amount) {
    return 'R' + Math.round(amount);
}

// ================================================================
//  CART OPERATIONS
//  ================================================================
function toggleCartItem(menuId) {
    const idx = cart.findIndex(c => c.menuId === menuId);
    if (idx >= 0) {
        if (cart[idx].qty > 1) {
            cart[idx].qty--;
        } else {
            cart.splice(idx, 1);
        }
    } else {
        cart.push({ menuId, qty: 1 });
    }
    renderMenu();
    updateCartUI();
    updateOrderBadge();
}

function clearCart() {
    cart = [];
    renderMenu();
    updateCartUI();
    updateOrderBadge();
}

function updateOrderBadge() {
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const badge = document.getElementById('orderBadge');
    if (badge) {
        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count;
        } else {
            badge.style.display = 'none';
        }
    }
}

// ================================================================
//  RENDER CART UI
//  ================================================================
function updateCartUI() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const breakdownEl = document.getElementById('costBreakdown');
    const count = cart.reduce((s, c) => s + c.qty, 0);
    document.getElementById('cartCount').textContent = count + ' items';

    if (count === 0) {
        if (container) container.innerHTML =
            '<div class="text-muted fs-13" style="padding:8px 0;text-align:center;">Cart is empty</div>';
        if (totalEl) totalEl.style.display = 'none';
        if (breakdownEl) breakdownEl.style.display = 'none';
        document.getElementById('placeOrderBtn').disabled = true;
        return;
    }

    let html = '';
    for (const c of cart) {
        const item = window.menuItems?.find(m => m.id === c.menuId);
        if (!item) continue;
        html += `
            <div class="cart-item">
                <div class="ci-left">
                    <span class="ci-qty">${c.qty}×</span>
                    <span>${item.name}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span>${formatPrice(item.price * c.qty)}</span>
                    <button class="ci-remove" data-id="${item.id}">
                        <i class="fas fa-minus-circle"></i>
                    </button>
                </div>
            </div>
        `;
    }
    if (container) container.innerHTML = html;

    container.querySelectorAll('.ci-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const idx = cart.findIndex(c => c.menuId === id);
            if (idx >= 0) {
                if (cart[idx].qty > 1) cart[idx].qty--;
                else cart.splice(idx, 1);
                renderMenu();
                updateCartUI();
                updateOrderBadge();
            }
        });
    });

    const { subtotal, delivery, vendorCost, total } = calcCartTotal();

    if (totalEl) {
        totalEl.style.display = 'flex';
        document.getElementById('deliveryFeeDisplayCart').textContent = formatPrice(delivery);
        document.getElementById('cartTotalAmount').textContent = formatPrice(total);
    }

    if (breakdownEl) {
        breakdownEl.style.display = 'block';
        document.getElementById('breakdownSubtotal').textContent = formatPrice(subtotal);
        document.getElementById('breakdownDelivery').textContent = formatPrice(delivery);
        document.getElementById('breakdownVendorCost').textContent = formatPrice(vendorCost);
    }

    const minOrder = 50;
    const btn = document.getElementById('placeOrderBtn');
    if (btn) {
        if (subtotal < minOrder) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Min order ' + formatPrice(minOrder) +
                ' (' + formatPrice(subtotal) + ')';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-credit-card"></i> Pay ' + formatPrice(total);
        }
    }

    updateWhatsAppPreview();
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.cart = cart;
window.getDeliveryFee = getDeliveryFee;
window.getVendorCost = getVendorCost;
window.calcCartTotal = calcCartTotal;
window.formatPrice = formatPrice;
window.toggleCartItem = toggleCartItem;
window.clearCart = clearCart;
window.updateOrderBadge = updateOrderBadge;
window.updateCartUI = updateCartUI;