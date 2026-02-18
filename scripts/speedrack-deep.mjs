// Deep exploration of SpeedRack simulator UI and item data
import { chromium } from 'playwright';

async function explore() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('https://speedrack.co.kr/simulator.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // 1. Get the wrapper structure in detail
  console.log('=== 1. Wrapper structure (depth 5) ===');
  const wrapper = await page.evaluate(() => {
    function getTree(el, depth = 0) {
      if (depth > 5) return null;
      const children = [];
      for (const child of el.children) {
        const tree = getTree(child, depth + 1);
        if (tree) children.push(tree);
      }
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id || undefined,
        cls: el.className ? (typeof el.className === 'string' ? el.className.trim().slice(0, 80) : '') : undefined,
        rect: rect.width > 0 ? `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}` : undefined,
        text: el.children.length === 0 ? el.textContent?.trim().slice(0, 60) : undefined,
        display: styles.display !== 'block' && styles.display !== 'inline' ? styles.display : undefined,
        children: children.length > 0 ? children : undefined,
      };
    }
    const el = document.querySelector('.wrapper');
    return el ? getTree(el) : 'NOT FOUND';
  });
  console.log(JSON.stringify(wrapper, null, 2));

  // 2. Get item data from the script that defines items
  console.log('\n=== 2. Item data (speedrack/homedant items) ===');
  const itemData = await page.evaluate(() => {
    // Try to access global variables that might contain item lists
    const globals = {};
    const tryAccess = (name) => {
      try {
        const val = window[name];
        if (val !== undefined) globals[name] = val;
      } catch (e) {}
    };
    // Common variable names seen in the script
    ['speedrack', 'homedantRack', 'speedrackMax', 'items', 'itemList', 'rackItems', 'rackList'].forEach(tryAccess);

    // Also look for the script content that defines items
    const scripts = document.querySelectorAll('script');
    let itemScript = null;
    for (const s of scripts) {
      if (s.textContent?.includes('스피드랙 이미지영역에 뿌려질 아이템들 리스트')) {
        itemScript = s.textContent.slice(0, 5000);
        break;
      }
    }
    return { globals, itemScript };
  });
  console.log(JSON.stringify(itemData, null, 2));

  // 3. Get optionBox content in detail
  console.log('\n=== 3. OptionBox HTML ===');
  const optionBoxHTML = await page.evaluate(() => {
    const el = document.querySelector('.optionBox');
    return el ? el.innerHTML.slice(0, 10000) : 'NOT FOUND';
  });
  console.log(optionBoxHTML);

  // 4. Get all CSS classes that matter for layout
  console.log('\n=== 4. Visible non-empty elements with bounding rects ===');
  const visibleElements = await page.evaluate(() => {
    const results = [];
    const all = document.querySelectorAll('.wrapper *');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 20 && rect.height > 20 && rect.x >= 0 && rect.y >= 0) {
        results.push({
          tag: el.tagName,
          id: el.id || undefined,
          cls: el.className ? (typeof el.className === 'string' ? el.className.trim().slice(0, 60) : '') : undefined,
          rect: `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          text: el.children.length === 0 ? el.textContent?.trim().slice(0, 40) : undefined,
        });
      }
    }
    return results;
  });
  console.log(JSON.stringify(visibleElements, null, 2));

  // 5. Screenshot the full page
  await page.screenshot({ path: '/tmp/speedrack-02-full.png', fullPage: false });

  // 6. Extract CSS for the main layout
  console.log('\n=== 5. Layout CSS (wrapper, optionBox, etc.) ===');
  const layoutCSS = await page.evaluate(() => {
    const selectors = ['.wrapper', '.optionBox', '.canvasArea', '.topMenu', '.bottomMenu', '#app-frame-show', '.toolBox'];
    const result = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const cs = window.getComputedStyle(el);
        result[sel] = {
          display: cs.display,
          position: cs.position,
          width: cs.width,
          height: cs.height,
          top: cs.top,
          left: cs.left,
          right: cs.right,
          bottom: cs.bottom,
          flex: cs.flex,
          overflow: cs.overflow,
          background: cs.backgroundColor,
        };
      }
    }
    return result;
  });
  console.log(JSON.stringify(layoutCSS, null, 2));

  // 7. Get the postMessage communication protocol
  console.log('\n=== 6. PostMessage handlers ===');
  const postMsgScript = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    let found = null;
    for (const s of scripts) {
      if (s.textContent?.includes('postMessage') || s.textContent?.includes('addEventListener')) {
        const idx = s.textContent.indexOf('postMessage');
        if (idx > -1) {
          found = s.textContent.slice(Math.max(0, idx - 200), idx + 500);
          break;
        }
      }
    }
    return found;
  });
  console.log(postMsgScript);

  await browser.close();
  console.log('\n=== Done ===');
}

explore().catch(e => { console.error(e); process.exit(1); });
