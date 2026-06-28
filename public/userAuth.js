// userAuth.js
console.log('[userAuth.js] Custom Auth Script loaded');

window.getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

window.currentUser = null;

window.addEventListener('load', async () => {
  const authContainer = document.getElementById('clerk-auth-container');
  const wishlistBtn = document.getElementById('wishlistBtn');
  
  // Modal elements
  const authModal = document.getElementById('authModal');
  const authModalClose = document.getElementById('authModalClose');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const registerFields = document.getElementById('registerFields');
  const authForm = document.getElementById('authForm');
  const authName = document.getElementById('authName');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authErrorMsg = document.getElementById('authErrorMsg');
  
  let isLoginMode = true;

  // Initialize session
  const token = window.getAuthToken();
  if (token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        window.currentUser = data.user;
        window.isAdminUser = data.isAdmin;
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }

  const updateUI = () => {
    if (window.currentUser) {
      if(wishlistBtn) wishlistBtn.style.display = 'inline-block';
      if(authContainer) {
        window.renderProfileDropdown();
      }
      if (window.loadProducts) window.loadProducts();
      if (window.checkAdminStatus) window.checkAdminStatus();
    } else {
      if(wishlistBtn) wishlistBtn.style.display = 'none';
      if(authContainer) {
        authContainer.innerHTML = '';
        const signInBtn = document.createElement('button');
        signInBtn.textContent = 'Login / Register';
        signInBtn.className = 'nav-cta';
        signInBtn.style = 'background: #fff; color: #1a2a6c; border:none; cursor: pointer; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight:600;';
        signInBtn.onclick = () => {
          authModal.style.display = 'flex';
        };
        authContainer.appendChild(signInBtn);
      }
      if (window.loadProducts) window.loadProducts();
      if (window.checkAdminStatus) window.checkAdminStatus();
    }
  };

  // Profile Dropdown
  window.renderProfileDropdown = () => {
    if (!authContainer || !window.currentUser) return;
    
    authContainer.innerHTML = '';
    const profileContainer = document.createElement('div');
    profileContainer.className = 'profile-menu-container';
    
    const avatarBtn = document.createElement('button');
    avatarBtn.className = 'profile-avatar-btn';
    // Use a default avatar generated from initials or simple icon
    const initials = window.currentUser.name ? window.currentUser.name.charAt(0).toUpperCase() : 'U';
    avatarBtn.innerHTML = `<div style="width: 35px; height: 35px; border-radius: 50%; background: #ff4757; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${initials}</div>`;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    let adminItems = '';
    if (window.isAdminUser) {
      adminItems = `
        <div class="dropdown-divider"></div>
        <div class="dropdown-section-title">Admin</div>
        <a href="#products" class="dropdown-item"><i class="fas fa-chart-line"></i> Admin Dashboard</a>
      `;
    }
    
    dropdown.innerHTML = `
      <div class="dropdown-header">
        <strong>${window.currentUser.name}</strong>
        <span>${window.currentUser.email}</span>
      </div>
      <div class="dropdown-divider"></div>
      <a href="wishlist.html" class="dropdown-item"><i class="fas fa-heart text-danger"></i> My Wishlist</a>
      ${adminItems}
      <div class="dropdown-divider"></div>
      <a href="#" id="profileLogout" class="dropdown-item text-danger"><i class="fas fa-sign-out-alt"></i> Logout</a>
    `;
    
    profileContainer.appendChild(avatarBtn);
    profileContainer.appendChild(dropdown);
    authContainer.appendChild(profileContainer);
    
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!profileContainer.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    document.getElementById('profileLogout').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('auth_token');
      window.currentUser = null;
      window.isAdminUser = false;
      updateUI();
    });

    if (window.loadProducts) {
      window.loadProducts();
    }
  };

  // Modal logic
  if (authModalClose) {
    authModalClose.onclick = () => {
      authModal.style.display = 'none';
      authErrorMsg.style.display = 'none';
    };
  }

  if (tabLogin) {
    tabLogin.onclick = () => {
      isLoginMode = true;
      tabLogin.classList.add('active');
      tabLogin.style.borderBottom = '2px solid #ff4757';
      tabLogin.style.color = '#1a2a6c';
      tabRegister.classList.remove('active');
      tabRegister.style.borderBottom = '2px solid #ddd';
      tabRegister.style.color = '#555';
      
      registerFields.style.display = 'none';
      authName.removeAttribute('required');
      authSubmitBtn.textContent = 'Login';
      authErrorMsg.style.display = 'none';
    };
  }

  if (tabRegister) {
    tabRegister.onclick = () => {
      isLoginMode = false;
      tabRegister.classList.add('active');
      tabRegister.style.borderBottom = '2px solid #ff4757';
      tabRegister.style.color = '#1a2a6c';
      tabLogin.classList.remove('active');
      tabLogin.style.borderBottom = '2px solid #ddd';
      tabLogin.style.color = '#555';
      
      registerFields.style.display = 'block';
      authName.setAttribute('required', 'true');
      authSubmitBtn.textContent = 'Register';
      authErrorMsg.style.display = 'none';
    };
  }

  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      authErrorMsg.style.display = 'none';
      
      const payload = {
        email: authEmail.value,
        password: authPassword.value
      };
      
      if (!isLoginMode) {
        payload.name = authName.value;
      }
      
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('auth_token', data.token);
          window.currentUser = data.user;
          window.isAdminUser = data.user.role === 'admin';
          authModal.style.display = 'none';
          authForm.reset();
          updateUI();
        } else {
          authErrorMsg.textContent = data.error || 'Authentication failed';
          authErrorMsg.style.display = 'block';
        }
      } catch (err) {
        authErrorMsg.textContent = 'Network error. Please try again later.';
        authErrorMsg.style.display = 'block';
      }
    };
  }

  updateUI();

});
