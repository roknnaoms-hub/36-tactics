"""Compile the preserved v1.1 records and explicit editorial mappings into one graph."""
import json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='https://roknnaoms-hub.github.io/36-tactics/ontology/'
records=json.loads((ROOT/'data/stratagems.json').read_text())
classes=[('Stratagem','계책','36개 계책의 원문·해석·고사를 보존한 중심 개체'),('Family','계열','원천 데이터의 6대 분류'),('Principle','전략 원리','탐색을 위한 편집 해석; 고전 원문의 분류가 아님'),('Situation','적용 상황','비교 학습을 위한 편집 해석; 실행 권고가 아님'),('Tag','전략 태그','원천 데이터에 수록된 전략 키워드'),('Domain','적용 분야','원천 데이터의 현대적 적용 분야'),('Case','고사·사례','원천 데이터의 사례 설명; 역사적 사실 여부는 미검증'),('Source','참고 출처','원천 데이터가 제시한 참고 URL; 각 고사의 직접 증거를 뜻하지 않음')]
relations=[('belongsTo','속한다','Family','원천 계열'),('usesPrinciple','원리로 해석한다','Principle','편집 해석'),('suitedTo','상황과 연결한다','Situation','편집 해석'),('hasTag','태그를 갖는다','Tag','원천 태그'),('appliesTo','분야에 연결한다','Domain','원천 현대적 해석'),('illustratedBy','사례로 설명된다','Case','원천 고사'),('cites','참고한다','Source','원천 URL')]
principles=[
 ('conceal','기만·은폐','관찰되는 모습과 실제 의도 사이의 차이를 분석합니다.'),
 ('indirect','간접 접근','정면 대응 이외의 경로와 외부 자원의 관계를 분석합니다.'),
 ('timing','시간·기회','대기, 완급과 상황 변화의 시점을 비교합니다.'),
 ('resource','자원·보존','손실과 우선순위, 지속 가능한 자원 배분을 분석합니다.'),
 ('perception','인식·심리','신뢰, 기대, 주의와 판단의 상호작용을 살펴봅니다.'),
 ('information','정보·탐색','관찰, 반응, 정보의 신뢰성과 검증 구조를 살펴봅니다.'),
 ('conditions','조건·환경 전환','경쟁이 벌어지는 조건과 맥락의 변화를 분석합니다.'),
 ('structure','핵심·구조','전체를 지탱하는 요소와 의존 관계를 분석합니다.'),
 ('initiative','주도권·관계','주체 사이의 영향력과 관계 변화에 주목합니다.'),
 ('combination','연계·복합','여러 행동과 효과가 연결되는 구조를 살펴봅니다.')]
# Deliberate editorial mappings. Every assertion is marked as interpretation.
mapping={1:['conceal','perception'],2:['indirect','structure'],3:['indirect','resource'],4:['timing','resource'],5:['timing','conditions'],6:['conceal','perception'],7:['perception','conceal'],8:['indirect','conceal'],9:['timing','information'],10:['conceal','perception'],11:['resource','structure'],12:['timing','resource'],13:['information','perception'],14:['resource','conditions'],15:['conditions','indirect'],16:['timing','perception'],17:['perception','resource'],18:['structure','initiative'],19:['structure','resource'],20:['information','conditions'],21:['conceal','resource'],22:['conditions','initiative'],23:['initiative','indirect'],24:['indirect','initiative'],25:['structure','conceal'],26:['perception','initiative'],27:['conceal','timing'],28:['conditions','initiative'],29:['perception','resource'],30:['initiative','structure'],31:['perception','information'],32:['perception','conceal'],33:['information','conceal'],34:['perception','resource'],35:['combination','conceal'],36:['resource','timing']}
situations=[('승전계','우세·준비','보유한 여유와 준비를 어떻게 활용하는가'),('적전계','대치·균형','상대와 맞서는 상황에서 무엇을 바꾸는가'),('공전계','접근·돌파','진전을 가로막는 조건을 어떻게 이해하는가'),('혼전계','혼란·변동','복잡한 관계와 변화 속에서 무엇을 관찰하는가'),('병전계','주도권 경쟁','관계와 구조에서 주도권은 어떻게 이동하는가'),('패전계','열세·위기','손실을 줄이고 선택지를 어떻게 보존하는가')]
nodes=[];edges=[]
def node(i,t,label,description='',**kw):
    n={'id':i,'type':t,'label':label,'description':description,**kw};nodes.append(n);return n
def edge(s,r,t,evidence,status='dataset'):
    edges.append({'id':f'e{len(edges)+1:04}','source':s,'relation':r,'target':t,'status':status,'evidence':evidence,'sourceDataset':'data/stratagems.json'})
def slug(value):return hashlib.sha256(value.encode()).hexdigest()[:12]
for i,(fam,label,desc) in enumerate(situations,1):
    node(f'family-{i}','Family',fam,f'제{(i-1)*6+1}계–제{i*6}계',order=i)
    node(f'situation-{i}','Situation',label,desc,status='interpretation')
for key,label,desc in principles:node('principle-'+key,'Principle',label,desc,status='interpretation')
for typ,field,prefix in [('Tag','전략태그목록','tag'),('Domain','적용분야목록','domain')]:
    for v in sorted({v for d in records for v in d[field]}):node(prefix+'-'+slug(v),typ,v,f'원천 데이터의 {field}에서 추출',status='dataset')
urls=sorted({d['공통 출처 URL'] for d in records})
for url in urls:node('source-'+slug(url),'Source','Thirty-Six Stratagems 개요',url,url=url,status='unverified_reference')
for d in records:
    num=d['계번호'];sid=f'stratagem-{num:02}';family=next(i for i,x in enumerate(situations,1) if x[0]==d['계열'])
    node(sid,'Stratagem',d['한글명'],d['직역'],number=num,familyId=f'family-{family}',original=d)
    node(f'case-{num:02}','Case',d['한글명']+' 고사',d['대표 출처/고사'],sourceType=d['출처유형'],status='unverified_case')
    edge(sid,'belongsTo',f'family-{family}',f'원천 필드 계열: {d["계열"]}')
    for key in mapping[num]:
        edge(sid,'usesPrinciple','principle-'+key,f'전략태그({", ".join(d["전략태그목록"])})와 현대적 해석을 바탕으로 연결한 편집 분류입니다. 고전 원문의 직접 명제가 아닙니다.','interpretation')
    edge(sid,'suitedTo',f'situation-{family}',f'{d["계열"]}의 학습 맥락을 설명하는 편집 분류입니다. 적합성 검증이나 자동 실행 권고가 아닙니다.','interpretation')
    for v in d['전략태그목록']:edge(sid,'hasTag','tag-'+slug(v),'원천 필드 전략태그목록: '+v)
    for v in d['적용분야목록']:edge(sid,'appliesTo','domain-'+slug(v),'원천 필드 적용분야목록: '+v+' (현대적 해석)')
    edge(sid,'illustratedBy',f'case-{num:02}','원천 필드 대표 출처/고사; 출처유형: '+d['출처유형']+'; 직접 문헌 대조 미실시')
    edge(sid,'cites','source-'+slug(d['공통 출처 URL']),'원천 필드 공통 출처 URL; 개별 고사의 직접 증거로 검증되지 않았습니다.')
metadata={'version':'2.0.0','date':'2026-10-01','namespace':BASE,'sourceVersion':'v1.1','sourceCommit':'6cd06fef813793017810d3dfc1d5c783688523c8','sourceSha256':hashlib.sha256((ROOT/'data/stratagems.json').read_bytes()).hexdigest(),'method':'원천 필드 추출과 명시적 편집 매핑. 외부 AI 호출 및 자동 사실 추론 없음.','notice':'고사·원문은 원천 데이터 수록 내용을 보존했으며 문헌 진위 검증을 뜻하지 않습니다. 전략 원리·적용 상황은 편집 해석입니다.'}
schema={'classes':[{'id':i,'label':l,'description':d} for i,l,d in classes],'relations':[{'id':i,'label':l,'domain':'Stratagem','range':r,'basis':b} for i,l,r,b in relations]}
graph={'metadata':metadata,'schema':schema,'nodes':nodes,'edges':edges}
(ROOT/'data/ontology.json').write_text(json.dumps(graph,ensure_ascii=False,indent=2)+'\n')
context={'@base':BASE,'@vocab':BASE,'rdfs':'http://www.w3.org/2000/01/rdf-schema#','rdf':'http://www.w3.org/1999/02/22-rdf-syntax-ns#','owl':'http://www.w3.org/2002/07/owl#','prov':'http://www.w3.org/ns/prov#','label':'rdfs:label','description':'rdfs:comment','domain':{'@id':'rdfs:domain','@type':'@id'},'range':{'@id':'rdfs:range','@type':'@id'}}
context.update({r[0]:{'@id':BASE+r[0],'@type':'@id'} for r in relations})
linked=[{'@id':c['id'],'@type':'owl:Class','label':c['label'],'description':c['description']} for c in schema['classes']]
linked += [{'@id':r['id'],'@type':'owl:ObjectProperty','label':r['label'],'domain':r['domain'],'range':r['range']} for r in schema['relations']]
for n in nodes:
    item={'@id':n['id'],'@type':n['type'],'label':n['label'],'description':n['description']}
    for e in edges:
        if e['source']==n['id']:item.setdefault(e['relation'],[]).append(e['target'])
    linked.append(item)
# Reified assertions retain evidence and distinguish extraction from interpretation.
for e in edges:linked.append({'@id':e['id'],'@type':'rdf:Statement','rdf:subject':{'@id':e['source']},'rdf:predicate':{'@id':e['relation']},'rdf:object':{'@id':e['target']},'evidence':e['evidence'],'status':e['status'],'prov:wasDerivedFrom':{'@id':'https://github.com/roknnaoms-hub/36-tactics/blob/'+metadata['sourceCommit']+'/data/stratagems.json'}})
(ROOT/'data/ontology.jsonld').write_text(json.dumps({'@context':context,'@graph':linked},ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(nodes)} nodes / {len(edges)} relations / {len(classes)} classes')
