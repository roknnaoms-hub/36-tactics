/* Dependency-free SVG renderer. Semantic data and navigation live in app.js. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const color={Stratagem:'#e6ce96',Family:'#8caee8',Principle:'#77c5aa',Situation:'#d8a9da',Tag:'#b9bacd',Domain:'#85c6df',Case:'#e9a795',Source:'#c6cf8c'};
  function el(tag,attrs={}){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
  class KnowledgeGraph {
    constructor(svg,onNode,onEdge){
      this.svg=svg;this.onNode=onNode;this.onEdge=onEdge;this.scale=1;this.tx=0;this.ty=0;this.drag=null;this.scene=el('g');svg.append(this.scene);
      svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?.9:1.1);},{passive:false});
      svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,tx:this.tx,ty:this.ty,moved:false,target:e.target};});
      svg.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>5){this.drag.moved=true;svg.setPointerCapture(e.pointerId);}const box=svg.getBoundingClientRect();this.tx=this.drag.tx+dx*this.width/box.width;this.ty=this.drag.ty+dy*this.height/box.height;this.transform();});
      svg.addEventListener('pointerup',()=>{this.wasDragged=this.drag?.moved;this.drag=null;});
      svg.addEventListener('pointercancel',()=>{this.drag=null;});
      this.observer=new ResizeObserver(()=>{if(this.data){this.layout();this.draw();}});this.observer.observe(svg.parentElement);
    }
    setData(nodes,edges,mode,selected,relationLabels){this.data={nodes,edges,mode,selected,relationLabels};this.layout();this.draw();this.fit();}
    layout(){
      const {nodes,edges,mode,selected}=this.data;const rect=this.svg.getBoundingClientRect();if(!rect.width)return;
      this.width=rect.width<520?700:1000;this.height=Math.max(680,this.width*rect.height/rect.width);this.svg.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);this.pos=new Map();
      if(!nodes.length)return;
      if(mode==='overview'){
        const families=nodes.filter(n=>n.type==='Family');const cols=families.length===1?1:(rect.width<520?2:3);const rows=Math.ceil(families.length/cols);const cellW=this.width/cols;const cellH=this.height/rows;
        families.forEach((f,idx)=>{const cx=cellW*(idx%cols+.5),cy=cellH*(Math.floor(idx/cols)+.5)-8;this.pos.set(f.id,{x:cx,y:cy,r:25});const items=nodes.filter(n=>n.familyId===f.id);const radius=Math.min(cellW*.33,cellH*.32,140);items.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/Math.max(items.length,1);this.pos.set(n.id,{x:cx+radius*Math.cos(a),y:cy+radius*Math.sin(a),r:rect.width<520?20:14});});});
        // Relation filters may leave isolated nodes; keep them visible in a simple grid.
        const rest=nodes.filter(n=>!this.pos.has(n.id));rest.forEach((n,i)=>this.pos.set(n.id,{x:90+(i%6)*160,y:70+Math.floor(i/6)*100,r:14}));
      }else if(mode==='focus'){
        const center=nodes.find(n=>n.id===selected)||nodes[0];const near=new Set(edges.filter(e=>e.source===center.id||e.target===center.id).flatMap(e=>[e.source,e.target]));near.delete(center.id);
        const first=nodes.filter(n=>near.has(n.id)),second=nodes.filter(n=>n.id!==center.id&&!near.has(n.id));
        const radius=second.length?Math.max(210,first.length*13):Math.max(230,first.length*21);
        const outer=Math.max(radius+180,second.length*13);const diameter=(second.length?outer:radius)*2+190;
        this.width=Math.max(1000,diameter);this.height=Math.max(diameter,this.width*rect.height/rect.width);this.svg.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);
        const cx=this.width/2,cy=this.height/2;this.pos.set(center.id,{x:cx,y:cy,r:25});
        [first,second].forEach((list,level)=>list.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/Math.max(list.length,1);const r=level?outer:radius;this.pos.set(n.id,{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a),r:n.type==='Stratagem'?15:12});}));
      }else{
        const principles=nodes.filter(n=>n.type==='Principle'),items=nodes.filter(n=>n.type==='Stratagem');
        const pts=nodes.map((n,i)=>{let x,y;if(n.type==='Principle'){const j=principles.indexOf(n);x=280+(j%3)*220;y=160+Math.floor(j/3)*150;}else{const j=items.indexOf(n),a=j*2*Math.PI/Math.max(items.length,1);x=500+400*Math.cos(a);y=this.height/2+this.height*.4*Math.sin(a);}return {id:n.id,x,y,r:n.type==='Stratagem'?14:21,vx:0,vy:0};});
        const map=new Map(pts.map(p=>[p.id,p]));
        for(let k=0;k<210;k++){
          for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));const f=Math.min(14,6000/(d*d));a.vx-=dx/d*f;a.vy-=dy/d*f;b.vx+=dx/d*f;b.vy+=dy/d*f;}
          for(const e of edges){const a=map.get(e.source),b=map.get(e.target);if(!a||!b)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-145)*.015;a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;}
          for(const p of pts){p.vx+=(500-p.x)*.002;p.vy+=(this.height/2-p.y)*.002;p.vx*=.72;p.vy*=.72;p.x=Math.min(925,Math.max(75,p.x+p.vx));p.y=Math.min(this.height-65,Math.max(65,p.y+p.vy));}
        }
        // Separate label boxes in the final viewport without shrinking their spacing.
        for(let k=0;k<180;k++){
          for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
            const a=pts[i],b=pts[j],dx=b.x-a.x,dy=b.y-a.y,ox=115-Math.abs(dx),oy=74-Math.abs(dy);
            if(ox>0&&oy>0){if(ox<oy){const step=(ox+.5)*.51*(dx>=0?1:-1);a.x-=step;b.x+=step;}else{const step=(oy+.5)*.51*(dy>=0?1:-1);a.y-=step;b.y+=step;}}
          }
          for(const p of pts){p.x=Math.max(65,Math.min(935,p.x));p.y=Math.max(50,Math.min(this.height-65,p.y));}
        }
        for(const p of pts)this.pos.set(p.id,p);
      }
    }
    draw(){
      if(!this.pos)return;this.scene.replaceChildren();const {nodes,edges,relationLabels}=this.data;const edgeGroup=el('g'),nodeGroup=el('g');this.scene.append(edgeGroup,nodeGroup);this.nodeEls=new Map();this.edgeEls=new Map();
      const defs=el('defs');const marker=el('marker',{id:'arrow',markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:'auto',markerUnits:'userSpaceOnUse'});marker.append(el('path',{d:'M0,0 L7,3.5 L0,7',fill:'#8da8ab',opacity:'.55'}));defs.append(marker);this.scene.prepend(defs);
      for(const e of edges){const a=this.pos.get(e.source),b=this.pos.get(e.target);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));const attrs={x1:a.x+dx/d*(a.r+3),y1:a.y+dy/d*(a.r+3),x2:b.x-dx/d*(b.r+5),y2:b.y-dy/d*(b.r+5)};const line=el('line',{...attrs,class:`edge ${e.status==='interpretation'?'interpretation':''}`,'marker-end':'url(#arrow)'});const hit=el('line',{...attrs,stroke:'transparent','stroke-width':12,fill:'none',class:'edge-hit','data-edge':e.id});const title=el('title');title.textContent=relationLabels[e.relation]+': '+e.evidence;hit.append(title);hit.style.cursor='pointer';hit.addEventListener('click',()=>{if(!this.wasDragged)this.onEdge(e.id);this.wasDragged=false;});edgeGroup.append(line,hit);this.edgeEls.set(e.id,line);
        if(this.data.mode==='focus'&&nodes.length<=18){const text=el('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-6,class:'edge-label'});text.textContent=relationLabels[e.relation];edgeGroup.append(text);}
      }
      for(const n of nodes){const p=this.pos.get(n.id);if(!p)continue;const g=el('g',{transform:`translate(${p.x} ${p.y})`,class:'node',tabindex:0,role:'button','aria-label':`${n.number?'제'+n.number+'계 ':''}${n.label}`,'data-id':n.id});const circle=el('circle',{r:p.r,fill:n.type==='Stratagem'?color[n.type]:'#17353e',stroke:color[n.type]});g.append(circle);if(n.number){const number=el('text',{y:3.5,class:'node-number'});number.style.fontSize=Math.max(10,this.width/this.svg.getBoundingClientRect().width*9)+'px';number.textContent=String(n.number).padStart(2,'0');g.append(number);}else{g.append(el('circle',{r:4,fill:color[n.type],stroke:'none'}));}const label=el('text',{y:p.r+17});label.style.fontSize=Math.max(13,this.width/this.svg.getBoundingClientRect().width*10)+'px';label.textContent=n.label.length>17?n.label.slice(0,16)+'…':n.label;if(n.type==='Family'||n.type==='Principle'){label.style.fontSize=Math.max(14,this.width/this.svg.getBoundingClientRect().width*11)+'px';label.setAttribute('font-weight','600');label.style.fill=color[n.type];}g.append(label);const title=el('title');title.textContent=n.label+' — '+n.description;g.append(title);g.addEventListener('click',()=>{if(!this.wasDragged)this.onNode(n.id);this.wasDragged=false;});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onNode(n.id);}});nodeGroup.append(g);this.nodeEls.set(n.id,g);}
      this.highlight(this.data.selected);this.transform();
    }
    highlight(id,pathEdges=[]){this.data.selected=id;for(const [key,g] of this.nodeEls||[])g.classList.toggle('selected',id===key);const paths=new Set(pathEdges);for(const e of this.data.edges)this.edgeEls?.get(e.id)?.classList.toggle('highlight',paths.size?paths.has(e.id):e.source===id||e.target===id);}
    transform(){this.scene.setAttribute('transform',`translate(${this.width/2+this.tx} ${this.height/2+this.ty}) scale(${this.scale}) translate(${-this.width/2} ${-this.height/2})`);}
    zoom(factor){this.scale=Math.max(.35,Math.min(4,this.scale*factor));this.transform();}
    fit(){this.scale=1;this.tx=0;this.ty=0;this.transform();}
  }
  window.KnowledgeGraph=KnowledgeGraph;window.graphColors=color;
})();
