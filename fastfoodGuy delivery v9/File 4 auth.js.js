// ================================================================
//  🔐 AUTHENTICATION MODULE
//  Handles all user authentication operations
//  ================================================================

// ================================================================
//  SIGN UP
//  ================================================================
async function signUp(email, password, userData, role) {
    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role,
                    name: userData.name || userData.business_name || 'User'
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // Insert profile into the appropriate table
        const tableName = role === 'vendor' ? 'vendors' :
                         role === 'driver' ? 'drivers' : 'clients';
        const insertData = {
            id: authData.user.id,
            ...userData
        };

        const { error: dbError } = await supabase.from(tableName).insert([insertData]);
        if (dbError) throw dbError;

        console.log('✅ User signed up:', authData.user.email);
        showToast('✅ Account created! Welcome!', 'success');
        return { success: true, user: authData.user };
    } catch (error) {
        console.error('❌ Sign up error:', error);
        showToast('❌ ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ================================================================
//  SIGN IN
//  ================================================================
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const role = data.user.user_metadata?.role || 'customer';
        const user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'User',
            role: role
        };

        // Store session
        localStorage.setItem('ffd_session', JSON.stringify(user));
        currentUser = user;
        currentUserRole = role;
        currentUserId = user.id;

        console.log('✅ User signed in:', data.user.email);
        showToast('✅ Welcome, ' + user.name + '!', 'success');
        hideAuthOverlay();
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Sign in error:', error);
        showToast('❌ ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ================================================================
//  SIGN OUT
//  ================================================================
async function signOut() {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('ffd_session');
        localStorage.removeItem('ffd_session_user');
        currentUser = null;
        currentUserRole = null;
        currentUserId = null;

        console.log('✅ User signed out');
        showToast('✅ Logged out', 'info');
        showAuthOverlay();
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out error:', error);
        showToast('❌ ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ================================================================
//  CHECK SESSION
//  ================================================================
async function checkSession() {
    try {
        // Check local session first
        const stored = localStorage.getItem('ffd_session');
        if (stored) {
            const user = JSON.parse(stored);
            currentUser = user;
            currentUserRole = user.role;
            currentUserId = user.id;
            return user;
        }

        // Fallback to Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) return null;

        const role = session.user.user_metadata?.role || 'customer';
        const user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'User',
            role: role
        };

        localStorage.setItem('ffd_session', JSON.stringify(user));
        currentUser = user;
        currentUserRole = role;
        currentUserId = user.id;

        return user;
    } catch (error) {
        console.error('❌ Session check error:', error);
        return null;
    }
}

// ================================================================
//  TOGGLE PASSWORD VISIBILITY
//  ================================================================
function toggleAuthPassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = input.parentElement.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ================================================================
//  AUTH OVERLAY CONTROLS
//  ================================================================
function showAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.checkSession = checkSession;
window.toggleAuthPassword = toggleAuthPassword;
window.showAuthOverlay = showAuthOverlay;
window.hideAuthOverlay = hideAuthOverlay;