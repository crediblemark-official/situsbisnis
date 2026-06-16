const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://univedpress.localhost:3000/');
    // Wait for the specific product title to render
    await page.waitForSelector('text="Tidak Semua Cinta"', { timeout: 10000 });
    
    // Find the closest ancestor that is likely the card container
    const cardHTML = await page.evaluate(() => {
      const el = document.evaluate('//text()[contains(., "Tidak Semua Cinta")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (el && el.parentElement) {
        // go up to a container that has an image
        let curr = el.parentElement;
        while(curr && curr.tagName !== 'BODY') {
          if (curr.querySelector('img')) {
            return curr.outerHTML;
          }
          curr = curr.parentElement;
        }
      }
      return 'Card not found or has no image';
    });
    
    console.log(cardHTML);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
