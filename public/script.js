/* ============================================================
   ATHARV GRAPHICS — JAVASCRIPT
   Handles: Navigation, Animations, Lightbox, Form, Scroll
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ==================== ELEMENTS ====================
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navLinkItems = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');
    const contactForm = document.getElementById('contactForm');
    const campaignBar = document.getElementById('campaignBar');
    const closeCampaignBtn = document.getElementById('closeCampaign');
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryItems = document.querySelectorAll('.gallery-item');

    // ==================== CAMPAIGN BAR ====================
    if (campaignBar && closeCampaignBtn) {
        // Set initial campaign height variable
        document.documentElement.style.setProperty('--campaign-height', `${campaignBar.offsetHeight}px`);
        
        closeCampaignBtn.addEventListener('click', () => {
            campaignBar.classList.add('hidden');
            document.documentElement.style.setProperty('--campaign-height', '0px');
        });
        
        // Update on resize
        window.addEventListener('resize', () => {
            if (!campaignBar.classList.contains('hidden')) {
                document.documentElement.style.setProperty('--campaign-height', `${campaignBar.offsetHeight}px`);
            }
        });
    }

    // ==================== MOBILE NAVIGATION ====================

    // Create overlay element for mobile nav
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    function toggleMobileNav() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileNav() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', toggleMobileNav);
    navOverlay.addEventListener('click', closeMobileNav);

    // Close nav on link click
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileNav();
        });
    });

    // ==================== NAVBAR SCROLL EFFECT ====================
    let lastScroll = 0;

    function handleNavbarScroll() {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }

    // ==================== ACTIVE NAVIGATION LINK ====================
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNavLink() {
        const scrollPosition = window.pageYOffset + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinkItems.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ==================== BACK TO TOP BUTTON ====================
    function handleBackToTop() {
        if (!backToTop) return;
        if (window.pageYOffset > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== SCROLL EVENT HANDLER ====================
    // Throttle scroll events for performance
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleNavbarScroll();
                updateActiveNavLink();
                handleBackToTop();
                ticking = false;
            });
            ticking = true;
        }
    });

    // ==================== SCROLL ANIMATIONS ====================
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');

                // Assign stagger index as a CSS variable for smooth CSS-only staggers
                const children = entry.target.querySelectorAll('.service-card, .product-card, .gallery-item, .why-item, .contact-item, .catalog-card');
                children.forEach((child, index) => {
                    child.style.setProperty('--stagger-index', index);
                });

                animationObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('.services, .about, .gallery, .products, .contact, .special-offers, .why-choose').forEach(section => {
        animationObserver.observe(section);
    });

    // ==================== GALLERY LIGHTBOX & DYNAMIC LOADING ====================
    let currentImageIndex = 0;
    let galleryImages = [];

    async function deleteGalleryPhoto(imageId) {
        try {
            const token = window.getAuthToken();
            await fetch(`/api/admin/gallery/${imageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
        }
    }

    function showUndoToast(message, onUndo) {
        let toast = document.getElementById('undo-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'undo-toast';
            toast.className = 'undo-toast';
            document.body.appendChild(toast);
        }
        
        toast.innerHTML = `
            <span>${message}</span>
            <button id="undo-btn" class="undo-btn" style="background:none; border:none; color: #fbc02d; font-weight:bold; cursor:pointer; margin-left:15px; font-size:14px;">UNDO</button>
        `;
        toast.classList.add('show');
        
        const undoBtn = document.getElementById('undo-btn');
        let isUndone = false;
        
        undoBtn.addEventListener('click', () => {
            isUndone = true;
            toast.classList.remove('show');
            if (onUndo) onUndo();
        });
        
        setTimeout(() => {
            if (!isUndone) {
                toast.classList.remove('show');
            }
        }, 5000);
    }

    async function loadGallery() {
        try {
            const isGalleryPage = window.location.pathname.includes('gallery.html');
            const url = isGalleryPage ? '/api/gallery' : '/api/gallery?limit=6';
            const res = await fetch(url);
            const data = await res.json();
            const gallery = data.gallery || [];
            const galleryGrid = document.getElementById('galleryGrid');
            if (!galleryGrid) return;

            galleryGrid.innerHTML = '';
            galleryImages = [];

            const isAdmin = window.isAdminUser === true;

            gallery.forEach((item, index) => {
                galleryImages.push(item.image_url);

                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.style.setProperty('--stagger-index', index);
                div.innerHTML = `
                    <img src="${item.image_url}" alt="${item.title}" loading="lazy">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                        <span>${item.title}</span>
                    </div>
                    ${isAdmin ? `<button class="delete-gallery-btn" data-id="${item.id}" style="position: absolute; top: 10px; right: 10px; z-index: 20; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;"><i class="fas fa-trash"></i></button>` : ''}
                `;
                
                div.querySelector('.gallery-overlay').addEventListener('click', () => {
                    currentImageIndex = index;
                    openLightbox(item.image_url, item.title);
                });

                galleryGrid.appendChild(div);
            });

            if (isAdmin) {
                document.querySelectorAll('.delete-gallery-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const galleryItem = btn.closest('.gallery-item');
                        const imageId = btn.getAttribute('data-id');
                        
                        // Hide it temporarily
                        galleryItem.style.display = 'none';
                        
                        showUndoToast('Photo deleted.', () => {
                            clearTimeout(galleryItem.deleteTimer);
                            galleryItem.style.display = 'block';
                        });

                        galleryItem.deleteTimer = setTimeout(() => {
                            deleteGalleryPhoto(imageId);
                        }, 5000);
                    });
                });
            }

        } catch (err) {
            console.error('Failed to load gallery', err);
        }
    }
    window.loadGallery = loadGallery;
    loadGallery();

    function openLightbox(src, alt) {
        lightboxImage.src = src;
        lightboxImage.alt = alt || 'Gallery Image';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
        lightboxImage.src = galleryImages[currentImageIndex];
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Close lightbox on background click
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
        }
    });

    // ==================== CONTACT FORM ====================
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value.trim();
        const mobile = document.getElementById('userMobile').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const message = document.getElementById('userMessage').value.trim();

        // Basic validation
        if (!name || !mobile || !message) {
            if(window.showNotification) window.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        // Validate mobile number (Indian format roughly)
        const mobileRegex = /^[0-9]{10,12}$/;
        if (!mobileRegex.test(mobile.replace(/[\s-+]/g, ''))) {
            if(window.showNotification) window.showNotification('Please enter a valid mobile number.', 'error');
            return;
        }

        // Validate email if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if(window.showNotification) window.showNotification('Please enter a valid email address.', 'error');
            return;
        }

        // Build WhatsApp message
        let waMessage = `Hi, I'm ${name}.\n`;
        waMessage += `Mobile: ${mobile}\n`;
        if (email) waMessage += `Email: ${email}\n`;
        waMessage += `\nMessage: ${message}`;

        // Encode and open WhatsApp
        const encodedMessage = encodeURIComponent(waMessage);
        window.open(`https://wa.me/917058445094?text=${encodedMessage}`, '_blank');

        if(window.showNotification) window.showNotification('Message prepared! Please send it on WhatsApp.', 'success');
        contactForm.reset();
    });
    }

    // ==================== CUSTOM DESIGN MODAL ====================
    const customDesignModal = document.getElementById('customDesignModal');
    const openCustomDesignBtn = document.getElementById('openCustomDesignBtn');
    const customDesignModalClose = document.getElementById('customDesignModalClose');
    const customDesignForm = document.getElementById('customDesignForm');

    if (openCustomDesignBtn && customDesignModal) {
        openCustomDesignBtn.addEventListener('click', (e) => {
            e.preventDefault();
            customDesignModal.style.display = 'flex';
        });
    }

    if (customDesignModalClose) {
        customDesignModalClose.addEventListener('click', () => {
            customDesignModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == customDesignModal) {
            customDesignModal.style.display = 'none';
        }
    });

    if (customDesignForm) {
        customDesignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('customDesignSubmitBtn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Uploading... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const name = document.getElementById('customDesignName').value.trim();
                const details = document.getElementById('customDesignDetails').value.trim();
                const imageInput = document.getElementById('customDesignImage');
                let uploadedImageUrl = '';

                if (imageInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('image', imageInput.files[0]);
                    
                    const res = await fetch('/api/custom-design/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        uploadedImageUrl = data.url;
                    }
                }
                
                let waMessage = `*Custom Design Request*\n`;
                waMessage += `Name: ${name}\n`;
                waMessage += `Details: ${details}\n`;
                if (uploadedImageUrl) {
                    waMessage += `Image: ${uploadedImageUrl}\n`;
                }

                const encodedMessage = encodeURIComponent(waMessage);
                window.open(`https://wa.me/917058445094?text=${encodedMessage}`, '_blank');
                customDesignModal.style.display = 'none';
                customDesignForm.reset();
                if(window.showNotification) window.showNotification('Request prepared! Please send the WhatsApp message.', 'success');
            } catch (err) {
                console.error(err);
                if(window.showNotification) window.showNotification('Failed to process request. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    window.showNotification = function(message, type) {
        // Create container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Style the notification
        Object.assign(notification.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '500',
            animation: 'fadeInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            background: type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        });

        container.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    };

    // ==================== SMOOTH SCROLL FOR ANCHOR LINKS ====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ==================== COUNTERS ANIMATION ====================
    // Animate numbers when they come into view
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);

        function updateCounter() {
            start += increment;
            if (start >= target) {
                element.textContent = target + '+';
                return;
            }
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        }

        updateCounter();
    }

    // ==================== PRELOADER ANIMATION ====================
    // Fade in page content
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    window.addEventListener('load', () => {
        document.body.style.opacity = '1';
    });

    // ==================== PROMO BANNER ====================
    // ==================== PROMO BANNER ====================
    const promoBannerText = document.getElementById('promoBannerText');

    async function loadPromoBanner() {
        try {
            const res = await fetch('/api/settings/banner');
            if (res.ok) {
                const data = await res.json();
                if (data.banner && data.banner.trim() !== '') {
                    const bannerHtml = `<span style="margin-right: 50px;">🔥 ${data.banner}</span><span style="margin-right: 50px;">🔥 ${data.banner}</span><span style="margin-right: 50px;">🔥 ${data.banner}</span><span style="margin-right: 50px;">🔥 ${data.banner}</span><span style="margin-right: 50px;">🔥 ${data.banner}</span>`;
                    const marqueeContainer = document.querySelector('.campaign-marquee');
                    if (marqueeContainer) {
                        marqueeContainer.innerHTML = `<div class="marquee-content">${bannerHtml}</div><div class="marquee-content" aria-hidden="true">${bannerHtml}</div>`;
                    }
                    if (campaignBar) campaignBar.style.display = 'flex';
                } else {
                    if (campaignBar) campaignBar.style.display = 'none';
                }
            }
        } catch (e) {
            console.error('Failed to load promo banner', e);
        }
    }
    window.loadPromoBanner = loadPromoBanner;
    loadPromoBanner();

    // ==================== DYNAMIC PRODUCTS ====================
    const productsGrid = document.getElementById('productsGrid');
    const productSearch = document.getElementById('productSearch');
    const productSort = document.getElementById('productSort');
    let currentCategoryFilter = 'all';
    let currentSubCategoryFilter = 'All';
    let allProducts = [];
    let userWishlist = [];
    const isProductsPage = window.location.pathname.endsWith('products.html');
    let visibleProductsCount = isProductsPage ? 10000 : 8;

    // Filter and Sort Logic
    function getFilteredAndSortedProducts() {
        let filtered = [...allProducts];

        // Apply Search
        if (productSearch && productSearch.value.trim() !== '') {
            const query = productSearch.value.trim().toLowerCase();
            filtered = filtered.filter(p => p.title.toLowerCase().includes(query));
        }

        // Apply Category Filter
        if (currentCategoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategoryFilter);
        }

        // Apply Sub-Category Filter
        if (currentSubCategoryFilter !== 'All') {
            filtered = filtered.filter(p => p.sub_category === currentSubCategoryFilter);
        }

        // Apply Sort
        if (productSort) {
            const sortVal = productSort.value;
            if (sortVal === 'price_asc') {
                filtered.sort((a, b) => a.discount_price - b.discount_price);
            } else if (sortVal === 'price_desc') {
                filtered.sort((a, b) => b.discount_price - a.discount_price);
            } else {
                // newest - assume higher ID is newer
                filtered.sort((a, b) => b.id - a.id);
            }
        }

        return filtered;
    }

    if (productSearch) productSearch.addEventListener('input', () => { visibleProductsCount = isProductsPage ? 10000 : 8; renderProducts(getFilteredAndSortedProducts()); });
    if (productSort) productSort.addEventListener('change', () => { visibleProductsCount = isProductsPage ? 10000 : 8; renderProducts(getFilteredAndSortedProducts()); });

    // ==================== FETCH PRODUCTS ====================
    async function loadProducts() {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            allProducts = data.products || [];

            // Fetch wishlist if user is logged in
            const userToken = window.getAuthToken ? window.getAuthToken() : null;
            if (userToken) {
                const wRes = await fetch('/api/users/wishlist', { headers: { 'Authorization': `Bearer ${userToken}` } });
                if (wRes.ok) {
                    const wData = await wRes.json();
                    userWishlist = (wData.wishlist || []).map(p => p.id);
                }
            } else {
                userWishlist = [];
            }

            renderProducts(getFilteredAndSortedProducts());
        } catch (error) {
            console.error('Failed to fetch products:', error);
            if (document.getElementById('productsGrid')) {
                document.getElementById('productsGrid').innerHTML = '<p>Failed to load products. Please try again later.</p>';
            }
        }
    }
    window.loadProducts = loadProducts;

    function renderProducts(products) {
        if (!productsGrid) return;
        productsGrid.innerHTML = '';
        
        // Render products
        const isAdmin = window.isAdminUser === true;
        
        const productsToShow = products.slice(0, visibleProductsCount);

        productsToShow.forEach((product, index) => {
            let discountPercent = 0;
            if (product.original_price > 0) {
                discountPercent = Math.round(((product.original_price - product.discount_price) / product.original_price) * 100);
            }
            
            // Build rating stars
            let stars = '';
            for(let i=1; i<=5; i++) {
                if (i <= Math.floor(product.rating)) {
                    stars += '<i class="fas fa-star"></i>';
                } else if (i - product.rating <= 0.5) {
                    stars += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    stars += '<i class="far fa-star"></i>';
                }
            }

            const isWished = userWishlist.includes(product.id);
            const heartIcon = isWished ? 'fas fa-heart' : 'far fa-heart';
            const heartColor = isWished ? '#ff4757' : '#999';

            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-category', product.category);
            card.style.position = 'relative';
            card.style.setProperty('--stagger-index', index);
            card.innerHTML = `
                <div class="product-badge">-${discountPercent}%</div>
                <button class="wishlist-toggle-btn" data-id="${product.id}" data-wished="${isWished}" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: #fff; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); color: ${heartColor}; font-size: 1.2rem; transition: transform 0.2s;">
                    <i class="${heartIcon}"></i>
                </button>
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <div class="product-rating">
                        ${stars}
                        <span>(${product.rating})</span>
                    </div>
                    <div class="product-price">
                        <span class="original-price">₹${product.original_price}</span>
                        <span class="discount-price">₹${product.discount_price}</span>
                    </div>
                    <button class="btn btn-whatsapp w-100 btn-order" data-product="${product.title}" data-price="${product.discount_price}">
                        ORDER ON WHATSAPP <i class="fab fa-whatsapp"></i>
                    </button>
                    ${isAdmin ? `
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-outline w-100 edit-product-btn" style="border: 1px solid var(--navy-dark); color: var(--navy-dark); padding: 0.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; background: transparent; transition: all 0.2s ease;" onmouseover="this.style.background='var(--navy-dark)'; this.style.color='var(--white)';" onmouseout="this.style.background='transparent'; this.style.color='var(--navy-dark)';" data-id="${product.id}" data-title="${product.title}" data-category="${product.category}" data-original="${product.original_price}" data-discount="${product.discount_price}" data-rating="${product.rating}">EDIT</button>
                        <button class="btn btn-outline w-100 delete-product-btn" style="border: 1px solid #ef4444; color: #ef4444; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; background: transparent; transition: all 0.2s ease;" onmouseover="this.style.background='#ef4444'; this.style.color='var(--white)';" onmouseout="this.style.background='transparent'; this.style.color='#ef4444';" data-id="${product.id}">DELETE</button>
                    </div>` : ''}
                </div>
            `;
            productsGrid.appendChild(card);
        });

        if (products.length > visibleProductsCount) {
            const viewMoreContainer = document.createElement('div');
            viewMoreContainer.style.gridColumn = '1 / -1';
            viewMoreContainer.style.display = 'flex';
            viewMoreContainer.style.justifyContent = 'center';
            viewMoreContainer.style.marginTop = '20px';
            
            if (!isProductsPage) {
                viewMoreContainer.innerHTML = `
                    <a href="products.html" class="btn btn-outline" style="padding: 0.8rem 2.5rem; font-weight: 600; border-radius: 50px; text-decoration: none; display: inline-block;">
                        View More Products <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                    </a>
                `;
                productsGrid.appendChild(viewMoreContainer);
            } else {
                viewMoreContainer.innerHTML = `
                    <button id="viewMoreProductsBtn" class="btn btn-outline" style="padding: 0.8rem 2.5rem; font-weight: 600; border-radius: 50px;">
                        Load More <i class="fas fa-chevron-down" style="margin-left: 8px;"></i>
                    </button>
                `;
                productsGrid.appendChild(viewMoreContainer);

                document.getElementById('viewMoreProductsBtn').addEventListener('click', () => {
                    visibleProductsCount += 8;
                    renderProducts(products);
                });
            }
        }

        // Re-attach event listeners for new buttons
        attachOrderListeners();
        attachWishlistListeners();
        if (isAdmin) {
            attachDeleteListeners();
            attachEditListeners();
        }
    }

    function attachOrderListeners() {
        const smartOrderModal = document.getElementById('smartOrderModal');
        document.querySelectorAll('.btn-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.closest('.product-card').querySelector('.edit-product-btn') ? btn.closest('.product-card').querySelector('.edit-product-btn').getAttribute('data-id') : null;
                const productName = btn.getAttribute('data-product');
                const productPrice = btn.getAttribute('data-price');
                
                if (productName && productPrice && smartOrderModal) {
                    document.getElementById('smartOrderProductName').textContent = productName;
                    document.getElementById('smartOrderProductId').value = productId || '';
                    document.getElementById('smartOrderProductTitle').value = productName;
                    document.getElementById('smartOrderProductPrice').value = productPrice;
                    
                    smartOrderModal.style.display = 'flex';
                }
            });
        });
    }

    function attachWishlistListeners() {
        document.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const token = window.getAuthToken ? window.getAuthToken() : null;
                if (!token) {
                    if(window.showNotification) window.showNotification('Please Login/Register to add items to your wishlist!', 'error');
                    return;
                }
                
                const productId = btn.getAttribute('data-id');
                const isWished = btn.getAttribute('data-wished') === 'true';

                try {
                    if (isWished) {
                        const res = await fetch(`/api/users/wishlist/${productId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) loadProducts();
                    } else {
                        const res = await fetch('/api/users/wishlist', {
                            method: 'POST',
                            headers: { 
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json' 
                            },
                            body: JSON.stringify({ product_id: productId })
                        });
                        if (res.ok) loadProducts();
                        else {
                            const err = await res.json();
                            if(window.showNotification) window.showNotification(err.error || 'Failed to add to wishlist', 'error');
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        });
    }

    let deleteTimeout = null;
    let pendingDeleteId = null;
    let pendingDeleteCard = null;

    function attachDeleteListeners() {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        
        // Single listener on modal buttons to prevent multiple bindings
        if (confirmDeleteBtn && !confirmDeleteBtn.hasAttribute('data-bound')) {
            confirmDeleteBtn.setAttribute('data-bound', 'true');
            
            cancelDeleteBtn.addEventListener('click', () => {
                deleteConfirmModal.style.display = 'none';
                pendingDeleteId = null;
                pendingDeleteCard = null;
            });

            confirmDeleteBtn.addEventListener('click', () => {
                deleteConfirmModal.style.display = 'none';
                
                if (pendingDeleteId && pendingDeleteCard) {
                    // Soft hide the card immediately
                    pendingDeleteCard.style.display = 'none';
                    
                    // Show Undo Toast
                    showUndoToast('Product scheduled for deletion.', 5, pendingDeleteId, pendingDeleteCard);
                }
            });
        }

        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                pendingDeleteId = btn.getAttribute('data-id');
                pendingDeleteCard = btn.closest('.product-card');
                deleteConfirmModal.style.display = 'flex';
            });
        });
    }

    function showUndoToast(message, seconds, productId, productCard) {
        let container = document.getElementById('undoToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'undoToastContainer';
            container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.background = '#333';
        toast.style.color = 'white';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '15px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.animation = 'slideUp 0.3s ease-out forwards';
        
        toast.innerHTML = `
            <span>${message} (<span class="undo-timer">${seconds}</span>s)</span>
            <button class="undo-btn" style="background: transparent; color: #ffeb3b; border: 1px solid #ffeb3b; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Undo</button>
        `;
        
        container.appendChild(toast);
        
        const timerSpan = toast.querySelector('.undo-timer');
        const undoBtn = toast.querySelector('.undo-btn');
        let timeLeft = seconds;
        let isUndone = false;
        
        const countdownInterval = setInterval(async () => {
            timeLeft--;
            if (timerSpan) timerSpan.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                if (!isUndone) {
                    toast.style.display = 'none';
                    toast.remove();
                    
                    // Execute actual deletion
                    const token = window.getAuthToken();
                    try {
                        const res = await fetch(`/api/admin/products/${productId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!res.ok) {
                            if(window.showNotification) window.showNotification('Failed to delete product', 'error');
                            productCard.style.display = 'flex'; // Unhide if it failed
                        }
                    } catch(err) {
                        console.error(err);
                        productCard.style.display = 'flex'; // Unhide on error
                    }
                }
            }
        }, 1000);
        
        undoBtn.addEventListener('click', () => {
            isUndone = true;
            clearInterval(countdownInterval);
            toast.remove();
            productCard.style.display = 'flex'; // Unhide the card
            if(window.showNotification) window.showNotification('Deletion undone', 'success');
        });
    }

    function attachEditListeners() {
        const editProductModal = document.getElementById('editProductModal');
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('editProdId').value = btn.getAttribute('data-id');
                document.getElementById('editProdTitle').value = btn.getAttribute('data-title');
                document.getElementById('editProdCategory').value = btn.getAttribute('data-category');
                document.getElementById('editProdOriginalPrice').value = btn.getAttribute('data-original');
                document.getElementById('editProdDiscountPrice').value = btn.getAttribute('data-discount');
                document.getElementById('editProdRating').value = btn.getAttribute('data-rating');
                
                if (editProductModal) {
                    editProductModal.style.display = 'flex';
                }
            });
        });
    }

    // ==================== PRODUCT FILTERS ====================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const subCategoryFiltersContainer = document.getElementById('subCategoryFilters');

    // Duplicate map so script.js knows the options independently of admin.js
    const scriptSubCategoriesMap = {
        flex: ['All', 'Regular Flex', 'Star Flex', 'Backlit Flex', 'Frontlit Flex'],
        paper: ['All', 'Business Cards', 'Letterheads', 'Flyers'],
        vinyl: ['All', 'Glossy Vinyl', 'Matte Vinyl', 'Transparent Vinyl'],
        sublimation: ['All', 'Mugs', 'Polyester Apparel', 'Keychains', 'Photo Frames', 'Cushions', 'Sipper Bottles'],
        dtf: ['All', 'Cotton T-Shirts', 'Caps', 'Tote Bags'],
        all: ['All']
    };

    function renderSubCategoryFilters(category) {
        if (!subCategoryFiltersContainer) return;
        subCategoryFiltersContainer.innerHTML = '';
        
        if (category === 'all') {
            currentSubCategoryFilter = 'All';
            return;
        }

        const subs = scriptSubCategoriesMap[category] || ['All'];
        if (subs.length <= 1) return; // Don't show if there are no sub-categories besides 'All'

        subs.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = `filter-btn sub-filter-btn ${sub === currentSubCategoryFilter ? 'active' : ''}`;
            btn.style.fontSize = '0.85rem';
            btn.style.padding = '0.4rem 1rem';
            btn.textContent = sub;
            btn.addEventListener('click', () => {
                // Remove active class from all sub-filters
                document.querySelectorAll('.sub-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSubCategoryFilter = sub;
                visibleProductsCount = isProductsPage ? 10000 : 8;
                renderProducts(getFilteredAndSortedProducts());
            });
            subCategoryFiltersContainer.appendChild(btn);
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all main filters
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');

            currentCategoryFilter = btn.getAttribute('data-filter');
            currentSubCategoryFilter = 'All'; // Reset sub-category on main category change
            
            renderSubCategoryFilters(currentCategoryFilter);
            
            visibleProductsCount = isProductsPage ? 10000 : 8;
            renderProducts(getFilteredAndSortedProducts());
        });
    });

    // ==================== SMART ORDER MODAL LOGIC ====================
    const smartOrderModal = document.getElementById('smartOrderModal');
    const smartOrderModalClose = document.getElementById('smartOrderModalClose');
    const smartOrderForm = document.getElementById('smartOrderForm');

    if (smartOrderModalClose) {
        smartOrderModalClose.addEventListener('click', () => {
            smartOrderModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == smartOrderModal) {
            smartOrderModal.style.display = 'none';
        }
    });

    if (smartOrderForm) {
        smartOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('smartOrderSubmitBtn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('product_id', document.getElementById('smartOrderProductId').value || '');
                formData.append('customer_name', document.getElementById('smartOrderName').value.trim());
                formData.append('customer_phone', document.getElementById('smartOrderPhone').value.trim());
                formData.append('design_type', document.getElementById('smartOrderDesign').value);
                formData.append('quantity', document.getElementById('smartOrderQty').value);
                formData.append('size', document.getElementById('smartOrderSize').value.trim());
                formData.append('requirements', document.getElementById('smartOrderReqs').value.trim());
                
                const imageInput = document.getElementById('smartOrderImage');
                if (imageInput.files.length > 0) {
                    formData.append('image', imageInput.files[0]);
                }

                // Save to database
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    body: formData
                });
                
                let imageUrl = '';
                if (res.ok) {
                    const data = await res.json();
                    imageUrl = data.order.reference_image_url || '';
                }

                // Format WhatsApp Message (Option A Flow)
                const pTitle = document.getElementById('smartOrderProductTitle').value;
                const pPrice = document.getElementById('smartOrderProductPrice').value;
                const name = document.getElementById('smartOrderName').value.trim();
                const phone = document.getElementById('smartOrderPhone').value.trim();
                const design = document.getElementById('smartOrderDesign').value;
                const qty = document.getElementById('smartOrderQty').value;
                const size = document.getElementById('smartOrderSize').value.trim();
                const reqs = document.getElementById('smartOrderReqs').value.trim();

                let waMessage = `*New Order: ${pTitle}*\n`;
                waMessage += `Price: ₹${pPrice}\n`;
                waMessage += `------------------------\n`;
                waMessage += `Name: ${name}\n`;
                waMessage += `Phone: ${phone}\n`;
                waMessage += `Design Type: ${design}\n`;
                waMessage += `Quantity: ${qty}\n`;
                if(size) waMessage += `Size: ${size}\n`;
                waMessage += `Requirements: ${reqs}\n`;
                if (imageUrl) {
                    waMessage += `Ref Image: ${imageUrl}\n`;
                }

                const whatsappPhone = '917058445094';
                const encodedMessage = encodeURIComponent(waMessage);
                window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');
                
                smartOrderModal.style.display = 'none';
                smartOrderForm.reset();
                if(window.showNotification) window.showNotification('Order submitted & WhatsApp opened!', 'success');
            } catch (err) {
                console.error(err);
                if(window.showNotification) window.showNotification('Failed to process order.', 'error');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ==================== INITIAL CALLS ====================
    handleNavbarScroll();
    handleBackToTop();
    loadProducts();
});

// ==========================================================================
// DYNAMIC SERVICES CATALOG (services.html)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const servicesData = [
        {
            title: "Flex Printing",
            icon: "fa-print",
            items: [
                { name: "Regular Flex", desc: "Standard quality for birthday banners, event backdrops, and small shop banners." },
                { name: "Star Flex", desc: "Heavy-duty, high-quality gloss/matte flex for premium shop boards and large hoardings." },
                { name: "Backlit Flex", desc: "Specially designed for glow-sign boards (lightboxes) with rear illumination." },
                { name: "Frontlit Flex", desc: "Standard non-translucent flex designed for front-lighting setups." },
                { name: "Hoardings & Promotional Banners", desc: "Large-scale outdoor advertising banners." }
            ]
        },
        {
            title: "Paper Printing",
            icon: "fa-copy",
            items: [
                { name: "Business Cards / Visiting Cards", desc: "Available in Matte, Glossy, Velvet, Texture, or Spot UV finishes." },
                { name: "Letterheads & Envelopes", desc: "Professional corporate stationery." },
                { name: "Flyers, Leaflets & Pamphlets", desc: "Promotional hand-outs for local marketing." },
                { name: "Brochures (Bi-fold / Tri-fold)", desc: "Detailed company profiles and product catalogs." },
                { name: "Bill Books & Receipt Books", desc: "Customized GST, non-GST, and carbonless invoice books." },
                { name: "Posters & Menu Cards", desc: "High-quality prints for hotels, cafes, events, and wall displays." },
                { name: "Invitation Cards", desc: "Wedding cards, birthday invites, and inaugural event cards." }
            ]
        },
        {
            title: "Eco Vinyl Printing",
            icon: "fa-leaf",
            items: [
                { name: "Vinyl Stickers & Product Labels", desc: "Die-cut or roll stickers for product packaging and branding." },
                { name: "Sunboard Printing", desc: "Eco-vinyl mounted on 3mm/5mm foam boards for exhibitions and in-store displays." },
                { name: "One-Way Vision", desc: "Perforated vinyl for shop glass fronts (visible advertisement from the outside, see-through from the inside)." },
                { name: "Clear / Transparent Vinyl", desc: "See-through stickers ideal for glass doors, windows, and packaging." },
                { name: "Wall Graphics & Custom Wallpaper", desc: "High-res prints for office interiors, cafes, and home decor." }
            ]
        },
        {
            title: "Sublimation Printing",
            icon: "fa-mug-hot",
            items: [
                { name: "Mug Printing", desc: "White mugs, Magic/Color-changing mugs, Patch mugs, and Heart-handle mugs." },
                { name: "Polyester Apparel", desc: "Sports jerseys, marathon t-shirts, and promotional event wear." },
                { name: "Keychains & Mobile Covers", desc: "Personalized photo keychains and hard/soft phone cases." },
                { name: "Custom Photo Frames & Plaques", desc: "Printed MDF wood, stone/rock slates, and metal sheets." },
                { name: "Cushions & Pillows", desc: "Magic/Sequin cushions, LED cushions, and fur pillows." },
                { name: "Sipper Bottles & Flasks", desc: "Printed aluminum/steel water bottles for gyms and corporate kits." }
            ]
        },
        {
            title: "DTF (Direct to Film) Printing",
            icon: "fa-tshirt",
            items: [
                { name: "Cotton T-Shirts & Hoodies", desc: "High-quality customized streetwear, brand merchandise, and corporate uniforms." },
                { name: "Caps & Hats", desc: "Embroidered-look multi-color prints on promotional and sports caps." },
                { name: "Tote Bags & Canvas Bags", desc: "Eco-friendly customized shopping and promotional bags." },
                { name: "Denim & Jackets", desc: "Heavy-duty fabric prints for custom fashion wear." },
                { name: "DTF Prints Only (Roll / Sheet Supply)", desc: "Ready-to-heat-press DTF sticker sheets for other printers and garment manufacturers." }
            ]
        }
    ];

    const catalogNav = document.getElementById('catalog-nav');
    const catalogDetails = document.getElementById('catalog-details');
    
    if (catalogNav && catalogDetails) {
        // Initialize Sidebar Navigation
        servicesData.forEach((category, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="catalog-nav-link" data-index="${index}">
                                <i class="fas ${category.icon}" style="width: 25px;"></i> ${category.title}
                            </a>`;
            catalogNav.appendChild(li);
        });

        const navLinks = document.querySelectorAll('.catalog-nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Active State
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                const idx = this.getAttribute('data-index');
                const category = servicesData[idx];

                // Render Content
                catalogDetails.innerHTML = `
                    <div style="animation: fadeInUpSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
                        <h2 style="font-size: 2rem; color: #1a2a6c; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; display: flex; align-items: center; gap: 15px; font-family: 'Poppins', sans-serif;">
                            <span style="background: #fff0f1; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${category.icon}" style="color: #ff4757; font-size: 1.4rem;"></i>
                            </span>
                            ${category.title}
                        </h2>
                        <div class="catalog-grid">
                            ${category.items.map((subItem, subIdx) => `
                                <div class="catalog-item">
                                    <div class="catalog-card" style="animation: fadeInUpSmooth 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${subIdx * 0.08}s both;">
                                        <h4 style="font-size: 1.15rem; color: #1a2a6c; margin: 0 0 12px 0; display: flex; align-items: flex-start; gap: 10px; font-family: 'Poppins', sans-serif; font-weight: 600;">
                                            <i class="fas fa-check-circle" style="color: #ff4757; font-size: 1rem; margin-top: 4px;"></i> <span>${subItem.name}</span>
                                        </h4>
                                        <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.6;">${subItem.desc}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        });
    }
});
