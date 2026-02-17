const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const screenshotDir = path.join(__dirname, 'screenshots_verify');
    const fs = require('fs');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

    console.log('Navigating to admin dashboard...');
    try {
        await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });

        // Take initial screenshot
        await page.screenshot({ path: path.join(screenshotDir, '01_dashboard_initial.png') });
        console.log('Captured initial dashboard.');

        // Try to toggle Full-Page Mode
        // We'll need to find the settings button. It's usually a gear icon or similar.
        // Assuming it's the button with the gear icon.
        const settingsBtn = page.locator('button[aria-label="Toggle view settings"]');
        if (await settingsBtn.isVisible()) {
            await settingsBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(screenshotDir, '02_settings_sidebar.png') });
            console.log('Captured settings sidebar.');

            // Toggle Full Page
            const fullPageToggle = page.locator('button:has-text("Full-Page Mode")');
            if (await fullPageToggle.isVisible()) {
                await fullPageToggle.click();
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.join(screenshotDir, '03_full_page_mode.png') });
                console.log('Captured full page mode.');
            }

            // Open Roadmap
            const roadmapBtn = page.locator('button:has-text("Feature Roadmap")');
            if (await roadmapBtn.isVisible()) {
                await roadmapBtn.click();
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.join(screenshotDir, '04_roadmap_overlay.png') });
                console.log('Captured roadmap overlay.');
            }
        }

        // Switch to Gallery and Gallery Grouping
        const galleryBtn = page.locator('button:has-text("Gallery")');
        if (await galleryBtn.isVisible()) {
            await galleryBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(screenshotDir, '05_gallery_view.png') });
            console.log('Captured gallery view.');
        }

    } catch (e) {
        console.error('Error during verification:', e);
    }

    await browser.close();
    console.log('Verification script finished.');
})();
