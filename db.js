// ─── PHILOSOPHY DATABASE ────────────────────────────────────────────
export const PHILOSOPHY_DB = {
  idealism: [
    { id:'fire_projectile', name:'이데아의 불꽃', type:'weapon', maxLevel:5, icon:'🔥',
      desc:'이데아의 빛을 화염 구체로 형상화해 주변 적에게 발사합니다.', quote:'현실은 이데아의 그림자일 뿐이다.',
      stats:[{dmg:35,cd:1400,size:25},{dmg:75,cd:1150,size:35},{dmg:250,cd:950,size:45},{dmg:500,cd:750,size:60},{dmg:870,cd:550,size:75}] },
    { id:'fire_aura', name:'이성의 오라', type:'weapon', maxLevel:5, icon:'☀️',
      desc:'뜨거운 이성의 오라로 주변 적들을 지속해서 불태웁니다.', quote:'이성에 따르라.',
      stats:[{dmg:16,radius:95,cd:500},{dmg:35,radius:120,cd:450},{dmg:65,radius:150,cd:400},{dmg:100,radius:180,cd:340},{dmg:140,radius:210,cd:280}] },
    { id:'fire_pillar', name:'은총의 스파크', type:'weapon', maxLevel:5, icon:'⚡',
      desc:'장엄한 은총의 스파크를 소환해 적들에게 광역 심판을 내립니다.', quote:'이성은 신앙 아래 완전해진다.',
      stats:[{dmg:75,interval:2200,count:1},{dmg:140,interval:1850,count:2},{dmg:220,interval:1500,count:3},{dmg:320,interval:1150,count:4},{dmg:440,interval:850,count:5}] },
    { id:'fire_sword', name:'코기토의 검', type:'weapon', maxLevel:5, icon:'⚔️',
      desc:'날카롭게 타오르는 사유의 검을 사방에 휘두릅니다.', quote:'나는 생각한다, 고로 존재한다.',
      stats:[{dmg:55,count:3,speed:6,cd:4000},{dmg:100,count:4,speed:7.5,cd:3500},{dmg:160,count:5,speed:9,cd:3000},{dmg:230,count:6,speed:11,cd:2500},{dmg:310,count:8,speed:13,cd:2000}] },
    { id:'passive_idealism_dmg', name:'이성의 광채', type:'passive', maxLevel:5, icon:'💥',
      desc:'선험적 인식의 광채로 모든 공격력을 증폭시킵니다.', quote:'순수 이성의 법칙은 확실하다.' },
    { id:'passive_idealism_area', name:'사유의 확장', type:'passive', maxLevel:5, icon:'🔮',
      desc:'시간과 공간 인식을 넓혀, 모든 공격의 작용 범위를 확장합니다.', quote:'공간은 선험적 인식의 형식이다.' },
    { id:'passive_speed', name:'이성의 신속', type:'passive', maxLevel:5, icon:'💨',
      desc:'도덕적 주체로 각성하여 이동 속도를 증가시킵니다.', quote:'자유 의지를 가진 인간은 행동의 주체다.' },
    { id:'passive_cooldown', name:'사유의 회전', type:'passive', maxLevel:5, icon:'⏱️',
      desc:'시간 흐름을 제어해 모든 스킬 쿨타임을 단축합니다.', quote:'시간은 우리 내면의 직관 속에 정돈된다.' },
    { id:'passive_regen', name:'정신적 치유', type:'passive', maxLevel:5, icon:'🩹',
      desc:'성찰과 명상을 통해 체력(HP)을 매초 지속 회복합니다.', quote:'성찰하는 영혼은 상처받지 않는다.' },
    { id:'passive_armor', name:'이성의 방패', type:'passive', maxLevel:5, icon:'🛡️',
      desc:'우상을 극복하여 받는 모든 대미지를 경감시킵니다.', quote:'논리적 의심의 방패로 편견을 물리쳐라.' }
  ],
  empiricism: [
    { id:'ice_projectile', name:'중용의 얼음 송곳', type:'weapon', maxLevel:5, icon:'❄️',
      desc:'중용의 얼음 쐐기를 발사하여 적을 관통하고 둔화시킵니다.', quote:'덕은 중용에 있다.',
      stats:[{dmg:25,pierce:2,slow:0.35,speed:8,cd:1200},{dmg:55,pierce:3,slow:0.45,speed:9.5,cd:1000},{dmg:300,pierce:4,slow:0.55,speed:11,cd:800},{dmg:650,pierce:5,slow:0.65,speed:13,cd:600},{dmg:1100,pierce:99,slow:0.75,speed:15,cd:450}] },
    { id:'ice_floor', name:'쾌락의 정원', type:'weapon', maxLevel:5, icon:'🌊',
      desc:'차가운 서리 지대를 형성하여 범위 내 적을 지속 공격합니다.', quote:'진정한 쾌락은 고통 없는 상태다.',
      stats:[{dmg:10,size:100,duration:3500,cd:1400},{dmg:20,size:135,duration:4000,cd:1200},{dmg:40,size:170,duration:4600,cd:1000},{dmg:65,size:210,duration:5300,cd:800},{dmg:95,size:250,duration:6000,cd:600}] },
    { id:'ice_freeze', name:'신학의 족쇄', type:'weapon', maxLevel:5, icon:'🧱',
      desc:'사방의 적들을 순간 얼어붙게 만들어 무력화합니다.', quote:'신앙와 이성은 서로 보완한다.',
      stats:[{dmg:50,radius:170,cd:5500,freezeTime:2000},{dmg:90,radius:200,cd:4800,freezeTime:2500},{dmg:150,radius:240,cd:4100,freezeTime:3000},{dmg:230,radius:280,cd:3400,freezeTime:3600},{dmg:320,radius:320,cd:2800,freezeTime:4200}] },
    { id:'ice_ring', name:'귀납의 고리', type:'weapon', maxLevel:5, icon:'🌀',
      desc:'귀납적 얼음 결정을 몸 주변에 회전시켜 적을 타격합니다.', quote:'아는 것이 힘이다.',
      stats:[{dmg:30,count:1,radius:65,speed:0.045},{dmg:55,count:2,radius:75,speed:0.05},{dmg:90,count:3,radius:88,speed:0.055},{dmg:140,count:4,radius:100,speed:0.065},{dmg:200,count:6,radius:115,speed:0.075}] },
    { id:'passive_empiricism_slow', name:'감각의 관찰', type:'passive', maxLevel:5, icon:'⛄',
      desc:'감각적 관찰 능력을 높여 적 이동 속도를 더 둔화시킵니다.', quote:'정신은 태어날 때 백지 상태다.' },
    { id:'passive_empiricism_xp', name:'경험의 축적', type:'passive', maxLevel:5, icon:'⭐',
      desc:'경험 데이터를 축적하여 획득 경험치를 늘립니다.', quote:'지식은 오직 경험에서 출발한다.' },
    { id:'passive_max_hp', name:'감각적 충만', type:'passive', maxLevel:5, icon:'❤️',
      desc:'육체와 정신을 다져 최대 체력(HP)을 증가시킵니다.', quote:'신체와 마음의 결합이 자아를 안정시킨다.' },
    { id:'passive_armor', name:'이성의 방패', type:'passive', maxLevel:5, icon:'🛡️',
      desc:'우상을 극복하여 받는 모든 대미지를 경감시킵니다.', quote:'논리적 의심의 방패로 편견을 물리쳐라.' },
    { id:'passive_crit_dmg', name:'감각적 통찰', type:'passive', maxLevel:5, icon:'🎯',
      desc:'실증적인 분석을 통해 크리티컬 피해를 증폭시킵니다.', quote:'날카로운 관찰만이 핵심을 관통한다.' },
    { id:'passive_regen', name:'정신적 치유', type:'passive', maxLevel:5, icon:'🩹',
      desc:'성찰과 명상을 통해 체력(HP)을 매초 지속 회복합니다.', quote:'성찰하는 영혼은 상처받지 않는다.' }
  ],
  confucianism: [
    { id:'lightning_strike', name:'인(仁)의 뇌전', type:'weapon', maxLevel:5, icon:'⚡',
      desc:'어진 마음으로 하늘의 벼락을 내려 무작위 적들을 유도 타격합니다.', quote:'덕이 있으면 외롭지 않고 반드시 이웃이 있다.',
      stats:[{dmg:45,cd:1500,count:1},{dmg:85,cd:1250,count:2},{dmg:270,cd:1000,count:3},{dmg:520,cd:800,count:4},{dmg:920,cd:600,count:6}] },
    { id:'lightning_sword', name:'의(義)의 뇌검', type:'weapon', maxLevel:5, icon:'⚔️',
      desc:'정의로운 전격의 검기를 전방으로 날려 일직선상의 적들을 베고 관통합니다.', quote:'의를 보고 행하지 않는 것은 용기가 없는 것이다.',
      stats:[{dmg:35,cd:2500,speed:9,size:45},{dmg:75,cd:2200,speed:10.5,size:60},{dmg:150,cd:1900,speed:12,size:75},{dmg:260,cd:1600,speed:14,size:90},{dmg:420,cd:1200,speed:16,size:110}] },
    { id:'lightning_beam', name:'예(禮)의 광조', type:'weapon', maxLevel:5, icon:'☀️',
      desc:'예의와 규범에 맞춰 사방으로 정교한 벼락 레이저 빔을 방출합니다.', quote:'예가 아니면 보지도 듣지도 말라.',
      stats:[{dmg:25,cd:1800,count:4},{dmg:50,cd:1600,count:6},{dmg:100,cd:1400,count:8},{dmg:180,cd:1200,count:10},{dmg:280,cd:900,count:12}] },
    { id:'lightning_orb', name:'지(智)의 혜안', type:'weapon', maxLevel:5, icon:'🔮',
      desc:'지혜의 혜안 구체가 주변을 돌다 적을 추적 폭발하여 취약하게 만듭니다.', quote:'지혜로운 사람은 당황하지 않는다.',
      stats:[{dmg:50,cd:3500,radius:90,size:30},{dmg:110,cd:3000,radius:110,size:40},{dmg:210,cd:2500,radius:130,size:50},{dmg:360,cd:2000,radius:150,size:60},{dmg:560,cd:1500,radius:170,size:75}] },
    { id:'passive_confucian_dmg', name:'기(氣)의 단련', type:'passive', maxLevel:5, icon:'💥',
      desc:'내면의 기를 올바르게 연마하여 모든 공격력을 증가시킵니다.', quote:'나는 나의 호연지기를 기른다.' },
    { id:'passive_confucian_speed', name:'군자의 신속', type:'passive', maxLevel:5, icon:'💨',
      desc:'군자의 바른 걸음걸이로 플레이어의 이동 속도를 증가시킵니다.', quote:'군자는 행동이 민첩하고 말은 신중하다.' },
    { id:'passive_confucian_cooldown', name:'율곡의 이(理)', type:'passive', maxLevel:5, icon:'⏱️',
      desc:'우주의 근본 원리인 이를 터득하여 모든 스킬 대기 시간을 단축시킵니다.', quote:'이는 스스로 그러한 근본 법칙이다.' },
    { id:'passive_confucian_area', name:'덕치(德治)의 범위', type:'passive', maxLevel:5, icon:'🔮',
      desc:'도덕의 선한 영향력을 널리 미쳐 공격 범위를 확장합니다.', quote:'덕으로 정치를 하는 것은 북극성이 제자리에 있는 것과 같다.' },
    { id:'passive_confucian_regen', name:'수기치인', type:'passive', maxLevel:5, icon:'🩹',
      desc:'자신을 닦아 백성을 편안하게 하듯 신체 생명력을 회복합니다.', quote:'자신을 닦아 백성을 편안하게 한다.' },
    { id:'passive_confucian_defense', name:'의(義)의 방패', type:'passive', maxLevel:5, icon:'🛡️',
      desc:'올곧은 정의의 방패로 적의 모든 타격 피해를 크게 줄입니다.', quote:'의로움은 인생의 올바른 길이다.' }
  ],
  taoism: [
    { id:'wind_vortex', name:'무위자연의 돌풍', type:'weapon', maxLevel:5, icon:'🌪️',
      desc:'적을 관통하며 속도를 늦추고 폭풍 중심으로 모으는 회오리를 발사합니다.', quote:'도가도비상도 명가명비상명.',
      stats:[{dmg:20,cd:1300,speed:7,size:40},{dmg:45,cd:1100,speed:8,size:55},{dmg:95,cd:900,speed:9,size:70},{dmg:190,cd:700,speed:10.5,size:90},{dmg:340,cd:500,speed:12,size:110}] },
    { id:'wind_blade', name:'물아일체의 풍도', type:'weapon', maxLevel:5, icon:'💨',
      desc:'자연과 동화된 예리한 바람 칼날들을 연속 방출하여 적들을 가릅니다.', quote:'하늘과 땅은 나와 함께 태어났고 만물은 나와 하나다.',
      stats:[{dmg:30,cd:2000,speed:10,count:2},{dmg:60,cd:1800,speed:11,count:3},{dmg:110,cd:1500,speed:12,count:4},{dmg:190,cd:1200,speed:13.5,count:5},{dmg:300,cd:900,speed:15,count:7}] },
    { id:'wind_shield', name:'상선약수의 흐름', type:'weapon', maxLevel:5, icon:'🌊',
      desc:'물과 같은 부드러운 바람 장벽을 둘러 적들을 지속 밀어내며 대미지를 줍니다.', quote:'가장 좋은 것은 물과 같다. 물은 만물을 이롭게 한다.',
      stats:[{dmg:15,cd:4000,radius:80,duration:2500},{dmg:30,cd:3600,radius:95,duration:3000},{dmg:60,cd:3200,radius:110,duration:3500},{dmg:110,cd:2700,radius:125,duration:4000},{dmg:180,cd:2000,radius:140,duration:5000}] },
    { id:'taeguk_aura', name:'태극의 조화', type:'weapon', maxLevel:5, icon:'☯️',
      desc:'플레이어 주변에 음양 마법진을 형성하여 주기적으로 광역 기폭을 일으킵니다.', quote:'음과 양의 조화가 만물의 근원이다.',
      stats:[{dmg:25,radius:110,cd:800},{dmg:50,radius:135,cd:700},{dmg:90,radius:165,cd:600},{dmg:150,radius:195,cd:500},{dmg:230,radius:225,cd:400}] },
    { id:'passive_taoist_dmg', name:'무위(無爲)의 힘', type:'passive', maxLevel:5, icon:'💥',
      desc:'인위적인 힘을 걷어내고 대자연의 본원적인 파괴력을 증가시킵니다.', quote:'함이 없으나 하지 않음이 없다.' },
    { id:'passive_taoist_speed', name:'축지법', type:'passive', maxLevel:5, icon:'💨',
      desc:'자연의 흐름을 조율하여 이동 속도를 대폭 증가시킵니다.', quote:'걸음마다 대지가 좁아지는 비술이다.' },
    { id:'passive_taoist_cooldown', name:'자연의 순환', type:'passive', maxLevel:5, icon:'⏱️',
      desc:'우주의 시간 섭리에 순응하여 모든 스킬 대기 시간을 단축시킵니다.', quote:'자연은 스스로 그러할 뿐 재촉하지 않는다.' },
    { id:'passive_taoist_area', name:'만물제동의 영역', type:'passive', maxLevel:5, icon:'🔮',
      desc:'만물을 평등하게 바라보는 마음을 펼쳐 공격 영역을 확장합니다.', quote:'만물은 다 평등하며 차별이 없다.' },
    { id:'passive_taoist_regen', name:'조식법', type:'passive', maxLevel:5, icon:'🩹',
      desc:'대자연의 숨결에 호흡을 맞춰 체력을 지속적으로 회복합니다.', quote:'천지의 정기를 들이마셔 단전을 다스린다.' },
    { id:'passive_taoist_defense', name:'무용(無用)의 용', type:'passive', maxLevel:5, icon:'🛡️',
      desc:'쓸모없어 보이나 실제 가장 큰 가치인 부드러움으로 타격을 경감합니다.', quote:'부드러움이 천하의 굳셈을 이긴다.' }
  ],
  buddhism: [
    { id:'earth_barrier', name:'해탈의 금강막', type:'weapon', maxLevel:5, icon:'🪨',
      desc:'주변을 회전하는 금강석 파편 장벽을 형성하여 접근하는 적을 밀쳐냅니다.', quote:'일체유심조, 모든 것은 마음먹기에 달렸다.',
      stats:[{dmg:30,count:2,radius:70,cd:3000},{dmg:55,count:3,radius:85,cd:2800},{dmg:90,count:4,radius:100,cd:2500},{dmg:145,count:6,radius:115,cd:2200},{dmg:220,count:8,radius:130,cd:1800}] },
    { id:'earth_quake', name:'자비의 지진', type:'weapon', maxLevel:5, icon:'🧱',
      desc:'무작위 적들의 발밑 대지에 균열을 일으켜 바위 파편 충격과 감속을 부여합니다.', quote:'대자대비한 마음으로 세상의 번뇌를 씻겨낸다.',
      stats:[{dmg:40,cd:2200,radius:90,slow:0.4},{dmg:80,cd:1900,radius:110,slow:0.45},{dmg:150,cd:1600,radius:130,slow:0.5},{dmg:250,cd:1300,radius:150,slow:0.55},{dmg:380,cd:1000,radius:170,slow:0.65}] },
    { id:'buddha_hand', name:'무량광의 장막', type:'weapon', maxLevel:5, icon:'🖐️',
      desc:'하늘에서 거대한 황금빛 부처님 손바닥이 지면에 떨어져 광역 대미지를 줍니다.', quote:'부처님의 자비와 빛은 한량이 없다.',
      stats:[{dmg:100,cd:4500,size:100},{dmg:200,cd:4000,size:130},{dmg:350,cd:3500,size:160},{dmg:550,cd:3000,size:190},{dmg:850,cd:2400,size:230}] },
    { id:'metal_beads', name:'번뇌의 염주', type:'weapon', maxLevel:5, icon:'📿',
      desc:'플레이어 외곽에 다수의 염주 구체를 소환해 닿는 적에게 폭발 피해를 줍니다.', quote:'번뇌를 끊어내는 108 염주의 신통한 힘이다.',
      stats:[{dmg:30,cd:3000,count:4,speed:3.5},{dmg:60,cd:2700,count:6,speed:4.0},{dmg:110,cd:2400,count:8,speed:4.5},{dmg:180,cd:2100,count:10,speed:5.0},{dmg:270,cd:1700,count:12,speed:6.0}] },
    { id:'passive_buddhist_dmg', name:'진여(眞如)의 심인', type:'passive', maxLevel:5, icon:'💥',
      desc:'마음속 참된 본성을 깨달아 모든 공격력을 증가시킵니다.', quote:'마음이 곧 부처요, 그것이 바로 진여이다.' },
    { id:'passive_buddhist_speed', name:'경행(經行)의 보법', type:'passive', maxLevel:5, icon:'💨',
      desc:'평화롭고 고요한 걷기 수행으로 신속하게 움직입니다.', quote:'발걸음마다 평화가 피어오르게 하라.' },
    { id:'passive_buddhist_cooldown', name:'찰나의 순환', type:'passive', maxLevel:5, icon:'⏱️',
      desc:'우주의 찰나 속 순환 원리를 깨달아 스킬 쿨타임을 단축합니다.', quote:'백천만겁 지나도 찰나의 진리는 변치 않는다.' },
    { id:'passive_buddhist_area', name:'일체유심조의 확장', type:'passive', maxLevel:5, icon:'🔮',
      desc:'모든 것이 마음에서 비롯되듯 공격이 미치는 영역을 넓힙니다.', quote:'마음이 우주를 만들어내고 삼계를 장엄한다.' },
    { id:'passive_buddhist_regen', name:'참선(參禪)의 명상', type:'passive', maxLevel:5, icon:'🩹',
      desc:'깊은 참선 명상을 통해 내면의 상처와 육체 생명력을 회복합니다.', quote:'좌선하여 묵묵히 비추니 몸의 상처가 절로 아무누나.' },
    { id:'passive_buddhist_defense', name:'금강신체', type:'passive', maxLevel:5, icon:'🛡️',
      desc:'부서지지 않는 금강과 같은 단단한 체벽으로 받는 피해를 경감합니다.', quote:'금강은 무너지지 않으며 어떤 파괴도 겪지 않는다.' }
  ]
};

// ─── EVOLUTION STAGES ──────────────────────────────────────────────
export const EVOLUTION_STAGES = {
  idealism: [
    {title:'플라톤',era:'고대 그리스',color:'#ff4757'},
    {title:'에픽테토스',era:'헬레니즘',color:'#ff6b35'},
    {title:'아우구스티누스',era:'중세 시대',color:'#ffd200'},
    {title:'데카르트',era:'근대 초기',color:'#ff9ff3'},
    {title:'칸트',era:'근대 후기',color:'#c56cf0'},
    {title:'사르트르',era:'현대 사회',color:'#ff4757'}
  ],
  empiricism: [
    {title:'아리스토텔레스',era:'고대 그리스',color:'#00d2d3'},
    {title:'에피쿠로스',era:'헬레니즘',color:'#54a0ff'},
    {title:'토마스 아퀴나스',era:'중세 시대',color:'#48dbfb'},
    {title:'베이컨',era:'근대 초기',color:'#1dd1a1'},
    {title:'밀',era:'근대 후기',color:'#00d2d3'},
    {title:'듀이',era:'현대 사회',color:'#54a0ff'}
  ],
  confucianism: [
    {title:'공자',era:'고대 그리스',color:'#ffd200'},
    {title:'맹자',era:'헬레니즘',color:'#ffeaa7'},
    {title:'주희',era:'중세 시대',color:'#fdcb6e'},
    {title:'이황',era:'근대 초기',color:'#e1b12c'},
    {title:'이이',era:'근대 후기',color:'#f1c40f'},
    {title:'현대의 선비',era:'현대 사회',color:'#f39c12'}
  ],
  taoism: [
    {title:'노자',era:'고대 그리스',color:'#2ed573'},
    {title:'장자',era:'헬레니즘',color:'#55efc4'},
    {title:'열자',era:'중세 시대',color:'#00b894'},
    {title:'위백양',era:'근대 초기',color:'#1abc9c'},
    {title:'이지함',era:'근대 후기',color:'#16a085'},
    {title:'현대의 도인',era:'현대 사회',color:'#2ecc71'}
  ],
  buddhism: [
    {title:'석가모니',era:'고대 그리스',color:'#ff9f43'},
    {title:'혜능',era:'헬레니즘',color:'#fab1a0'},
    {title:'원효',era:'중세 시대',color:'#e17055'},
    {title:'의상',era:'근대 초기',color:'#d35400'},
    {title:'지눌',era:'근대 후기',color:'#e67e22'},
    {title:'현대의 수행자',era:'현대 사회',color:'#f39c12'}
  ]
};

// ─── TIMELINE ──────────────────────────────────────────────────────
export const TIMELINE = [
  {name:'고대 그리스',mobType:'orc',bossName:'소피스트'},
  {name:'헬레니즘',mobType:'beast',bossName:'아파테이아 수호자'},
  {name:'중세 시대',mobType:'undead',bossName:'교조주의의 망령'},
  {name:'근대 초기',mobType:'golem',bossName:'편견의 거인 (4대 우상)'},
  {name:'근대 후기',mobType:'steam',bossName:'도덕의 심판관 (정언명령)'},
  {name:'현대 사회',mobType:'machine',bossName:'허무주의의 그림자'}
];

// ─── AURA DATABASE ─────────────────────────────────────────────────
export const AURA_DB = {
  brilliance: {
    name: '브릴리언스 오라',
    icon: '💠',
    color: '#54a0ff',
    desc: '쿨타임이 감소하여 스킬 시전 속도가 대폭 감소합니다.',
    statsDesc: '스킬 시전 속도 감소'
  },
  devotion: {
    name: '디보션 오라',
    icon: '🛡️',
    color: '#718093',
    desc: '하얀색 방패의 신성한 비호로 받는 모든 피해가 감소합니다.',
    statsDesc: '방어력 증가'
  },
  endurance: {
    name: '인듀어런스 오라',
    icon: '⚡',
    color: '#ff4757',
    desc: '붉은색 소용돌이가 휘돌아 이동 속도 및 투사체 속도가 증가합니다.',
    statsDesc: '이동 및 투사체 속도 증가'
  },
  warsong: {
    name: '워송 배틀 드럼',
    icon: '🥁',
    color: '#ff9f43',
    desc: '전쟁 노래의 북소리가 기본 공격력을 파괴적으로 증가시킵니다. (레벨당 +40% 공격력 증가)',
    statsDesc: '기본 공격력 폭증'
  },
  unholy: {
    name: '언홀리 오라',
    icon: '💀',
    color: '#ffb300',
    desc: '음산한 황혼빛 기운이 서리며 이동속도를 높이고 매초 체력을 회복합니다.',
    statsDesc: '이동 속도 및 초당 체력 재생 증가'
  },
  vampiric: {
    name: '뱀파이어릭 오라',
    icon: '🦇',
    color: '#a55eea',
    desc: '박쥐 마법진이 활성화되어 공격 시 입힌 피해의 일부를 체력으로 흡수합니다.',
    statsDesc: '가한 데미지 비례 체력 흡수'
  },
  thorns: {
    name: '쏜즈 오라',
    icon: '🌵',
    color: '#1dd1a1',
    desc: '가시 덩굴 장벽이 피격당했을 때 입은 피해를 일부 반사합니다.',
    statsDesc: '받은 데미지 반사'
  },
  trueshot: {
    name: '트루샷 오라',
    icon: '🎯',
    color: '#48dbfb',
    desc: '모든 공격의 치명타 확률과 치명타 극딜 피해를 비약적으로 높입니다. (레벨당 치명타 확률 +15%, 치명타 피해 +50%)',
    statsDesc: '치명타 확률 및 치명타 피해 폭증'
  }
};

// 학파 고유 오라 매칭 정보
export const LINEAGE_AURA_SYNERGY = {
  idealism:     { aura: 'vampiric',  name: '🔥 이성주의의 고유 오라', desc: '화염 스킬 흡혈률 lvl × 15% 추가 증가. 킬 시 주변에 불타는 장판(초당 lvl × 55 피해) 생성 + 즉시 체력 회복. 화염 폭발 반경 40% 증가' },
  empiricism:   { aura: 'endurance', name: '❄️ 경험주의의 고유 오라', desc: '이동 시 서리 발자국(이속 -75% 빙결, 초당 lvl × 40 냉기 피해) 생성, 속도/발사 속도 lvl × 20% 및 스킬 대기 시간 lvl × 10% 추가 감소' },
  confucianism: { aura: 'unholy',    name: '⚡ 유가의 고유 오라', desc: '번개 스킬 데미지 lvl × 25% 추가 증가. 이동 속도 lvl × 15% 추가 증가, 킬 시 즉시 체력 회복(lvl × 50), 번개 스킬 연속 적중 시 초당 체력 재생 lvl × 3 추가' },
  taoism:       { aura: 'thorns',    name: '🌪️ 도가의 고유 오라', desc: '절대 회피율 lvl × 10% 증가. 회피/피격 시 주변 몹 흡입 가시 회오리(초당 lvl × 55 피해) 소환. 보스 반사 데미지 20배 증폭 및 추격 반격' },
  buddhism:     { aura: 'devotion',  name: '📿 불교의 고유 오라', desc: '초근접 스킬 데미지 lvl × 35% 증가, 피격 시 주변 넉백 및 광역 금강 충격파(lvl × 80 피해) 방출, 받는 피해 lvl × 6% 추가 감소' },
};

