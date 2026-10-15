# 항공 설계 모듈 / Aircraft design module

기체 외형과 비행 디자인을 따로 다듬는 독립 실험실입니다. 기존 함포전 화면에 삽입하지 않으며, 함선·대공포·피해·탄도 엔진이나 함포전의 저장 상태를 가져오지 않습니다.

This is an independent aircraft and flight design lab. It does not import the naval combat engine, ship models, damage rules, shell ballistics, or naval saved state.

## 첫 단계

- 실제 특정 기체의 복제품이 아닌, 1940년대 함상 뇌격기에서 착안한 가상 기체
- 기체·날개·기관·조종석·어뢰를 가까이 살펴보는 모델 관찰
- 수평 비행, 선회, 저공 접근, 3기 편대를 확인하는 비행 실험
- 절대 시간에 따른 프로펠러·비행 자세: 일시정지와 앞뒤 시간 이동이 같은 장면을 복원
- 실제 장착점에서 어뢰만 분리해 중력 낙하, 입수, 직진 항주, 독립 시험 표적 명중까지 관찰
- 자동 연출·어뢰 근접·표적·전체 항로 카메라, 단계 이동, 0.25–2배 재생, 투명 수면 관찰
- 3기 V자 편대의 순차 투하, 독립된 3발의 입수·항주·명중, 편대 전체 및 개별 기체·어뢰 추적

Scope: a fictional carrier torpedo aircraft, part inspection, level flight, coordinated turns, low approaches, a three-aircraft formation, and an independent torpedo trial. The trial includes release from the actual hardpoint, ballistic fall, water entry, straight underwater propulsion and contact with a fixed test barge. Cameras, phase shortcuts, slow playback and transparent-water inspection make each stage visible. Anti-aircraft targeting and naval combat damage remain outside this module.

## 모듈 경계

| 파일 | 책임 |
| --- | --- |
| `aircraft-model.js` | 미터 단위 기체 형상·부품·프로펠러·착륙장치 |
| `flight-motion.js` | 렌더러와 무관한 비행 위치·속도·자세·편대 샘플 |
| `torpedo-model.js` | 장착대와 분리된 어뢰 형상·반대 회전 추진기 |
| `torpedo-motion.js` | 낙하·입수·수중 추진·연속 접촉 판정 |
| `torpedo-formation.js` | 단독·3기 편대의 비행 경로·실제 장착점·개별 투하 시각 |
| `torpedo-trial-view.js` | 독립 시험 표적·항적·기포·입수·명중 효과 |
| `scene.js` | 렌더링·관찰 카메라·부품 선택·재생 |
| `index.html`, `styles.css` | 독립 조작 화면 |

`createAircraft(THREE)` creates a standalone model. `sampleFlight(seconds, options, aircraftIndex)` returns plain data: `position`, `velocity`, `yawRad`, `pitchRad`, `rollRad`, and `speedMps`. No function reads or writes naval state.

좌표는 **1 단위 = 1 m**, 시간은 초, 각도 반환값은 라디안입니다. 기체의 +X는 기수, +Y는 위쪽, +Z는 우현입니다. 자세는 Three.js `Euler(rollRad, yawRad, pitchRad, 'YZX')`로 적용합니다. 선회는 리더 기체의 기준 속도와 뱅크각에서 계산한 등고도 경로이며, 저공 접근은 매끄러운 고도 경로입니다. 편대원은 각자의 경로에서 속도와 자세를 계산하므로 바깥쪽 기체가 더 빠르게 선회합니다. `turnRateRad`는 선회 크기이고, `yawRateRad`는 +Y축을 기준으로 부호를 가진 회전율입니다. 공력·실속·엔진 출력의 완전한 물리 모델은 아닙니다.

Units: metres and seconds, with returned angles in radians. +X is forward, +Y is up, +Z is starboard. Apply orientation as `Euler(rollRad, yawRad, pitchRad, 'YZX')`. This first version samples designed kinematic paths rather than solving aerodynamics, stalls or engine power.

어뢰 시험은 40 m 저공 접근, 90 m/s 기체 속도, 수중 24 m/s·수심 2 m의 가상 설정입니다. 기체의 실제 장착점 변환과 속도를 상속하고 장착대는 남깁니다. 낙하는 중력으로 계산하며, 입수 뒤에는 속도와 수심을 매끄럽게 전환합니다. 유도 없이 직진하며 이동 경로와 표적 충돌 상자의 연속 접촉으로 명중 시각을 계산합니다. 접촉 위치에서 수중 폭발·수면 물기둥·선체 반응이 시작합니다. 유체역학·실물 어뢰 성능·함선 피해를 검증하는 모델은 아닙니다. 투명 수면은 수중 몸체를 관찰하기 위한 시각화입니다.

The fictional trial uses a 40 m approach, 90 m/s aircraft speed, 24 m/s underwater cruise and 2 m running depth. Release inherits the actual hardpoint transform and velocity while retaining the rack. Gravity drives the fall; water entry transitions smoothly to cruise speed and depth. A continuous swept contact check against the target box determines impact time and position. Effects start at that contact. There is no homing, hydrodynamic solver, historical performance claim or naval damage simulation. Transparent water is an inspection visualization.

편대 시험은 날개 폭 15 m의 기체 3기가 좌우 26 m·뒤쪽 26 m 간격의 V자 편대로 접근하며, 각각 2.00 / 2.65 / 3.30초에 투하합니다. 어뢰는 평행한 독립 항로에서 Z=0 / −26 / +26 m 지점을 노립니다. 늦게 투하한 기체가 표적에 가까이 접근한 만큼 실제 명중 순서가 투하 순서와 달라질 수 있습니다. 표적 하나에 여러 접촉 사건과 효과를 누적하며, 앞뒤 시간 이동은 각 어뢰·장착 상태·피탄 흔적을 함께 복원합니다.

The formation trial uses three aircraft in a V, with wingmen 26 m behind and 26 m to either side. Releases occur at 2.00 / 2.65 / 3.30 seconds. The independent torpedoes follow parallel channels at Z=0 / −26 / +26 m without homing. Later releases occur closer to the target, so actual contact order can differ from release order. One shared barge receives independent contact events and effects. Whole-formation and individual follow controls share deterministic playback and rewind.

향후 대공 모듈에는 기체 ID·현재 위치·속도·크기만 제공하고, 대공 모듈이 산출한 외부 사건을 별도 입력으로 받는 경계를 유지합니다. 함포전과 연결할 때도 해당 어댑터에서만 연결하며 기체 모델 내부에 함선 규칙을 넣지 않습니다.

Future anti-aircraft integration should consume aircraft IDs, positions, velocities and extents and return explicit external events through an adapter. Aircraft geometry should remain independent of naval rules.

## 실행

저장소 루트에서 `python3 -m http.server 8080`을 실행하고 `/modules/air-design/`을 엽니다. Three.js r128과 같은 버전의 OrbitControls를 CDN에서 불러옵니다. 별도의 패키지 설치는 필요 없습니다.

Serve the repository root with `python3 -m http.server 8080`, then open `/modules/air-design/`. The page uses pinned Three.js r128 and matching OrbitControls from a CDN. No package installation is required.

어뢰 시험 바로 열기 / Open the torpedo trial: `/modules/air-design/?mode=torpedo&lang=ko` (or `lang=en`).

편대 시험 / Formation trial: `/modules/air-design/?mode=torpedo&formation=vee&lang=ko` (or `lang=en`).
