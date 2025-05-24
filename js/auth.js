document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const errorMessageElem = document.getElementById('error-message');
    const signupErrorMessageElem = document.getElementById('signup-error-message');

    // Check if supabase client is loaded
    if (!window.supabase) {
        console.error('Supabase client not loaded. Make sure supabaseClient.js is included before auth.js and configured correctly.');
        if (errorMessageElem) errorMessageElem.textContent = 'Error: Supabase client not loaded.';
        if (signupErrorMessageElem) signupErrorMessageElem.textContent = 'Error: Supabase client not loaded.';
        return;
    }

    // Redirect if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
        if (session && window.location.pathname.endsWith('index.html')) {
            window.location.href = 'dashboard.html';
        } else if (!session && window.location.pathname.endsWith('dashboard.html')) {
            window.location.href = 'index.html';
        }
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // Successful login is handled by onAuthStateChange
                window.location.href = 'dashboard.html'; /// ADDED THIS TO IMMEDIATELY LOG IN AFTER LOGGING IN
            } catch (error) {
                console.error('Login error:', error.message);
                errorMessageElem.textContent = `Login failed: ${error.message}`;
            }
        });
    }
    

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            signupErrorMessageElem.textContent = ''; // Clear previous errors

            try {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                // User might need to confirm email depending on your Supabase settings
                alert('Signup successful! Please check your email for a confirmation link if required, then log in.');
                // Switch to login form
                signupForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (errorMessageElem) errorMessageElem.textContent = '';

            } catch (error) {
                console.error('Signup error:', error.message);
                signupErrorMessageElem.textContent = `Signup failed: ${error.message}`;
            }
        });
    }

    if (showSignupLink && signupForm && loginForm) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            if (errorMessageElem) errorMessageElem.textContent = '';
        });
    }

    if (showLoginLink && signupForm && loginForm) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            if (signupErrorMessageElem) signupErrorMessageElem.textContent = '';
        });
    }
});
