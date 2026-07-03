// admin.js

const subCategoriesMap = {
  flex: ['All', 'Regular Flex', 'Star Flex', 'Backlit Flex', 'Frontlit Flex'],
  paper: ['All', 'Business Cards', 'Letterheads', 'Flyers'],
  vinyl: ['All', 'Glossy Vinyl', 'Matte Vinyl', 'Transparent Vinyl'],
  sublimation: ['All', 'Mugs', 'Polyester Apparel', 'Keychains', 'Photo Frames', 'Cushions', 'Sipper Bottles'],
  dtf: ['All', 'Cotton T-Shirts', 'Caps', 'Tote Bags'],
  laser_printer: ['All', 'Keychain', 'Bottle', 'Bracelet', 'Writing Pen', 'Wallet', 'Mobile Stand', 'Diary Book'],
  all: ['All']
};

document.addEventListener('DOMContentLoaded', () => {
  const adminControlsContainer = document.getElementById('adminControlsContainer');
  
  // Add Product Modal
  const addProductModal = document.getElementById('addProductModal');
  const addProductBtn = document.getElementById('addProductBtn');
  const addProductModalClose = document.getElementById('addProductModalClose');
  const addProductForm = document.getElementById('addProductForm');

  // Add Gallery Photo Modal
  const addGalleryPhotoModal = document.getElementById('addGalleryPhotoModal');
  const addGalleryPhotoBtn = document.getElementById('addGalleryPhotoBtn');
  const addGalleryPhotoModalClose = document.getElementById('addGalleryPhotoModalClose');
  const addGalleryPhotoForm = document.getElementById('addGalleryPhotoForm');

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

  // Admin Orders Modal
  const adminOrdersModal = document.getElementById('adminOrdersModal');
  const openAdminOrdersBtn = document.getElementById('openAdminOrdersBtn');
  const adminOrdersModalClose = document.getElementById('adminOrdersModalClose');
  const ordersTableBody = document.getElementById('ordersTableBody');

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
        if (window.loadGallery) window.loadGallery();
      } else {
        if (adminControlsContainer) adminControlsContainer.style.display = 'none';
        window.isAdminUser = false;
        if (window.renderProfileDropdown) window.renderProfileDropdown();
        if (window.loadProducts) window.loadProducts();
        if (window.loadGallery) window.loadGallery();
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
  const prodCategory = document.getElementById('prodCategory');
  const prodSubCategory = document.getElementById('prodSubCategory');
  const editProdCategory = document.getElementById('editProdCategory');
  const editProdSubCategory = document.getElementById('editProdSubCategory');

  function populateSubCategories(categorySelect, subCategorySelect) {
    if (!categorySelect || !subCategorySelect) return;
    const category = categorySelect.value;
    const subs = subCategoriesMap[category] || ['All'];
    subCategorySelect.innerHTML = subs.map(sub => `<option value="${sub}">${sub}</option>`).join('');
  }

  if (prodCategory && prodSubCategory) {
    prodCategory.addEventListener('change', () => populateSubCategories(prodCategory, prodSubCategory));
    // Initial population
    populateSubCategories(prodCategory, prodSubCategory);
  }
  if (editProdCategory && editProdSubCategory) {
    editProdCategory.addEventListener('change', () => populateSubCategories(editProdCategory, editProdSubCategory));
  }

  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      addProductModal.style.display = 'flex';
      if (prodCategory && prodSubCategory) populateSubCategories(prodCategory, prodSubCategory);
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
    if (e.target === addGalleryPhotoModal) addGalleryPhotoModal.style.display = 'none';
  });

  // --- Add Gallery Photo Modal Logic ---
  if (addGalleryPhotoBtn) {
    addGalleryPhotoBtn.addEventListener('click', () => {
      addGalleryPhotoModal.style.display = 'flex';
    });
  }

  if (addGalleryPhotoModalClose) {
    addGalleryPhotoModalClose.addEventListener('click', () => {
      addGalleryPhotoModal.style.display = 'none';
    });
  }

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

  // --- Admin Orders Logic ---
  if (openAdminOrdersBtn) {
    openAdminOrdersBtn.addEventListener('click', async () => {
      adminOrdersModal.style.display = 'flex';
      ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading orders...</td></tr>';
      
      const token = window.getAuthToken();
      if (!token) return;

      try {
        const res = await fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          ordersTableBody.innerHTML = '';
          if (data.orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>';
            return;
          }
          data.orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
              <td style="padding: 10px;">#${order.id}</td>
              <td style="padding: 10px;">
                <strong>${order.customer_name}</strong><br>
                <a href="https://wa.me/${order.customer_phone}" target="_blank">${order.customer_phone}</a>
              </td>
              <td style="padding: 10px;">
                ${order.product_title ? order.product_title : (order.design_type || 'Custom Design')}
                ${order.size ? '<br>Size: ' + order.size : ''}
              </td>
              <td style="padding: 10px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order.requirements || ''}">
                Qty: ${order.quantity}<br>
                Reqs: ${order.requirements || 'None'}
              </td>
              <td style="padding: 10px;">
                ${order.reference_image_url ? `<a href="${order.reference_image_url}" target="_blank" style="color:blue;text-decoration:underline;">View Image</a>` : 'No Image'}
              </td>
              <td style="padding: 10px;">
                <span style="padding: 3px 6px; border-radius: 4px; font-size: 0.8rem; background: ${order.status === 'pending' ? '#fff3cd' : (order.status === 'completed' ? '#d4edda' : '#f8d7da')}; color: ${order.status === 'pending' ? '#856404' : (order.status === 'completed' ? '#155724' : '#721c24')};">
                  ${order.status}
                </span>
              </td>
              <td style="padding: 10px;">
                <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding: 4px;">
                  <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
            `;
            ordersTableBody.appendChild(tr);
          });
        } else {
          ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Failed to load orders. Make sure the server is restarted!</td></tr>';
        }
      } catch (err) {
        console.error(err);
        ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading orders.</td></tr>';
      }
    });
  }

  if (adminOrdersModalClose) {
    adminOrdersModalClose.addEventListener('click', () => {
      adminOrdersModal.style.display = 'none';
    });
  }

  window.updateOrderStatus = async function(orderId, status) {
    const token = window.getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if(window.showNotification) window.showNotification('Order status updated', 'success');
        // Refresh orders
        if (openAdminOrdersBtn) openAdminOrdersBtn.click();
      } else {
        if(window.showNotification) window.showNotification('Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      if(window.showNotification) window.showNotification('Error updating status', 'error');
    }
  };

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
      const subCategory = document.getElementById('prodSubCategory').value;
      const originalPrice = document.getElementById('prodOriginalPrice').value;
      const discountPrice = document.getElementById('prodDiscountPrice').value;
      const rating = document.getElementById('prodRating').value;
      const imageFile = document.getElementById('prodImage').files[0];

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('sub_category', subCategory);
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
      const subCategory = document.getElementById('editProdSubCategory').value;
      const originalPrice = document.getElementById('editProdOriginalPrice').value;
      const discountPrice = document.getElementById('editProdDiscountPrice').value;
      const rating = document.getElementById('editProdRating').value;
      const imageFile = document.getElementById('editProdImage').files[0];

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('sub_category', subCategory);
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

  // Handle Add Gallery Photo Submission
  if (addGalleryPhotoForm) {
    addGalleryPhotoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = addGalleryPhotoForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Upload Photo';
      if (submitBtn) {
          submitBtn.innerHTML = 'Uploading... <i class="fas fa-spinner fa-spin"></i>';
          submitBtn.disabled = true;
      }

      const title = document.getElementById('galTitle').value;
      const imageFile = document.getElementById('galImage').files[0];

      const formData = new FormData();
      formData.append('title', title);
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
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if(window.showNotification) window.showNotification('Photo added to gallery successfully!', 'success');
          addGalleryPhotoForm.reset();
          addGalleryPhotoModal.style.display = 'none';
          if (window.loadGallery) window.loadGallery();
        } else {
          if(window.showNotification) window.showNotification('Failed to add photo: ' + (data.error || data.message), 'error');
        }
      } catch (err) {
        console.error(err);
        if(window.showNotification) window.showNotification('Error adding photo.', 'error');
      } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
      }
    });
  }
});
