// ================================================================
//  📦 DATA MODULE
//  Handles all data operations with Supabase
//  ================================================================

// ================================================================
//  RESTAURANTS
//  ================================================================
async function loadRestaurants() {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Load restaurants error:', error);
        showToast('❌ Failed to load restaurants', 'error');
        return [];
    }
}

// ================================================================
//  MENU ITEMS
//  ================================================================
async function loadMenuItems() {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('available', true)
            .order('category');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Load menu error:', error);
        showToast('❌ Failed to load menu', 'error');
        return [];
    }
}

// ================================================================
//  ORDERS
//  ================================================================
async function loadOrders(userId, role) {
    try {
        let query = supabase
            .from('orders')
            .select(`
                *,
                restaurant:restaurant_id(name, address),
                items:order_items(*)
            `)
            .order('created_at', { ascending: false });

        if (role === 'customer') {
            query = query.eq('customer_id', userId);
        } else if (role === 'vendor') {
            const { data: vendorRestaurants } = await supabase
                .from('restaurants')
                .select('id')
                .eq('vendor_id', userId);
            const ids = vendorRestaurants.map(r => r.id);
            if (ids.length > 0) {
                query = query.in('restaurant_id', ids);
            } else {
                return [];
            }
        } else if (role === 'driver') {
            query = query.eq('driver_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Load orders error:', error);
        showToast('❌ Failed to load orders', 'error');
        return [];
    }
}

// ================================================================
//  VENDOR PROFILE
//  ================================================================
async function loadVendorProfile(vendorId) {
    try {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Load vendor profile error:', error);
        return null;
    }
}

// ================================================================
//  DRIVER PROFILE
//  ================================================================
async function loadDriverProfile(driverId) {
    try {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Load driver profile error:', error);
        return null;
    }
}

// ================================================================
//  SYSTEM SETTINGS
//  ================================================================
async function loadSystemSettings() {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Load system settings error:', error);
        return { delivery_fee: 80, vendor_cost_percent: 30, vendor_cost_base: 15 };
    }
}

// ================================================================
//  UPDATE SYSTEM SETTINGS
//  ================================================================
async function updateSystemSettings(settings) {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .update({
                delivery_fee: settings.deliveryFee,
                vendor_cost_percent: settings.vendorCostPercent,
                vendor_cost_base: settings.vendorCostBase,
                updated_at: new Date()
            })
            .eq('id', 1)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Update system settings error:', error);
        showToast('❌ Failed to update settings', 'error');
        throw error;
    }
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.loadRestaurants = loadRestaurants;
window.loadMenuItems = loadMenuItems;
window.loadOrders = loadOrders;
window.loadVendorProfile = loadVendorProfile;
window.loadDriverProfile = loadDriverProfile;
window.loadSystemSettings = loadSystemSettings;
window.updateSystemSettings = updateSystemSettings;