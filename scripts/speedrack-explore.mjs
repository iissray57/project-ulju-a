// SpeedRack simulator page exploration script
import { chromium } from 'playwright';

async function explore() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('=== 1. Loading SpeedRack simulator ===');
  await page.goto('https://speedrack.co.kr/simulator.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/speedrack-01-initial.png', fullPage: false });

  // Get page structure
  console.log('\n=== 2. Page HTML structure ===');
  const bodyHTML = await page.evaluate(() => {
    const body = document.body;
    // Get all top-level elements with their classes/ids
    const elements = [];
    for (const child of body.children) {
      elements.push({
        tag: child.tagName,
        id: child.id || null,
        class: child.className || null,
        childCount: child.children.length,
        text: child.textContent?.slice(0, 100) || '',
      });
    }
    return elements;
  });
  console.log(JSON.stringify(bodyHTML, null, 2));

  // Get all interactive elements
  console.log('\n=== 3. Interactive elements ===');
  const interactives = await page.evaluate(() => {
    const result = [];
    // Buttons
    document.querySelectorAll('button, [role="button"], .btn, input[type="button"]').forEach(el => {
      result.push({
        type: 'button',
        text: el.textContent?.trim().slice(0, 50),
        id: el.id || null,
        class: el.className?.slice(0, 80) || null,
      });
    });
    // Inputs (sliders, selects, etc.)
    document.querySelectorAll('input, select, textarea').forEach(el => {
      result.push({
        type: el.tagName + ':' + (el.type || el.tagName),
        id: el.id || null,
        name: el.name || null,
        value: el.value || null,
        class: el.className?.slice(0, 80) || null,
        min: el.min || null,
        max: el.max || null,
        step: el.step || null,
      });
    });
    return result;
  });
  console.log(JSON.stringify(interactives, null, 2));

  // Get all text labels and sections
  console.log('\n=== 4. All visible text labels ===');
  const labels = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('label, h1, h2, h3, h4, h5, h6, .label, .title, .header, span, p, div').forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 80 && el.children.length === 0) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          result.push({
            tag: el.tagName,
            text,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            class: el.className?.slice(0, 60) || null,
          });
        }
      }
    });
    return result.slice(0, 100);
  });
  console.log(JSON.stringify(labels, null, 2));

  // Check for iframes (PlayCanvas might be in an iframe)
  console.log('\n=== 5. Iframes ===');
  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src,
      id: f.id,
      class: f.className,
      width: f.width,
      height: f.height,
    }));
  });
  console.log(JSON.stringify(iframes, null, 2));

  // Check for canvas elements (PlayCanvas / WebGL)
  console.log('\n=== 6. Canvas elements ===');
  const canvases = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('canvas')).map(c => ({
      id: c.id,
      class: c.className,
      width: c.width,
      height: c.height,
      style: c.style.cssText?.slice(0, 100),
    }));
  });
  console.log(JSON.stringify(canvases, null, 2));

  // Detailed sidebar/control panel exploration
  console.log('\n=== 7. Control panels structure ===');
  const panels = await page.evaluate(() => {
    const result = [];
    // Look for common panel containers
    const selectors = [
      '.sidebar', '.panel', '.control', '.option', '.menu',
      '#sidebar', '#panel', '#control', '#option', '#menu',
      '[class*="panel"]', '[class*="control"]', '[class*="option"]',
      '[class*="sidebar"]', '[class*="menu"]', '[class*="setting"]',
    ];
    const visited = new Set();
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (visited.has(el)) return;
        visited.add(el);
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          result.push({
            selector: sel,
            id: el.id || null,
            class: el.className?.slice(0, 100) || null,
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
            childText: el.textContent?.trim().slice(0, 200) || '',
          });
        }
      });
    }
    return result;
  });
  console.log(JSON.stringify(panels, null, 2));

  // Look at the full HTML structure (simplified)
  console.log('\n=== 8. Full page DOM tree (depth 3) ===');
  const domTree = await page.evaluate(() => {
    function getTree(el, depth = 0) {
      if (depth > 3) return null;
      const children = [];
      for (const child of el.children) {
        const tree = getTree(child, depth + 1);
        if (tree) children.push(tree);
      }
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id || undefined,
        cls: el.className ? (typeof el.className === 'string' ? el.className.slice(0, 60) : '') : undefined,
        rect: rect.width > 0 ? `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}` : undefined,
        text: el.children.length === 0 ? el.textContent?.trim().slice(0, 40) : undefined,
        children: children.length > 0 ? children : undefined,
      };
    }
    return getTree(document.body);
  });
  console.log(JSON.stringify(domTree, null, 2));

  await browser.close();
  console.log('\n=== Done! Screenshots saved to /tmp/speedrack-*.png ===');
}

explore().catch(e => { console.error(e); process.exit(1); });
