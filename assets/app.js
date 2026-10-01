(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'#';}catch{return '#';}};
  let graph,nodes,edges,byId,adj,relationMap,classMap,engine,selected='stratagem-02',triplePage=0;
  const SIZE=12;
  const getNodes=type=>nodes.filter(n=>n.type===type);
  const nodeButton=(n,cls='')=>`<button class="${cls}" data-node="${esc(n.id)}">${esc(n.label)}</button>`;
  const displayName=n=>(n.number?String(n.number).padStart(2,'0')+' · ':'')+n.label;
  const outgoing=id=>(adj.get(id)||[]).filter(e=>e.source===id);
  function setTab(id,update=true){if(!['graph','catalog','architecture'].includes(id))id='graph';document.querySelectorAll('.tab-panel').forEach(e=>e.hidden=e.id!==id);document.querySelectorAll('[data-tab]').forEach(e=>{e.classList.toggle('active',e.dataset.tab===id);e.setAttribute('aria-current',e.dataset.tab===id?'page':'false');});if(update)history.replaceState(null,'','#'+id);if(id==='graph'&&engine)requestAnimationFrame(()=>{engine.layout();engine.draw();});}
  function selectNode(id,switchTab=false){if(!byId.has(id))return;selected=id;renderDetail();if(switchTab){setTab('graph');$('graphMode').value='focus';$('graphFamily').value='';$('depth').value='1';resetRelationChecks();renderGraph();$('graph').scrollIntoView({block:'start'});}else engine.highlight(id);}
  function resetRelationChecks(){document.querySelectorAll('[data-relation]').forEach(e=>e.checked=true);}
  function hydrate(){
    $('nodeCount').textContent=nodes.length;$('edgeCount').textContent=edges.length;
    const familyOptions=getNodes('Family').map(n=>`<option value="${n.id}">${esc(n.label)}</option>`).join('');
    $('graphFamily').insertAdjacentHTML('beforeend',familyOptions);$('familyFilter').insertAdjacentHTML('beforeend',familyOptions);
    $('domainFilter').insertAdjacentHTML('beforeend',getNodes('Domain').sort((a,b)=>a.label.localeCompare(b.label,'ko')).map(n=>`<option value="${n.id}">${esc(n.label)}</option>`).join(''));
    for(const r of graph.schema.relations){const type=r.range;$('relationFilters').insertAdjacentHTML('beforeend',`<label class="relation-option"><input type="checkbox" data-relation="${r.id}" checked><span class="dot" style="background:${window.graphColors[type]}"></span>${esc(classMap[type].label)}${r.basis==='편집 해석'?' · 해석':''}</label>`);}
    const opts=getNodes('Stratagem').map(n=>`<option value="${n.id}">${esc(displayName(n))}</option>`).join('');$('pathStart').innerHTML=opts;$('pathEnd').innerHTML=opts;$('pathStart').value='stratagem-02';$('pathEnd').value='stratagem-19';
  }
  function renderGraph(){
    const mode=$('graphMode').value,family=$('graphFamily').value,allowed=new Set([...document.querySelectorAll('[data-relation]:checked')].map(e=>e.dataset.relation));
    $('focusSettings').hidden=mode!=='focus';
    const scopeNodes=nodes.filter(n=>!family||n.type!=='Stratagem'||n.familyId===family);const scope=new Set(scopeNodes.map(n=>n.id));
    let ee=edges.filter(e=>allowed.has(e.relation)&&scope.has(e.source)&&scope.has(e.target)),nn;
    if(mode==='overview'){
      nn=scopeNodes.filter(n=>n.type==='Stratagem'||(n.type==='Family'&&(!family||n.id===family)));ee=ee.filter(e=>e.relation==='belongsTo');
    }else if(mode==='semantic'){
      ee=ee.filter(e=>e.relation==='usesPrinciple');const ids=new Set(ee.flatMap(e=>[e.source,e.target]));nn=scopeNodes.filter(n=>ids.has(n.id));
    }else{
      const seen=new Set(scope.has(selected)?[selected]:[]);let front=[...seen];const depth=Number($('depth').value);
      for(let i=0;i<depth;i++){const next=[];for(const id of front)for(const e of adj.get(id)||[]){if(!allowed.has(e.relation)||!scope.has(e.source)||!scope.has(e.target))continue;const other=e.source===id?e.target:e.source;if(!seen.has(other)){seen.add(other);next.push(other);}}front=next;}
      nn=scopeNodes.filter(n=>seen.has(n.id));ee=ee.filter(e=>seen.has(e.source)&&seen.has(e.target));
    }
    const title={overview:'계열 지도',semantic:'원리 지도',focus:'선택 중심 · '+byId.get(selected).label};$('viewTitle').textContent=title[mode];$('viewCount').textContent=`${nn.length}개 개체 · ${ee.length}개 관계`;
    $('graphEmpty').hidden=ee.length>0;$('graphEmpty').textContent=nn.length===0&&mode==='focus'?'선택 개체가 현재 계열 범위에 없습니다. 전체 계열로 변경해 주십시오.':'표시할 관계가 없습니다. 관계 필터 또는 계열 범위를 변경하십시오.';
    $('graphNotice').textContent={overview:'계열은 원천 데이터의 분류입니다.',semantic:'점선: 전략 원리에 대한 편집 해석',focus:'실선: 원천 필드 · 점선: 편집 해석'}[mode];
    const types=[...new Set(nn.map(n=>n.type))];$('graphLegend').innerHTML=types.map(t=>`<span><i class="dot" style="background:${window.graphColors[t]}"></i>${esc(classMap[t].label)}</span>`).join('');
    engine.setData(nn,ee,mode,selected,Object.fromEntries(Object.entries(relationMap).map(([k,v])=>[k,v.label])));
  }
  function renderDetail(){
    const n=byId.get(selected),rel=adj.get(n.id)||[],out=outgoing(n.id);
    let html=`<div class="detail-kicker"><span class="dot" style="background:${window.graphColors[n.type]}"></span>${esc(classMap[n.type].label)}${n.number?' / 제'+n.number+'계':''}</div><h3>${esc(n.label)}</h3>`;
    if(n.original){const d=n.original;html+=`<div class="hanzi">${esc(d['정체자'])}</div><p>${esc(d['병음'])} · ${esc(d['계열'])}</p>`;}
    html+=`<p class="definition">${esc(n.description)}</p><div class="detail-actions"><button id="focusNode" class="button primary">이 노드 중심으로</button><button id="showCatalog">36계 탐색</button></div>`;
    if(n.original){const d=n.original;
      for(const [name,r] of [['전략 원리','usesPrinciple'],['적용 상황','suitedTo'],['전략 태그','hasTag'],['적용 분야','appliesTo']])html+=`<h4>${name}${['usesPrinciple','suitedTo'].includes(r)?' <small>· 편집 해석</small>':''}</h4><div>${out.filter(e=>e.relation===r).map(e=>nodeButton(byId.get(e.target),'chip')).join('')}</div>`;
      html+=`<h4>현대적 해석</h4><p>${esc(d['현대적 해석'])}</p><h4>의미적 통찰</h4><p>${esc(d['의미적 통찰'])}</p><details open><summary>원전 구절 · 고사 · 출처</summary><p>${esc(d['원전 구절'])}</p><h4>대표 출처/고사</h4><p>${esc(d['대표 출처/고사'])}</p><p class="evidence-note">출처유형: ${esc(d['출처유형'])}<br>원천 데이터 수록 내용 · 문헌 대조 미실시</p><p><a href="${safeURL(d['공통 출처 URL'])}" target="_blank" rel="noopener noreferrer">공통 참고자료 ↗</a></p></details>`;
    }else{
      if(n.status==='interpretation')html+='<p class="evidence-note">연결 탐색을 위한 편집 해석입니다. 원전의 직접 분류 또는 적용 효과의 검증을 뜻하지 않습니다.</p>';
      if(n.type==='Case')html+=`<p class="evidence-note">출처유형: ${esc(n.sourceType)}<br>원천 데이터 보존 · 문헌 대조 미실시</p>`;
      if(n.url)html+=`<p><a href="${safeURL(n.url)}" target="_blank" rel="noopener noreferrer">참고자료 열기 ↗</a></p><p class="evidence-note">공통 개요 자료입니다. 각 고사의 직접 증거로 검증되지 않았습니다.</p>`;
    }
    html+=`<h4>연결 관계 <span class="muted">${rel.length}개</span></h4><div class="connections">`+rel.map(e=>{const other=byId.get(e.source===n.id?e.target:e.source);return `<div><button class="connection" data-node="${esc(other.id)}"><small>${esc(e.source===n.id?relationMap[e.relation].label:'← '+relationMap[e.relation].label)} · ${e.status==='interpretation'?'편집 해석':'원천 필드'}</small><span>${esc(displayName(other))} ↗</span></button><details><summary>연결 근거</summary><p class="relation-evidence">${esc(e.evidence)}</p></details></div>`;}).join('')+'</div>';
    $('nodeDetail').innerHTML=html;
    $('focusNode').onclick=()=>{$('graphMode').value='focus';$('graphFamily').value='';renderGraph();};$('showCatalog').onclick=()=>setTab('catalog');
  }
  function showEdge(id){const e=edges.find(e=>e.id===id);if(!e)return;const a=byId.get(e.source),b=byId.get(e.target);$('nodeDetail').innerHTML=`<p class="eyebrow">RELATION EVIDENCE</p><h3>연결 근거</h3><p class="definition">${esc(a.label)} → ${esc(relationMap[e.relation].label)} → ${esc(b.label)}</p><p class="evidence-note">${e.status==='interpretation'?'편집 해석':'원천 데이터 필드에서 추출'}</p><p>${esc(e.evidence)}</p><h4>관계 스키마</h4><p>${esc(classMap[relationMap[e.relation].domain].label)} → ${esc(classMap[relationMap[e.relation].range].label)}</p><h4>연결 개체</h4>${nodeButton(a,'chip')}${nodeButton(b,'chip')}<h4>원천 파일</h4><p>data/stratagems.json · ${esc(graph.metadata.sourceVersion)}</p>`;engine.highlight(selected,[id]);}
  function renderCards(){const q=$('searchInput').value.trim().toLowerCase(),family=$('familyFilter').value,domain=$('domainFilter').value;let list=getNodes('Stratagem').filter(n=>(!q||Object.values(n.original).flat().join(' ').toLowerCase().includes(q))&&(!family||n.familyId===family)&&(!domain||outgoing(n.id).some(e=>e.target===domain)));const sort=$('sortSelect').value;if(sort==='name')list.sort((a,b)=>a.label.localeCompare(b.label,'ko'));else list.sort((a,b)=>a.number-b.number);$('resultCount').textContent=list.length;
    $('cardGrid').innerHTML=list.length?list.map(n=>{const d=n.original;return `<article class="card"><div class="card-top"><span class="num">${String(n.number).padStart(2,'0')}</span><span>${esc(d['계열'])}</span></div><h3>${esc(n.label)}</h3><div class="hanzi">${esc(d['정체자'])}</div><p>${esc(d['직역'])}</p><p>${esc(d['현대적 해석'])}</p><div>${d['전략태그목록'].map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div><button data-open="${n.id}">상세 내용과 지식그래프 보기 ↗</button></article>`;}).join(''):'<p class="muted">검색 조건에 맞는 계책이 없습니다. 검색어 또는 필터를 변경하십시오.</p>';
  }
  function renderMatrix(){$('matrixGrid').innerHTML=getNodes('Family').map(f=>`<article class="matrix-card"><h4>${esc(f.label)}</h4><p>${esc(f.description)}</p>${getNodes('Stratagem').filter(n=>n.familyId===f.id).map(n=>`<button data-open="${n.id}">${String(n.number).padStart(2,'0')} ${esc(n.label)} · ${esc(n.original['정체자'])}</button>`).join('')}</article>`).join('');}
  function renderArchitecture(){
    $('classList').innerHTML=graph.schema.classes.map(c=>`<div class="class-row"><i class="dot" style="background:${window.graphColors[c.id]}"></i><div><strong>${esc(c.label)}<small>${c.id}</small></strong><p>${esc(c.description)}</p></div><b>${getNodes(c.id).length}</b></div>`).join('');
    $('schemaList').innerHTML=graph.schema.relations.map(r=>`<div class="schema-row"><div>${esc(r.label)}<code>${r.id}</code></div><div>계책 → ${esc(classMap[r.range].label)}<small>${esc(r.basis)}</small></div></div>`).join('');renderTriples();
  }
  function renderTriples(){const q=$('tripleSearch').value.trim().toLowerCase();const filtered=edges.filter(e=>[byId.get(e.source).label,byId.get(e.target).label,relationMap[e.relation].label,e.relation,e.status==='interpretation'?'편집 해석':'원천 필드'].join(' ').toLowerCase().includes(q));const pages=Math.max(1,Math.ceil(filtered.length/SIZE));triplePage=Math.min(triplePage,pages-1);$('tripleBody').innerHTML=filtered.slice(triplePage*SIZE,(triplePage+1)*SIZE).map(e=>`<tr><td>${nodeButton(byId.get(e.source))}</td><td><button data-edge="${e.id}">${esc(relationMap[e.relation].label)}</button></td><td>${nodeButton(byId.get(e.target))}</td><td>${e.status==='interpretation'?'편집 해석':'원천 필드'}</td></tr>`).join('')||'<tr><td colspan="4">검색 결과가 없습니다.</td></tr>';$('triplePage').textContent=`${triplePage+1} / ${pages} 페이지 · ${filtered.length}개 명제`;$('prevTriples').disabled=triplePage===0;$('nextTriples').disabled=triplePage===pages-1;}
  function findPath(start,end){const allowed=new Set(['belongsTo','usesPrinciple','hasTag','appliesTo','suitedTo']);const queue=[start],seen=new Map([[start,null]]);for(let i=0;i<queue.length;i++){const id=queue[i];if(id===end)break;const links=[...(adj.get(id)||[])].filter(e=>allowed.has(e.relation)).sort((a,b)=>(a.relation==='usesPrinciple'?-1:0)-(b.relation==='usesPrinciple'?-1:0));for(const e of links){const other=e.source===id?e.target:e.source;if(!seen.has(other)){seen.set(other,{previous:id,edge:e});queue.push(other);}}}if(!seen.has(end))return null;const pathNodes=[end],pathEdges=[];let curr=end;while(curr!==start){const step=seen.get(curr);pathEdges.unshift(step.edge);curr=step.previous;pathNodes.unshift(curr);}return {nodes:pathNodes,edges:pathEdges};}
  function showPath(e){e.preventDefault();const start=$('pathStart').value,end=$('pathEnd').value;const path=findPath(start,end);if(!path){$('pathResult').textContent='두 계책 사이에 연결 경로가 없습니다.';return;}
    if(start===end){$('pathResult').innerHTML='<p>출발과 도착이 같습니다. 다른 계책을 선택하면 연결을 비교할 수 있습니다.</p>';return;}
    $('pathResult').innerHTML='<div class="path-chain">'+path.nodes.map((id,i)=>{const edge=path.edges[i];const forward=edge&&edge.source===id;return nodeButton(byId.get(id))+(edge?`<span class="path-step">${forward?'→':'←'} ${esc(relationMap[edge.relation].label)} ${forward?'→':'←'}</span>`:'');}).join('')+`</div><p>${path.edges.length}개 관계를 경유합니다. 경로는 관계망의 연결이며 인과관계나 적용 순서를 의미하지 않습니다. 화면 필터와 독립적으로 전체 온톨로지에서 탐색합니다.</p>`;
    $('pathResult').insertAdjacentHTML('beforeend',path.edges.map(edge=>`<details><summary>${esc(byId.get(edge.source).label)} → ${esc(relationMap[edge.relation].label)} → ${esc(byId.get(edge.target).label)} · 근거</summary><p>${esc(edge.evidence)}</p></details>`).join(''));
  }
  function bind(){
    document.querySelectorAll('[data-tab]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setTab(a.dataset.tab);}));window.addEventListener('hashchange',()=>setTab(location.hash.slice(1),false));
    document.body.addEventListener('click',e=>{const node=e.target.closest('[data-node]'),open=e.target.closest('[data-open]'),edge=e.target.closest('button[data-edge]');if(node)selectNode(node.dataset.node,!$('graph').hidden?false:true);if(open)selectNode(open.dataset.open,true);if(edge){setTab('graph');showEdge(edge.dataset.edge);$('graph').scrollIntoView();}});
    ['graphMode','graphFamily','depth'].forEach(id=>$(id).addEventListener('change',renderGraph));$('relationFilters').addEventListener('change',renderGraph);
    $('graphSearch').addEventListener('input',()=>{const q=$('graphSearch').value.trim().toLowerCase();const result=q?nodes.filter(n=>[n.label,n.description,n.original?.['정체자'],n.original?.['간체자']].join(' ').toLowerCase().includes(q)):[];$('searchResults').innerHTML=!q?'':result.length?result.slice(0,10).map(n=>`<button data-search-node="${n.id}">${esc(displayName(n))}<small>${esc(classMap[n.type].label)}</small></button>`).join('')+`<p>${result.length}개 중 ${Math.min(10,result.length)}개 표시</p>`:'<p>검색 결과가 없습니다.</p>';});
    $('searchResults').addEventListener('click',e=>{const btn=e.target.closest('[data-search-node]');if(!btn)return;selectNode(btn.dataset.searchNode,true);$('searchResults').innerHTML='';});
    $('resetGraph').onclick=()=>{$('graphMode').value='overview';$('graphFamily').value='';$('depth').value='1';$('graphSearch').value='';$('searchResults').innerHTML='';resetRelationChecks();selected='stratagem-02';renderDetail();renderGraph();};
    $('zoomIn').onclick=()=>engine.zoom(1.25);$('zoomOut').onclick=()=>engine.zoom(.8);$('fitGraph').onclick=()=>engine.fit();$('fullGraph').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.querySelector('.graph-main').requestFullscreen)await document.querySelector('.graph-main').requestFullscreen();else $('graphNotice').textContent='이 브라우저는 전체 화면을 지원하지 않습니다.';}catch{$('graphNotice').textContent='전체 화면을 열 수 없습니다.';}};
    ['searchInput','familyFilter','domainFilter','sortSelect'].forEach(id=>$(id).addEventListener('input',renderCards));$('resetCatalog').onclick=()=>{$('searchInput').value='';$('familyFilter').value='';$('domainFilter').value='';$('sortSelect').value='number';renderCards();};
    $('pathForm').addEventListener('submit',showPath);$('tripleSearch').addEventListener('input',()=>{triplePage=0;renderTriples();});$('prevTriples').onclick=()=>{triplePage--;renderTriples();};$('nextTriples').onclick=()=>{triplePage++;renderTriples();};
  }
  async function init(){try{const res=await fetch('data/ontology.json?v=2.0.0');if(!res.ok)throw new Error('HTTP '+res.status);graph=await res.json();nodes=graph.nodes;edges=graph.edges;byId=new Map(nodes.map(n=>[n.id,n]));adj=new Map(nodes.map(n=>[n.id,[]]));for(const e of edges){if(!byId.has(e.source)||!byId.has(e.target))throw new Error('Invalid graph reference');adj.get(e.source).push(e);adj.get(e.target).push(e);}relationMap=Object.fromEntries(graph.schema.relations.map(r=>[r.id,r]));classMap=Object.fromEntries(graph.schema.classes.map(c=>[c.id,c]));engine=new window.KnowledgeGraph($('network'),id=>selectNode(id),showEdge);hydrate();bind();renderDetail();renderCards();renderMatrix();renderArchitecture();setTab(location.hash.slice(1),false);renderGraph();document.body.dataset.ready='true';}catch(err){console.error(err);$('loadError').hidden=false;$('viewCount').textContent='데이터 로드 실패';}}
  $('retry').onclick=()=>location.reload();init();
})();
