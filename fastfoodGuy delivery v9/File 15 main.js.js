// ================================================================
//  🚀 MAIN ENTRY POINT
//  ================================================================

// ================================================================
//  BIND EVENT LISTENERS
//  ================================================================
function bindEvents() {
    // Location
    document.getElementById('locBtn').addEventListener('click', getLocation);
    document.getElementById('refreshRestaurants').addEventListener('click', function() {
        if (userLocation) {
            renderRestaurants();
            showToast('🔄 Restaurants refreshed', 'success');
        } else {
            getLocation();
        }
    });

    // Clear restaurant
    document.getElementById('clearRestaurantBtn').addEventListener('click', function() {
        currentRestaurantId = null;
        document.getElementById('selectedRestaurantCard').style.display = 'none';
        renderMenu();
        showToast('Restaurant cleared', 'info');
    });

    // Place order
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    // Payment modal
    document.getElementById('paymentCancel').addEventListener('click', function() {
        document.getElementById('paymentModal').classList.remove('active');
        pendingOrderData = null;
        showToast('Payment cancelled', 'warning');
    });
    document.getElementById('paymentWhatsApp').addEventListener('click', processWhatsAppPayment);

    // Regular modal
    document.getElementById('modalCancel').addEventListener('click', function() {
        document.getElementById('modalOverlay').classList.remove('active');
    });
    document.getElementById('modalConfirm').addEventListener('click', function() {
        document.getElementById('modalOverlay').classList.remove('active');
        showToast('Confirmed!', 'success');
    });
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });

    // WhatsApp
    document.getElementById('sendWhatsAppBtn').addEventListener('click', function() {
        if (cart.length === 0) {
            showToast('Cart is empty', 'error');
            return;
        }
        sendWhatsAppPaymentRequest();
    });

    document.getElementById('editWhatsAppBtn').addEventListener('click', function() {
        const current = document.getElementById('waOrderItems').textContent;
        const newText = prompt('Edit order items:', current);
        if (newText !== null && newText.trim()) {
            document.getElementById('waOrderItems').textContent = newText.trim();
            showToast('WhatsApp message updated', 'success');
        }
    });

    // Vendor add menu item
    document.getElementById('vendorAddMenuItemBtn').addEventListener('click', function() {
        if (currentUserRole !== 'vendor') {
            showToast('Only vendors can add items', 'error');
            return;
        }

        const name = prompt('Item name:');
        if (!name || !name.trim()) return;

        const price = prompt('Price (R):');
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            showToast('Invalid price', 'error');
            return;
        }

        const desc = prompt('Description (optional):') || '';
        const cat = prompt('Category:') || 'General';

        addMenuItem(name.trim(), parseFloat(price), desc, cat.trim());
    });

    // Admin save settings
    document.getElementById('adminSaveSettingsBtn').addEventListener('click', saveAdminSettings);

    // Chat
    document.getElementById('chatSendBtn').addEventListener('click', function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        addChatMessage('you', text);
        input.value = '';

        setTimeout(() => {
            const replies = [
                '👍 Got it!',
                '🛵 On my way!',
                '📱 Will call when I arrive',
                '✅ Order confirmed',
                '⏱️ Running a bit late!',
                '📍 Almost there!'
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            addChatMessage('driver', reply);
        }, 2000);
    });

    document.getElementById('chatInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('chatSendBtn').click();
    });

    // Notifications
    document.getElementById('notifBtn').addEventListener('click', function() {
        const pending = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        if (pending.length === 0) {
            showToast('No new notifications', 'info');
        } else {
            showToast(pending.length + ' order(s) in progress', 'warning');
        }
        document.getElementById('notifDot').style.display = 'none';
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', signOut);

    // Bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            if (tabId) switchTab(tabId);
        });
    });

    // Auth events
    document.querySelectorAll('#authOverlay .auth-tabs button').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const target = this.dataset.tab;
            document.getElementById('authLoginForm').classList.toggle('active', target === 'login');
            document.getElementById('authRegisterForm').classList.toggle('active', target === 'register');

            document.getElementById('authFooterText').textContent = target === 'login' ?
                "Don't have an account?" : 'Already have an account?';

            document.getElementById('authFooterToggle').textContent = target === 'login' ?
                'Sign Up' : 'Sign In';
        });
    });

    document.getElementById('authFooterToggle').addEventListener('click', function() {
        const tabs = document.querySelectorAll('#authOverlay .auth-tabs button');
        const active = document.querySelector('#authOverlay .auth-tabs button.active');
        const next = active.dataset.tab === 'login' ? 'register' : 'login';
        tabs.forEach(t => { if (t.dataset.tab === next) t.click(); });
    });

    document.querySelectorAll('#authRoleSelector .role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const role = this.dataset.role;
            document.getElementById('authVendorFields').classList.toggle('hidden', role !== 'vendor');
            document.getElementById('authDriverFields').classList.toggle('hidden', role !== 'driver');
        });
    });

    // Auth forms
    document.getElementById('authLoginFormElement').addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('authLoginEmail').value.trim();
        const password = document.getElementById('authLoginPassword').value;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const result = await signIn(email, password);

        if (result.success) {
            await loadAllData();
            updateUIAfterLogin();
        }
    });

    document.getElementById('authRegisterFormElement').addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('authRegisterName').value.trim();
        const email = document.getElementById('authRegisterEmail').value.trim();
        const password = document.getElementById('authRegisterPassword').value;

        if (!name || !email || !password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        const roleEl = document.querySelector('#authRoleSelector .role-btn.active');
        const role = roleEl ? roleEl.dataset.role : 'customer';

        let userData = {
            name,
            phone: document.getElementById('authRegisterPhone').value.trim() || '',
            address: document.getElementById('authRegisterAddress').value.trim() || ''
        };

        if (role === 'vendor') {
            userData.business_name = document.getElementById('authVendorBusiness').value.trim() || 'Business';
            userData.address = document.getElementById('authVendorAddress').value.trim() || '';
        }

        if (role === 'driver') {
            userData.vehicle = document.getElementById('authDriverVehicle').value.trim() || 'Car';
        }

        const result = await signUp(email, password, userData, role);

        if (result.success) {
            await loadAllData();
            updateUIAfterLogin();
        }
    });
}

// ================================================================
//  CHAT HELPER
//  ================================================================
function addChatMessage(sender, text) {
    const box = document.getElementById('chatBox');
    if (!box) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderClass = sender === 'you' ? 'you' : sender === 'driver' ? 'driver' : '';
    const isSystem = sender === 'system';

    const div = document.createElement('div');
    div.className = 'msg' + (isSystem ? ' delivered' : '');

    if (isSystem) {
        div.innerHTML = '<i class="fas fa-check-circle"></i> ' + text;
    } else {
        const label = sender === 'you' ? 'You' : sender === 'driver' ? 'Driver' : '';
        div.innerHTML = `<span class="sender ${senderClass}">${label}:</span> ${text} <span class="time">${time}</span>`;
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;

    // Store in localStorage for persistence
    try {
        const stored = JSON.parse(localStorage.getItem('ffd_chat') || '[]');
        stored.push({ sender, text, time });
        localStorage.setItem('ffd_chat', JSON.stringify(stored));
    } catch (e) { /* ignore */ }
}

// ================================================================
//  RENDER RESTAURANTS
//  ================================================================
function renderRestaurants() {
    const list = document.getElementById('restaurantList');
    if (!list) return;

    const lat = userLocation ? userLocation.lat : appData.location.lat;
    const lng = userLocation ? userLocation.lng : appData.location.lng;

    if (!lat || !lng) {
        list.innerHTML =
            '<div class="text-muted fs-13" style="padding:12px 0;text-align:center;">Enable location to see nearby restaurants</div>';
        return;
    }

    const withDist = restaurants.map(r => {
        const d = haversineDistance(lat, lng, r.lat, r.lng);
        return { ...r, distance: d };
    }).sort((a, b) => a.distance - b.distance);

    if (withDist.length === 0) {
        list.innerHTML =
            '<div class="text-muted fs-13" style="padding:12px 0;text-align:center;">No restaurants found</div>';
        return;
    }

    let html = '';
    for (const r of withDist) {
        const distText = r.distance < 1 ? Math.round(r.distance * 1000) + 'm' : r.distance.toFixed(1) + 'km';
        const fee = getDeliveryFee();

        html += `
            <div class="restaurant-item" data-id="${r.id}">
                <div class="r-icon">${r.image || '🍔'}</div>
                <div class="r-info">
                    <div class="r-name">${r.name}</div>
                    <div class="r-meta">
                        <span>⭐ ${r.rating}</span><span>·</span>
                        <span>${r.cuisine}</span><span>·</span>
                        <span class="r-distance"><i class="fas fa-location-dot"></i> ${distText}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div class="r-fee">${formatPrice(fee)} delivery</div>
                    <div style="font-size:11px;color:var(--text-muted);">min ${formatPrice(r.min_order || 50)}</div>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;

    list.querySelectorAll('.restaurant-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            selectRestaurant(id);
        });
    });
}

// ================================================================
//  SELECT RESTAURANT
//  ================================================================
function selectRestaurant(id) {
    const restaurant = restaurants.find(r => r.id === id);
    if (!restaurant) return;

    currentRestaurantId = id;

    const card = document.getElementById('selectedRestaurantCard');
    if (card) {
        card.style.display = 'block';
        document.getElementById('selectedRestName').textContent = restaurant.name;
        document.getElementById('selectedRestAddr').textContent = restaurant.address;
    }

    renderMenu();
    switchTab('tab-menu');
    showToast('🍽️ ' + restaurant.name + ' selected', 'success');
}

// ================================================================
//  RENDER MENU
//  ================================================================
function renderMenu() {
    const list = document.getElementById('menuItemsList');
    if (!list) return;

    const restaurant = restaurants.find(r => r.id === currentRestaurantId);
    const available = menuItems.filter(item => item.available);

    if (!restaurant) {
        list.innerHTML =
            '<div class="text-muted fs-13" style="padding:12px 0;text-align:center;">Select a restaurant to view menu</div>';
        document.getElementById('menuCount').textContent = '0 items';
        return;
    }

    document.getElementById('menuCount').textContent = available.length + ' items';

    if (available.length === 0) {
        list.innerHTML =
            '<div class="text-muted fs-13" style="padding:12px 0;text-align:center;">No items available</div>';
        return;
    }

    let html = '';
    for (const item of available) {
        const inCart = cart.find(c => c.menuId === item.id);
        const qty = inCart ? inCart.qty : 0;

        html += `
            <div class="menu-item-row" data-id="${item.id}">
                <div class="mi-left">
                    <div class="mi-name">${item.name}${item.popular ? ' 🔥' : ''}</div>
                    <div class="mi-desc">${item.description || ''}</div>
                </div>
                <div class="mi-right">
                    <span class="mi-price">${formatPrice(item.price)}</span>
                    <button class="mi-add ${qty > 0 ? 'added' : ''}" data-id="${item.id}">
                        ${qty > 0 ? qty : '+'}
                    </button>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;

    list.querySelectorAll('.mi-add').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            toggleCartItem(id);
        });
    });

    updateCartUI();
}

// ================================================================
//  START THE APP
//  ================================================================

// Initialize when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}

// ================================================================
//  EXPOSE FUNCTIONS FOR OTHER MODULES
//  ================================================================
window.renderRestaurants = renderRestaurants;
window.selectRestaurant = selectRestaurant;
window.renderMenu = renderMenu;
window.addChatMessage = addChatMessage;