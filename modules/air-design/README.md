# 항공 설계 모듈 / Aircraft design module

기체 외형과 비행 디자인을 따로 다듬는 독립 실험실입니다. 기존 함포전 화면에 삽입하지 않으며, 함선·대공포·피해·탄도 엔진이나 함포전의 저장 상태를 가져오지 않습니다.

This is an independent aircraft and flight design lab. It does not import the naval combat engine, ship models, damage rules, shell ballistics, or naval saved state.

## 첫 단계

- 실제 특정 기체의 복제품이 아닌, 1940년대 함상 뇌격기에서 착안한 가상 기체
- 기체·날개·기관·조종석·어뢰를 가까이 살펴보는 모델 관찰
- 수평 비행, 선회, 저공 접근, 3기 편대를 확인하는 비행 실험
- 절대 시간에 따른 프로펠러·비행 자세: 일시정지와 앞뒤 시간 이동이 같은 장면을 복원

First-stage scope: a fictional carrier torpedo aircraft, part inspection, level flight, coordinated turns, low approaches, and a three-aircraft formation. It is a design-motion prototype. Anti-aircraft targeting, interception, torpedo release and ship damage belong to later modules.

## 모듈 경계

| 파일 | 책임 |
| --- | --- |
| `aircraft-model.js` | 미터 단위 기체 형상·부품·프로펠러·착륙장치 |
| `flight-motion.js` | 렌더러와 무관한 비행 위치·속도·자세·편대 샘플 |
| `scene.js` | 렌더링·관찰 카메라·부품 선택·재생 |
| `index.html`, `styles.css` | 독립 조작 화면 |

`createAircraft(THREE)` creates a standalone model. `sampleFlight(seconds, options, aircraftIndex)` returns plain data: `position`, `velocity`, `yawRad`, `pitchRad`, `rollRad`, and `speedMps`. No function reads or writes naval state.

좌표는 **1 단위 = 1 m**, 시간은 초, 각도 반환값은 라디안입니다. 기체의 +X는 기수, +Y는 위쪽, +Z는 우현입니다. 자세는 Three.js `Euler(rollRad, yawRad, pitchRad, 'YZX')`로 적용합니다. 선회는 리더 기체의 기준 속도와 뱅크각에서 계산한 등고도 경로이며, 저공 접근은 매끄러운 고도 경로입니다. 편대원은 각자의 경로에서 속도와 자세를 계산하므로 바깥쪽 기체가 더 빠르게 선회합니다. `turnRateRad`는 선회 크기이고, `yawRateRad`는 +Y축을 기준으로 부호를 가진 회전율입니다. 공력·실속·엔진 출력의 완전한 물리 모델은 아닙니다.

Units: metres and seconds, with returned angles in radians. +X is forward, +Y is up, +Z is starboard. Apply orientation as `Euler(rollRad, yawRad, pitchRad, 'YZX')`. This first version samples designed kinematic paths rather than solving aerodynamics, stalls or engine power.

향후 대공 모듈에는 기체 ID·현재 위치·속도·크기만 제공하고, 대공 모듈이 산출한 외부 사건을 별도 입력으로 받는 경계를 유지합니다. 함포전과 연결할 때도 해당 어댑터에서만 연결하며 기체 모델 내부에 함선 규칙을 넣지 않습니다.

Future anti-aircraft integration should consume aircraft IDs, positions, velocities and extents and return explicit external events through an adapter. Aircraft geometry should remain independent of naval rules.

## 실행

저장소 루트에서 `python3 -m http.server 8080`을 실행하고 `/modules/air-design/`을 엽니다. Three.js r128과 같은 버전의 OrbitControls를 CDN에서 불러옵니다. 별도의 패키지 설치는 필요 없습니다.

Serve the repository root with `python3 -m http.server 8080`, then open `/modules/air-design/`. The page uses pinned Three.js r128 and matching OrbitControls from a CDN. No package installation is required.
