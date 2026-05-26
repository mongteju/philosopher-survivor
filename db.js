// ─── PHILOSOPHY DATABASE ────────────────────────────────────────────
export const PHILOSOPHY_DB = {
  idealism: [
    { id:'fire_projectile', name:'이데아의 불꽃', type:'weapon', maxLevel:4, icon:'🔥',
      desc:'이데아의 빛을 화염 구체로 형상화해 주변 적에게 발사합니다.', quote:'현실은 이데아의 그림자일 뿐이다.',
      stats:[{dmg:35,cd:1400,size:25},{dmg:75,cd:1100,size:37.5},{dmg:145,cd:850,size:50},{dmg:290,cd:550,size:75}] },
    { id:'fire_aura', name:'이성의 오라', type:'weapon', maxLevel:4, icon:'☀️',
      desc:'뜨거운 이성의 오라로 주변 적들을 지속해서 불태웁니다.', quote:'이성에 따르라.',
      stats:[{dmg:16,radius:95,cd:500},{dmg:35,radius:130,cd:450},{dmg:75,radius:165,cd:380},{dmg:140,radius:210,cd:280}] },
    { id:'fire_pillar', name:'은총의 스파크', type:'weapon', maxLevel:4, icon:'⚡',
      desc:'장엄한 은총의 스파크를 소환해 적들에게 광역 심판을 내립니다.', quote:'이성은 신앙 아래 완전해진다.',
      stats:[{dmg:75,interval:2200,count:1},{dmg:150,interval:1700,count:2},{dmg:260,interval:1300,count:3},{dmg:440,interval:850,count:5}] },
    { id:'fire_sword', name:'코기토의 검', type:'weapon', maxLevel:4, icon:'⚔️',
      desc:'날카롭게 타오르는 사유의 검을 사방에 휘두릅니다.', quote:'나는 생각한다, 고로 존재한다.',
      stats:[{dmg:55,count:3,speed:6,cd:4000},{dmg:110,count:4,speed:8,cd:3400},{dmg:190,count:6,speed:10,cd:2800},{dmg:310,count:8,speed:13,cd:2000}] },
    { id:'passive_idealism_dmg', name:'이성의 광채', type:'passive', maxLevel:4, icon:'💥',
      desc:'선험적 인식의 광채로 모든 공격력을 증폭시킵니다.', quote:'순수 이성의 법칙은 확실하다.' },
    { id:'passive_idealism_area', name:'사유의 확장', type:'passive', maxLevel:4, icon:'🔮',
      desc:'시간과 공간 인식을 넓혀, 모든 공격의 작용 범위를 확장합니다.', quote:'공간은 선험적 인식의 형식이다.' },
    { id:'passive_speed', name:'이성의 신속', type:'passive', maxLevel:4, icon:'💨',
      desc:'도덕적 주체로 각성하여 이동 속도를 증가시킵니다.', quote:'자유 의지를 가진 인간은 행동의 주체다.' },
    { id:'passive_cooldown', name:'사유의 회전', type:'passive', maxLevel:4, icon:'⏱️',
      desc:'시간 흐름을 제어해 모든 스킬 쿨타임을 단축합니다.', quote:'시간은 우리 내면의 직관 속에 정돈된다.' },
    { id:'passive_regen', name:'정신적 치유', type:'passive', maxLevel:4, icon:'🩹',
      desc:'성찰과 명상을 통해 체력(HP)을 매초 지속 회복합니다.', quote:'성찰하는 영혼은 상처받지 않는다.' }
  ],
  empiricism: [
    { id:'ice_projectile', name:'중용의 얼음 송곳', type:'weapon', maxLevel:4, icon:'❄️',
      desc:'중용의 얼음 쐐기를 발사하여 적을 관통하고 둔화시킵니다.', quote:'덕은 중용에 있다.',
      stats:[{dmg:25,pierce:2,slow:0.35,speed:8,cd:1200},{dmg:55,pierce:3,slow:0.45,speed:10,cd:950},{dmg:525,pierce:5,slow:0.55,speed:12,cd:750},{dmg:1100,pierce:99,slow:0.75,speed:15,cd:450}] },
    { id:'ice_floor', name:'쾌락의 정원', type:'weapon', maxLevel:4, icon:'🌊',
      desc:'차가운 서리 지대를 형성하여 범위 내 적을 지속 공격합니다.', quote:'진정한 쾌락은 고통 없는 상태다.',
      stats:[{dmg:10,size:100,duration:3500,cd:1400},{dmg:22,size:145,duration:4200,cd:1100},{dmg:48,size:190,duration:5000,cd:850},{dmg:95,size:250,duration:6000,cd:600}] },
    { id:'ice_freeze', name:'신학의 족쇄', type:'weapon', maxLevel:4, icon:'🧱',
      desc:'사방의 적들을 순간 얼어붙게 만들어 무력화합니다.', quote:'신앙와 이성은 서로 보완한다.',
      stats:[{dmg:50,radius:170,cd:5500,freezeTime:2000},{dmg:100,radius:210,cd:4800,freezeTime:2600},{dmg:180,radius:260,cd:3800,freezeTime:3200},{dmg:320,radius:320,cd:2800,freezeTime:4200}] },
    { id:'ice_ring', name:'귀납의 고리', type:'weapon', maxLevel:4, icon:'🌀',
      desc:'귀납적 얼음 결정을 몸 주변에 회전시켜 적을 타격합니다.', quote:'아는 것이 힘이다.',
      stats:[{dmg:30,count:1,radius:65,speed:0.045},{dmg:60,count:2,radius:80,speed:0.05},{dmg:110,count:4,radius:95,speed:0.06},{dmg:200,count:6,radius:115,speed:0.075}] },
    { id:'passive_empiricism_slow', name:'감각의 관찰', type:'passive', maxLevel:4, icon:'⛄',
      desc:'감각적 관찰 능력을 높여 적 이동 속도를 더 둔화시킵니다.', quote:'정신은 태어날 때 백지 상태다.' },
    { id:'passive_empiricism_xp', name:'경험의 축적', type:'passive', maxLevel:4, icon:'⭐',
      desc:'경험 데이터를 축적하여 획득 경험치를 늘립니다.', quote:'지식은 오직 경험에서 출발한다.' },
    { id:'passive_max_hp', name:'감각적 충만', type:'passive', maxLevel:4, icon:'❤️',
      desc:'육체와 정신을 다져 최대 체력(HP)을 증가시킵니다.', quote:'신체와 마음의 결합이 자아를 안정시킨다.' },
    { id:'passive_armor', name:'이성의 방패', type:'passive', maxLevel:4, icon:'🛡️',
      desc:'우상을 극복하여 받는 모든 대미지를 경감시킵니다.', quote:'논리적 의심의 방패로 편견을 물리쳐라.' },
    { id:'passive_crit_dmg', name:'감각적 통찰', type:'passive', maxLevel:4, icon:'🎯',
      desc:'실증적인 분석을 통해 크리티컬 피해를 증폭시킵니다.', quote:'날카로운 관찰만이 핵심을 관통한다.' }
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
    desc: '전쟁 노래의 북소리가 모든 공격력을 증가시킵니다.',
    statsDesc: '기본 공격력 증가'
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
    desc: '화살촉 마법진이 모든 공격의 크리티컬 확률을 비약적으로 높입니다.',
    statsDesc: '크리티컬 확률 증가'
  }
};
