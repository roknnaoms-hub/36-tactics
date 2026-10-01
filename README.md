# 병법36계 · 온톨로지 지식그래프

기존 36계 데이터 포털을 8개 클래스, 264개 개체, 433개 의미 관계로 전환한 정적 웹사이트입니다.

**사이트:** https://roknnaoms-hub.github.io/36-tactics/

## 주요 기능

- **계열 지도:** 6계열과 36계의 전체 구조 탐색
- **원리 지도:** 10개 전략 원리를 경유하는 계책 간 연결 시각화
- **선택 중심:** 계책·개념별 1~2단계 관계 탐색, 확대·이동·노드 선택
- **상세 패널:** 원문, 고사, 출처유형, 현대적 해석, 통찰, 관계별 근거
- **관계 경로:** 두 계책의 최단 연결 및 관계 방향·근거 확인
- **36계 탐색:** 기존 검색·계열/분야 필터·정렬·6대 계열 매트릭스
- **온톨로지 구조:** 클래스·관계 스키마·검색 가능한 명제 표
- 데스크톱·모바일 반응형 화면, 기본 한글 글꼴, 키보드 노드 선택

원천 데이터에서 추출한 관계는 실선, 전략 원리·상황에 대한 편집 해석은 점선입니다. 고사·원전의 문헌 정확성 검증과 전략 실행 권고를 뜻하지 않습니다.

## 구조

- `data/stratagems.json`: 원본 v1.1의 36개 레코드 (보존)
- `scripts/build_ontology.py`: 원천 추출 + 명시적 편집 매핑
- `data/ontology.json`: 화면의 단일 지식 모델
- `data/ontology.jsonld`: 클래스·ObjectProperty·근거를 포함한 RDF 교환 데이터
- `assets/app.js`: 검색, 상세, 필터, BFS 경로 탐색
- `assets/graph.js`: 외부 라이브러리 없는 SVG 그래프 엔진
- `tests/validate_ontology.py`: 데이터·참조·스키마·원본 보존 검증
- `docs/ontology_architecture.md`: 클래스·관계·출처·운영 설명

## 로컬 실행

```bash
python scripts/build_ontology.py
python tests/validate_ontology.py
python -m http.server 8765
```

http://localhost:8765 에서 확인합니다. 파일을 직접 열면 브라우저의 `fetch` 제한이 있으므로 로컬 웹서버를 사용합니다. 실행에는 외부 CDN·AI API·API 키·유료 서비스가 필요하지 않습니다.

## 배포

기존 Pages 배포 경로는 `gh-pages / root`입니다. `main`과 `gh-pages`에 동일한 검증 완료 커밋을 반영합니다. 원본 CSV/JSONL/XLSX, 기존 라이선스 안내와 데이터 스키마 문서는 보존했습니다.
