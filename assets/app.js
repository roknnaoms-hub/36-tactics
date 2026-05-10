let allData = [];
let selectedId = null;
const $ = (id) => document.getElementById(id);

function uniq(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')); }
function escapeHtml(s='') { return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function makeChips(items){ return (items || []).slice(0,5).map(t=>`<span class="chip">${escapeHtml(t)}</span>`).join(''); }

async function loadData(){
  const res = await fetch('data/stratagems.json');
  allData = await res.json();
  hydrateFilters();
  renderStats();
  renderCards();
  renderMatrix();
}

function hydrateFilters(){
  const families = uniq(allData.map(d=>d['계열']));
  const domains = uniq(allData.flatMap(d=>d['적용분야목록'] || []));
  $('familyFilter').innerHTML = '<option value="">전체</option>' + families.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  $('domainFilter').innerHTML = '<option value="">전체</option>' + domains.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
}
function renderStats(){
  $('totalCount').textContent = allData.length;
  $('familyCount').textContent = uniq(allData.map(d=>d['계열'])).length;
  $('tagCount').textContent = uniq(allData.flatMap(d=>d['전략태그목록'] || [])).length;
}
function getFiltered(){
  const q = $('searchInput').value.trim().toLowerCase();
  const fam = $('familyFilter').value;
  const dom = $('domainFilter').value;
  const sort = $('sortSelect').value;
  let data = allData.filter(d=>{
    const hay = Object.values(d).flat().join(' ').toLowerCase();
    const matchQ = !q || hay.includes(q);
    const matchFam = !fam || d['계열'] === fam;
    const matchDom = !dom || (d['적용분야목록'] || []).includes(dom);
    return matchQ && matchFam && matchDom;
  });
  data.sort((a,b)=>{
    if(sort==='family') return (a['계열']+a['계번호']).localeCompare(b['계열']+b['계번호'],'ko');
    if(sort==='name') return a['한글명'].localeCompare(b['한글명'],'ko');
    return Number(a['계번호'])-Number(b['계번호']);
  });
  return data;
}
function renderCards(){
  const data = getFiltered();
  $('resultCount').textContent = data.length;
  $('cardGrid').innerHTML = data.map(d=>`
    <article class="card ${selectedId===d['계번호']?'active':''}" data-id="${d['계번호']}" tabindex="0" role="button" aria-label="${escapeHtml(d['한글명'])} 상세 보기">
      <div class="card-top"><span class="num">제${d['계번호']}계</span><span class="badge">${escapeHtml(d['계열'])}</span></div>
      <h3>${escapeHtml(d['한글명'])}</h3>
      <div class="hanzi">${escapeHtml(d['정체자'])}</div>
      <p class="pinyin">${escapeHtml(d['병음'])}</p>
      <p class="desc"><strong>직역:</strong> ${escapeHtml(d['직역'])}</p>
      <p class="desc">${escapeHtml(d['현대적 해석'])}</p>
      <div class="chips">${makeChips(d['전략태그목록'])}</div>
    </article>`).join('');
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click',()=>selectCard(Number(card.dataset.id)));
    card.addEventListener('keydown',(e)=>{ if(e.key==='Enter') selectCard(Number(card.dataset.id)); });
  });
}
function selectCard(id){
  selectedId = id;
  const d = allData.find(x=>x['계번호']===id);
  if(!d) return;
  $('detailTitle').innerHTML = `제${d['계번호']}계 ${escapeHtml(d['한글명'])} <span class="hanzi">${escapeHtml(d['정체자'])}</span>`;
  $('detailBody').classList.remove('empty');
  $('detailBody').innerHTML = `
    <div class="detail-box"><h3>원전 구절</h3><p>${escapeHtml(d['원전 구절'])}</p></div>
    <div class="detail-box"><h3>대표 출처/고사</h3><p>${escapeHtml(d['대표 출처/고사'])}</p><p><strong>출처유형:</strong> ${escapeHtml(d['출처유형'])}</p></div>
    <div class="detail-box"><h3>현대적 해석</h3><p>${escapeHtml(d['현대적 해석'])}</p></div>
    <div class="detail-box"><h3>의미적 통찰</h3><p>${escapeHtml(d['의미적 통찰'])}</p></div>
    <div class="detail-box"><h3>전략 태그</h3><div class="chips">${makeChips(d['전략태그목록'])}</div></div>
    <div class="detail-box"><h3>적용 분야</h3><div class="chips">${makeChips(d['적용분야목록'])}</div></div>
    <div class="detail-box full"><h3>참고 URL</h3><p><a href="${escapeHtml(d['공통 출처 URL'])}" target="_blank" rel="noreferrer">공통 출처</a> · <a href="${escapeHtml(d['보조 출처 URL'])}" target="_blank" rel="noreferrer">보조 출처</a></p></div>`;
  renderCards();
  location.hash = 'detail';
}
function renderMatrix(){
  const families = uniq(allData.map(d=>d['계열']));
  $('matrixGrid').innerHTML = families.map(f=>{
    const items = allData.filter(d=>d['계열']===f).sort((a,b)=>a['계번호']-b['계번호']);
    return `<article class="matrix-card"><h3>${escapeHtml(f)}</h3><div class="matrix-list">${items.map(d=>`<div class="matrix-item"><span>${d['계번호']}</span><span>${escapeHtml(d['한글명'])} · ${escapeHtml(d['정체자'])}</span></div>`).join('')}</div></article>`;
  }).join('');
}
['searchInput','familyFilter','domainFilter','sortSelect'].forEach(id => $(id).addEventListener('input', renderCards));
$('resetBtn').addEventListener('click',()=>{ $('searchInput').value=''; $('familyFilter').value=''; $('domainFilter').value=''; $('sortSelect').value='number'; renderCards(); });
loadData().catch(err=>{ console.error(err); $('cardGrid').innerHTML='<p>데이터를 불러오지 못했습니다. GitHub Pages 또는 로컬 웹서버에서 실행하십시오.</p>'; });
