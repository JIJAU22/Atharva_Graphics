// admin.js
document.addEventListener('DOMContentLoaded', () => {
  const adminControlsContainer = document.getElementById('adminControlsContainer');
  
  // Add Product Modal
  const addProductModal = document.getElementById('addProductModal');
  const addProductBtn = document.getElementById('addProductBtn');
  const addProductModalClose = document.getElementById('addProductModalClose');
  const addProductForm = document.getElementById('addProductForm');

  // Edit Product Modal
  const editProductModal = document.getElementById('editProductModal');
  const editProductModalClose = document.getElementById('editProductModalClose');
  const editProductForm = document.getElementById('editProductForm');

  // Admin Banner Editor Modal
  const adminBannerModal = document.getElementById('adminBannerModal');
  const openAdminBannerBtn = document.getElementById('openAdminBannerBtn');
  const adminBannerModalClose = document.getElementById('adminBannerModalClose');
  const adminBannerForm = document.getElementById('adminBannerForm');
  const adminBannerText = document.getElementById('adminBannerText');

  // Admin Insights Modal
  const adminInsightsModal = document.getElementById('adminInsightsModal');
  const openAdminInsightsBtn = document.getElementById('openAdminInsightsBtn');
  const adminInsightsModalClose = document.getElementById('adminInsightsModalClose');
  const insightsTableBody = document.getElementById('insightsTableBody');

  // --- Admin Check via Clerk ---
  const checkAdminStatus = async () => {
    try {
      const token = window.getAuthToken ? window.getAuthToken() : null;
      if (!token) {
        if (adminControlsContainer) adminControlsContainer.style.display = 'none';
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok && data.isAdmin) {
        if (adminControlsContainer) adminControlsContainer.style.display = 'flex';
        // We set a global flag so script.js knows to render edit/delete buttons
        window.isAdminUser = true;
        if (window.renderProfileDropdown) window.renderProfileDropdown();
        if (window.loadProducts) window.loadProducts();
      } else {
        if (adminControlsContainer) adminControlsContainer.style.display = 'none';
        window.isAdminUser = false;
        if (window.renderProfileDropdown) window.renderProfileDropdown();
        if (window.loadProducts) window.loadProducts();
      }
    } catch (err) {
      console.error('Error checking admin status', err);
    }
  };

  // We export checkAdminStatus so it can be called directly by userAuth.js when auth state changes
  window.checkAdminStatus = checkAdminStatus;

  // Run immediately in case userAuth.js already set the token
  checkAdminStatus();

  // --- Add Product Modal Logic ---
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      addProductModal.style.display = 'flex';
    });
  }

  if (addProductModalClose) {
    addProductModalClose.addEventListener('click', () => {
      addProductModal.style.display = 'none';
    });
  }

  if (editProductModalClose) {
    editProductModalClose.addEventListener('click', () => {
      editProductModal.style.display = 'none';
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addProductModal) addProductModal.style.display = 'none';
    if (e.target === editProductModal) editProductModal.style.display = 'none';
    if (e.target === adminBannerModal) adminBannerModal.style.display = 'none';
    if (e.target === adminInsightsModal) adminInsightsModal.style.display = 'none';
  });

  // --- Banner Manager Logic ---
  if (openAdminBannerBtn) {
    openAdminBannerBtn.addEventListener('click', async () => {
      // Fetch current banner text before opening
      try {
        const res = await fetch('/api/settings/banner');
        if (res.ok) {
          const data = await res.json();
          adminBannerText.value = data.banner || '';
        }
      } catch (e) {
        console.error(e);
      }
      adminBannerModal.style.display = 'flex';
    });
  }

  if (adminBannerModalClose) {
    adminBannerModalClose.addEventListener('click', () => {
      adminBannerModal.style.display = 'none';
    });
  }

  if (adminBannerForm) {
    adminBannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = window.getAuthToken();
      if (!token) return;

      const text = adminBannerText.value.trim();
      try {
        const res = await fetch('/api/admin/settings/banner', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ banner_text: text })
        });
        if (res.ok) {
          if (window.showNotification) window.showNotification('Banner updated successfully!', 'success');
          adminBannerModal.style.display = 'none';
          if (window.loadPromoBanner) window.loadPromoBanner(); // Refresh it on screen
        } else {
          if (window.showNotification) window.showNotification('Failed to update banner.', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- Insights Logic ---
  if (openAdminInsightsBtn) {
    openAdminInsightsBtn.addEventListener('click', async () => {
      adminInsightsModal.style.display = 'flex';
      insightsTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Loading...</td></tr>';
      
      const token = window.getAuthToken();
      if (!token) return;

      try {
        const res = await fetch('/api/admin/insights/wishlists', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          insightsTableBody.innerHTML = '';
          if (data.insights.length === 0) {
            insightsTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No wishlist data yet.</td></tr>';
            return;
          }
          data.insights.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
              <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                <img src="${item.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <span>${item.title}</span>
              </td>
              <td style="padding: 10px; font-weight: bold; color: #e91e63;">
                ${item.wishlist_count} <i class="fas fa-heart"></i>
              </td>
            `;
            insightsTableBody.appendChild(tr);
          });
        }
      } catch (err) {
        console.error(err);
        insightsTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error loading insights.</td></tr>';
      }
    });
  }

  if (adminInsightsModalClose) {
    adminInsightsModalClose.addEventListener('click', () => {
      adminInsightsModal.style.display = 'none';
    });
  }

  // Handle Add Product Submission
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Save Product';
      if (submitBtn) {
          submitBtn.innerHTML = 'Saving... <i class="fas fa-spinner fa-spin"></i>';
          submitBtn.disabled = true;
      }

      const title = document.getElementById('prodTitle').value;
      const category = document.getElementById('prodCategory').value;
      const originalPrice = document.getElementById('prodOriginalPrice').value;
      const discountPrice = document.getElementById('prodDiscountPrice').value;
      const rating = document.getElementById('prodRating').value;
      const imageFile = document.getElementById('prodImage').files[0];

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('original_price', originalPrice);
      formData.append('discount_price', discountPrice);
      formData.append('rating', rating);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const token = window.getAuthToken();
      if (!token) {
        if(window.showNotification) window.showNotification('Please login as Admin first.', 'error');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        return;
      }

      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if(window.showNotification) window.showNotification('Product added successfully!', 'success');
          addProductForm.reset();
          addProductModal.style.display = 'none';
          if (window.loadProducts) window.loadProducts();
        } else {
          if(window.showNotification) window.showNotification('Failed to add product: ' + (data.error || data.message), 'error');
        }
      } catch (err) {
        console.error(err);
        if(window.showNotification) window.showNotification('Error adding product.', 'error');
      } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
      }
    });
  }

  // Handle Edit Product Submission
  if (editProductForm) {
    editProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = editProductForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Update Product';
      if (submitBtn) {
          submitBtn.innerHTML = 'Updating... <i class="fas fa-spinner fa-spin"></i>';
          submitBtn.disabled = true;
      }

      const id = document.getElementById('editProdId').value;
      const title = document.getElementById('editProdTitle').value;
      const category = document.getElementById('editProdCategory').value;
      const originalPrice = document.getElementById('editProdOriginalPrice').value;
      const discountPrice = document.getElementById('editProdDiscountPrice').value;
      const rating = document.getElementById('editProdRating').value;
      const imageFile = document.getElementById('editProdImage').files[0];

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('original_price', originalPrice);
      formData.append('discount_price', discountPrice);
      formData.append('rating', rating);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const token = window.getAuthToken();
      if (!token) {
        if(window.showNotification) window.showNotification('Please login as Admin first.', 'error');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        return;
      }

      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if(window.showNotification) window.showNotification('Product updated successfully!', 'success');
          editProductForm.reset();
          editProductModal.style.display = 'none';
          if (window.loadProducts) window.loadProducts();
        } else {
          if(window.showNotification) window.showNotification('Failed to update product: ' + (data.error || data.message), 'error');
        }
      } catch (err) {
        console.error(err);
        if(window.showNotification) window.showNotification('Error updating product.', 'error');
      } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
      }
    });
  }
});
