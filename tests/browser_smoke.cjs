/* Run with Playwright available. BROWSER_EXECUTABLE can select a local Chromium. */
const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'};
const server=http.createServer((req,res)=>{const route=decodeURIComponent(req.url.split('?')[0]);const file=path.join(root,route==='/'?'index.html':route);try{res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1512,height:1100}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(url);await page.waitForSelector('body[data-ready="true"]');
 assert.equal(await page.locator('.node').count(),42);
 await page.selectOption('#graphFamily','family-6');assert.equal(await page.locator('.node').count(),7);
 await page.click('#resetGraph');await page.selectOption('#graphMode','semantic');assert.equal(await page.locator('.node').count(),46);
 await page.click('#focusNode');const direct=await page.locator('.node').count();assert(direct>8);
 await page.selectOption('#depth','2');assert(await page.locator('.node').count()>direct);
 await page.locator('[data-relation]').evaluateAll(els=>els.forEach(e=>{e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));}));
 assert(await page.locator('#graphEmpty').isVisible());
 await page.click('#resetGraph');await page.fill('#graphSearch','반객위주');await page.click('[data-search-node="stratagem-30"]');assert((await page.locator('#nodeDetail h3').textContent()).includes('반객위주'));
 await page.locator('.node[data-id="stratagem-30"]').focus();await page.keyboard.press('Enter');
 await page.locator('#pathForm button').click();assert((await page.locator('#pathResult').textContent()).includes('핵심·구조'));assert((await page.locator('#pathResult').textContent()).includes('2개 관계'));
 await page.selectOption('#pathEnd','stratagem-02');await page.locator('#pathForm button').click();assert((await page.locator('#pathResult').textContent()).includes('출발과 도착이 같습니다'));
 await page.click('[data-tab="catalog"]');assert.equal(await page.locator('.card').count(),36);
 await page.selectOption('#familyFilter','family-2');assert.equal(await page.locator('.card').count(),6);
 await page.fill('#searchInput','없는계책xyz');assert.equal(await page.locator('.card').count(),0);
 await page.click('#resetCatalog');await page.fill('#searchInput','<script>alert(1)</script>');assert.equal(await page.locator('.card').count(),0);
 await page.click('#resetCatalog');await page.selectOption('#domainFilter',await page.locator('#domainFilter option').filter({hasText:/^협상$/}).getAttribute('value'));assert(await page.locator('.card').count()>0);
 await page.click('[data-tab="architecture"]');assert.equal(await page.locator('.class-row').count(),8);assert.equal(await page.locator('.schema-row').count(),7);assert.equal(await page.locator('#tripleBody tr').count(),12);
 await page.fill('#tripleSearch','만천과해');assert((await page.locator('#tripleBody').textContent()).includes('만천과해'));
 await page.click('#tripleBody button[data-edge] >> nth=0');assert((await page.locator('#nodeDetail').textContent()).includes('연결 근거'));
 await page.click('#resetGraph');const before=await page.locator('#network>g').getAttribute('transform');await page.click('#zoomIn');assert.notEqual(await page.locator('#network>g').getAttribute('transform'),before);await page.click('#fitGraph');assert.equal(await page.locator('#network>g').getAttribute('transform'),before);
 for(const width of [390,768,1512]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 const external=requests.filter(u=>!u.startsWith(url));assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 // Explicit failure message, instead of a silently empty graph.
 const fail=await browser.newPage();await fail.route('**/data/ontology.json*',r=>r.fulfill({status:503,body:'unavailable'}));await fail.goto(url);await fail.locator('#loadError').waitFor({state:'visible'});
 console.log('PASS: graph modes, family/relationship filters, 1/2-hop exploration, search, keyboard, shortest path, catalogue, schema/evidence, zoom/reset, 390/768/1512px layout, zero external requests, load failure state.');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
