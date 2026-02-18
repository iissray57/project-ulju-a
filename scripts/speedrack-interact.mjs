// SpeedRack simulator interaction test
import { chromium } from 'playwright';

async function explore() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('https://speedrack.co.kr/simulator.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // 1. Get full item/option data from the page scripts
  console.log('=== 1. Full item & option data ===');
  const fullData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      if (s.textContent?.includes('스피드랙 이미지영역에 뿌려질 아이템들 리스트')) {
        return s.textContent;
      }
    }
    return 'NOT FOUND';
  });
  console.log(fullData);

  // 2. Click on "스피드랙 선반" (first product)
  console.log('\n=== 2. Click on first product (스피드랙 선반) ===');
  await page.click('.prdOption:first-child');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/speedrack-03-after-select.png' });

  // Check what changed in the UI
  const afterSelect = await page.evaluate(() => {
    const createBtnWrap = document.querySelector('.createBtnWrap');
    const detailSettings = document.querySelector('.detailSettings');
    const operation = document.querySelector('.operation');
    return {
      createBtnClass: createBtnWrap?.className,
      createBtnVisible: createBtnWrap?.querySelector('.create')?.offsetWidth > 0,
      cancelBtnVisible: createBtnWrap?.querySelector('.cancel')?.offsetWidth > 0,
      detailSettingsVisible: detailSettings?.style.display !== 'none',
      operationVisible: operation?.style.display !== 'none',
    };
  });
  console.log('After select:', JSON.stringify(afterSelect, null, 2));

  // 3. Click "생성" (Create) button
  console.log('\n=== 3. Click Create button ===');
  await page.click('button.create');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/speedrack-04-after-create.png' });

  // Check state after creation
  const afterCreate = await page.evaluate(() => {
    const detailSettings = document.querySelector('.detailSettings');
    const operation = document.querySelector('.operation');
    const ds = window.getComputedStyle(detailSettings);
    const op = window.getComputedStyle(operation);

    // Get detail settings content
    const sizeWrapMain = detailSettings?.querySelector('.sizeWrap.mainSize');
    const sizeWrapMainContent = sizeWrapMain?.innerHTML?.slice(0, 3000);

    // Get slider values
    const widthVal = document.getElementById('width')?.value;
    const depthVal = document.getElementById('depth')?.value;
    const heightVal = document.getElementById('height')?.value;
    const shelfVal = document.getElementById('shelfDum')?.value;

    // Get selected options list
    const selectedOptions = document.querySelector('.selectedOptions');
    const optionListHTML = selectedOptions?.innerHTML?.slice(0, 2000);

    return {
      detailSettingsDisplay: ds.display,
      operationDisplay: op.display,
      sliders: { width: widthVal, depth: depthVal, height: heightVal, shelf: shelfVal },
      sizeWrapMainContent,
      optionListHTML,
    };
  });
  console.log('After create:', JSON.stringify(afterCreate, null, 2));

  // 4. Explore detail settings panel in depth
  console.log('\n=== 4. Detail settings panel HTML ===');
  const detailHTML = await page.evaluate(() => {
    const el = document.querySelector('.detailSettings');
    return el ? el.innerHTML.slice(0, 5000) : 'NOT FOUND';
  });
  console.log(detailHTML);

  // 5. Operation buttons state
  console.log('\n=== 5. Operation buttons ===');
  const opHTML = await page.evaluate(() => {
    const el = document.querySelector('.operation');
    return el ? el.innerHTML.slice(0, 2000) : 'NOT FOUND';
  });
  console.log(opHTML);

  // 6. Get postMessage script (full)
  console.log('\n=== 6. PostMessage functions (full) ===');
  const postMsgFull = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      if (s.textContent?.includes('sendPlaycanvasMessage')) {
        return s.textContent.slice(0, 15000);
      }
    }
    return 'NOT FOUND';
  });
  console.log(postMsgFull);

  // 7. Try clicking "견적서 보기"
  console.log('\n=== 7. Estimate button ===');
  await page.click('button.estimate');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/speedrack-05-estimate.png' });

  const estimatePopup = await page.evaluate(() => {
    const popup = document.querySelector('.popupEstimate');
    if (!popup) return 'NOT FOUND';
    const cs = window.getComputedStyle(popup);
    return {
      display: cs.display,
      html: popup.innerHTML?.slice(0, 5000),
    };
  });
  console.log(JSON.stringify(estimatePopup, null, 2));

  // 8. Check virtual background popup
  console.log('\n=== 8. Virtual background options ===');
  // Close estimate first
  await page.evaluate(() => {
    const popup = document.querySelector('.popupEstimate');
    if (popup) popup.style.display = 'none';
  });

  await page.click('button.virtual');
  await page.waitForTimeout(1000);
  const virtualPopup = await page.evaluate(() => {
    const popup = document.querySelector('.popupVirtual, #virtual');
    if (!popup) return 'NOT FOUND';
    return popup.innerHTML?.slice(0, 3000);
  });
  console.log(virtualPopup);

  await browser.close();
  console.log('\n=== Done ===');
}

explore().catch(e => { console.error(e); process.exit(1); });
