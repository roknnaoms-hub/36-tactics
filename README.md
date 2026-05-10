# 삼십육계 전략 데이터 포털

GitHub Pages에 바로 올릴 수 있는 정적 웹포털입니다. 별도 빌드 도구 없이 `index.html`을 기준으로 실행됩니다.

## 구성

```text
.
├── index.html
├── assets/
│   ├── app.js
│   └── style.css
├── data/
│   ├── stratagems.json
│   ├── 삼십육계_확장데이터셋_v1.1_출처_통찰.csv
│   ├── 삼십육계_확장데이터셋_v1.1_출처_통찰.jsonl
│   └── 삼십육계_확장데이터셋_v1.1_출처_통찰.xlsx
└── docs/
    └── data_schema.md
```

## 주요 기능

- 삼십육계 36개 항목 카드형 탐색
- 계열, 적용분야, 키워드 검색 필터
- 계번호·계열·한글명 정렬
- 원전 구절, 대표 출처/고사, 출처유형, 전략태그, 현대적 해석, 의미적 통찰 상세 보기
- CSV, JSONL, Excel 원본 다운로드 링크
- GitHub Pages 정적 배포 지원

## GitHub Pages 배포

`main` 브랜치에 push하면 `.github/workflows/pages.yml` 워크플로가 정적 파일을 GitHub Pages로 배포합니다.

수동 설정이 필요한 경우 저장소 메뉴에서 **Settings → Pages**로 이동한 뒤 Source를 `GitHub Actions`로 선택합니다.

## 로컬 확인

브라우저에서 `index.html`을 직접 열면 일부 환경에서 `fetch()` 제한이 발생할 수 있습니다. 아래처럼 간단한 로컬 서버로 확인하십시오.

```bash
python -m http.server 8080
```

그 다음 브라우저에서 `http://localhost:8080`에 접속합니다.

## 데이터 갱신 방법

1. `data/stratagems.json`을 동일한 필드 구조로 갱신합니다.
2. 원본 CSV/JSONL/XLSX 파일도 `data/` 폴더에 교체합니다.
3. `계번호`는 숫자 1~36, `전략태그목록`과 `적용분야목록`은 배열 형식을 유지합니다.

## 인코딩

모든 파일은 UTF-8 기준입니다. 한글 깨짐 방지를 위해 HTML에 `<meta charset="utf-8">`을 적용했습니다.
