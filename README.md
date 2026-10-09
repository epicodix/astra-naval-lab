# ASTRA NAVAL LAB

**GPT Astra로 만든 야마토 × 아이오와 3D 전함 시뮬레이터.**

[브라우저에서 실행](https://epicodix.github.io/astra-naval-lab/) · [유폭 장면 보기](https://epicodix.github.io/astra-naval-lab/simulator.html?preset=blast)

두 전함의 기동과 포격, 관통 피해와 탄약고 유폭을 브라우저에서 볼 수 있습니다. 사용자가 기능과 디테일을 제안하고, GPT Astra와 함께 함선 모델과 전투 로직을 구현했습니다.

## 기능

- 야마토와 아이오와의 함선 모델, 사거리와 조준 방향에 맞춰 움직이는 주포탑, 발사·재장전 연출
- 움직이는 함선을 겨냥하는 예측선, 포탄 산포와 비행 궤적, 실제 접촉 위치에 연결된 피격 판정
- 내부 관통 경로에 따른 기관·전력·급탄 설비 손상, 화재·침수와 손상통제
- 탄약고 직격 또는 손상된 급탄 구역에서 번지는 화염에 의한 유폭
- 재생·일시정지, 시간 이동과 슬로모션으로 살펴보는 전투

역사적 함선과 설비에서 착안한 **게임 모델**입니다. 관통·피해·유폭 확률은 실측 자료로 보정한 군사 시뮬레이션이 아니며, 실제 전투 결과를 예측하려는 목적이 아닙니다. 급소 관통은 적은 명중으로도 치명적인 결과를 만들 수 있지만, 단순히 명중 수가 쌓였다는 이유로 유폭시키지는 않습니다.

## 실행

이 폴더에서 아래 명령을 실행하고 [로컬 화면](http://localhost:8080)을 열면 됩니다.

```sh
python3 -m http.server 8080
```

`index.html`은 소개 화면, `simulator.html`은 함포전 화면입니다. WebGL을 지원하는 최신 데스크톱 브라우저를 권장합니다. 실행에는 npm 설치나 빌드가 필요하지 않습니다.

플레이 중에는 GPT 모델을 호출하지 않습니다. API 키, 로그인, 별도 게임 서버나 데이터베이스도 필요하지 않습니다. Three.js r128과 OrbitControls를 사용하는 정적 HTML·JavaScript 프로젝트이며, 실행 상태는 브라우저 안에서 처리합니다. 외부 CDN 의존성이 남아 있는 배포본은 최초 로딩에 인터넷 연결이 필요합니다.

### 시작 장면

| 주소 | 첫 진입 시 장면 |
| --- | --- |
| `simulator.html?preset=battle` | 6 km 근거리 교전의 시작, 4× 재생 속도 |
| `simulator.html?preset=blast` | 실제 교전에서 발생한 탄약고 유폭 직전, 0.25× 슬로모션 |
| `simulator.html?preset=maximum` | 42 km에서 최대 사거리 조우, 4× 재생 속도 |
| `simulator.html?preset=preview` | 소개 화면에 쓰는 야마토 외관 미리보기 |

전투 화면은 일시정지 상태로 열립니다. **계속 재생**을 누르면 준비된 교전을 보고, **새 교전**을 누르면 현재 설정에서 새 시드로 다시 시작합니다. 프리셋 주소별로 저장된 상태가 있으면 그 상태를 복원합니다. 프리셋을 생략하면 유폭 장면으로 시작합니다.

## 소스 수정과 재생성

함선 모델과 전투 로직은 `source/simulation.html`, 독립 실행 화면과 상태 저장은 `source/player-template.html`에 있습니다. 이를 수정한 뒤 이 폴더에서 아래 명령을 실행합니다.

```sh
python3 tools/build.py
```

Python 표준 라이브러리만 사용해 `simulator.html`을 재생성합니다. 생성된 파일을 직접 수정하면 다음 재생성 때 덮어씁니다. 소개 화면은 `index.html`과 `assets/site.css`에서 수정합니다. 소스를 바꿨을 때는 재생성한 `simulator.html`도 함께 커밋합니다.

## GitHub Pages로 공개

1. 이 폴더의 소스를 `main` 브랜치에 보관합니다.
2. `index.html`, `simulator.html`, `.nojekyll`, `assets/`를 `gh-pages` 브랜치 루트에 올립니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source**에서 **Deploy from a branch**, 브랜치는 **gh-pages**, 폴더는 **/(root)**를 선택합니다.
4. 배포가 끝나면 **Settings → Pages**에서 플레이 URL을 확인합니다. 이후 공개 파일을 바꿔 `gh-pages`에 푸시하면 갱신됩니다.

웹사이트에는 `gh-pages`의 공개 파일만 올라갑니다. README와 편집 소스는 `main`에서 읽을 수 있습니다. 추가 공개 리소스는 `assets/`에 둡니다. `.nojekyll`은 정적 HTML을 그대로 제공하도록 합니다.

설정 방식은 [GitHub Pages의 게시 소스 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)를 따릅니다. 사용자 정의 Actions 워크플로 없이 GitHub Pages의 기본 배포 기능을 사용합니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 프로젝트 소개와 시뮬레이션 진입 |
| `simulator.html` | 바로 실행할 수 있는 생성된 플레이 화면 |
| `assets/` | 소개 화면 스타일과 아이콘 |
| `source/simulation.html` | 함선 모델·전투 로직의 편집 가능한 소스 |
| `source/player-template.html` | 플레이 화면의 문서 틀과 브라우저 상태 저장 |
| `tools/build.py` | 소스를 묶어 독립 플레이 화면을 재생성 |
| `.nojekyll` | 정적 파일 배포 표시 |

**Built with GPT Astra.** A browser-based 3D Yamato vs. Iowa simulation with projectile trajectories, internal damage and magazine explosions.
