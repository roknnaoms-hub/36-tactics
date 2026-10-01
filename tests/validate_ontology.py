"""Validate semantic integrity, source fidelity, cardinalities, and JSON-LD alignment."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
g=json.loads((root/'data/ontology.json').read_text())
raw=json.loads((root/'data/stratagems.json').read_text())
nodes={n['id']:n for n in g['nodes']}
assert len(nodes)==len(g['nodes']), 'Duplicate node ID'
classes={c['id'] for c in g['schema']['classes']}
rels={r['id']:r for r in g['schema']['relations']}
assert len({e['id'] for e in g['edges']})==len(g['edges'])
seen=set()
for e in g['edges']:
    assert e['source'] in nodes and e['target'] in nodes
    r=rels[e['relation']]
    assert nodes[e['source']]['type']==r['domain']
    assert nodes[e['target']]['type']==r['range']
    assert e['evidence'] and e['sourceDataset']
    assert (e['status']=='interpretation')==(e['relation'] in ['usesPrinciple','suitedTo'])
    triple=(e['source'],e['relation'],e['target']);assert triple not in seen;seen.add(triple)
for n in nodes.values():assert n['type'] in classes
strat=[n for n in nodes.values() if n['type']=='Stratagem']
assert len(strat)==36
assert sorted(n['number'] for n in strat)==list(range(1,37))
for n in strat:
    assert n['original']==next(d for d in raw if d['계번호']==n['number'])
    outgoing=[e for e in g['edges'] if e['source']==n['id']]
    for relation in ['belongsTo','suitedTo','illustratedBy','cites']:
        assert sum(e['relation']==relation for e in outgoing)==1
    assert sum(e['relation']=='usesPrinciple' for e in outgoing)>=1
    for relation,key in [('hasTag','전략태그목록'),('appliesTo','적용분야목록')]:
        assert {nodes[e['target']]['label'] for e in outgoing if e['relation']==relation}==set(n['original'][key])
for family in [n for n in nodes.values() if n['type']=='Family']:
    assert sum(e['target']==family['id'] for e in g['edges'])==6
ld=json.loads((root/'data/ontology.jsonld').read_text())
ldnodes={n['@id']:n for n in ld['@graph']}
for e in g['edges']:
    assert e['target'] in ldnodes[e['source']][e['relation']]
    assert ldnodes[e['id']]['evidence']==e['evidence']
print(f'PASS: {len(strat)} source records preserved; {len(nodes)} nodes; {len(seen)} typed, evidenced relations; JSON-LD aligned.')
