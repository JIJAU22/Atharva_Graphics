const fs = require('fs');
const lines = fs.readFileSync('public/services.html', 'utf8').split('\n');
const top = lines.slice(0, 82).join('\n');
const bottom = lines.slice(502).join('\n');
const mid = `
    <!-- ==================== CATALOG HEADER ==================== -->
    <section class="catalog-header" style="background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d); padding: 120px 0 60px; text-align: center; color: white;">
        <div class="container">
            <h1 style="font-size: 3.5rem; margin-bottom: 15px; font-family: 'Poppins', sans-serif; font-weight: 800;">Our Services Catalog</h1>
            <p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto; opacity: 0.9;">Explore our premium printing and gifting services in detail.</p>
        </div>
    </section>

    <!-- ==================== CATALOG LAYOUT ==================== -->
    <section class="catalog-layout" style="padding: 60px 0; background: #f8f9fa;">
        <div class="container catalog-container" style="display: flex; gap: 40px; align-items: flex-start; max-width: 1200px;">
            
            <!-- Sidebar Navigation -->
            <aside class="catalog-sidebar" style="flex: 0 0 320px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); padding: 25px; position: sticky; top: 100px;">
                <h3 style="font-size: 1.4rem; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0; color: #1a2a6c; font-family: 'Poppins', sans-serif;">Categories</h3>
                <ul id="catalog-nav" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                    <!-- Injected by JS -->
                </ul>
            </aside>

            <!-- Main Content Area -->
            <main class="catalog-content" style="flex: 1; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); padding: 40px; min-height: 600px;">
                <div id="catalog-details" style="animation: slideUp 0.4s ease;">
                    <!-- Injected by JS -->
                    <div style="text-align: center; padding: 80px 20px; color: #888;">
                        <i class="fas fa-mouse-pointer" style="font-size: 4rem; margin-bottom: 25px; color: #e0e0e0;"></i>
                        <h2 style="font-size: 1.8rem; color: #555; font-family: 'Poppins', sans-serif;">Select a category</h2>
                        <p style="font-size: 1.1rem; max-width: 400px; margin: 0 auto;">Click on any category from the left menu to explore our detailed range of products and services.</p>
                    </div>
                </div>
            </main>
        </div>
    </section>
`;
fs.writeFileSync('public/services.html', top + '\n' + mid + '\n' + bottom);
console.log('Updated services.html');
