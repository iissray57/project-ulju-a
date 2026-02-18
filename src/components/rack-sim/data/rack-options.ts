export type RackOptionType =
  | 'extra_shelf'
  | 'hanger_bar'
  | 'side_safety_bar'
  | 'front_curtain'
  | 'side_curtain'
  | 'mesh_board'
  | 'leveling_foot'
  | 'small_wheel'
  | 'large_wheel';

export interface RackOption {
  type: RackOptionType;
  name: string;
  description: string;
  icon: string;
  group: 'shelf' | 'safety' | 'cover' | 'base';
  exclusive?: RackOptionType[];
}

export const RACK_OPTIONS: RackOption[] = [
  {
    type: 'extra_shelf',
    name: '선반 추가',
    description: '선반 1단 추가',
    icon: '➕',
    group: 'shelf',
  },
  {
    type: 'hanger_bar',
    name: '행거단 추가',
    description: '행거봉을 추가합니다',
    icon: '👕',
    group: 'shelf',
  },
  {
    type: 'side_safety_bar',
    name: '안전바',
    description: '사이드 안전바 (좌/우)',
    icon: '🛡️',
    group: 'safety',
  },
  {
    type: 'front_curtain',
    name: '전면 커튼',
    description: '전면 먼지 방지 커튼',
    icon: '🪟',
    group: 'cover',
  },
  {
    type: 'side_curtain',
    name: '사이드 커튼',
    description: '사이드 먼지 방지 커튼',
    icon: '🧵',
    group: 'cover',
  },
  {
    type: 'mesh_board',
    name: '메쉬보드',
    description: '사이드 메쉬보드',
    icon: '🔲',
    group: 'cover',
  },
  {
    type: 'leveling_foot',
    name: '조절좌',
    description: '높낮이 조절 발 (기본)',
    icon: '🔩',
    group: 'base',
    exclusive: ['small_wheel', 'large_wheel'],
  },
  {
    type: 'small_wheel',
    name: '소형 바퀴',
    description: '이동용 소형 캐스터',
    icon: '⚙️',
    group: 'base',
    exclusive: ['leveling_foot', 'large_wheel'],
  },
  {
    type: 'large_wheel',
    name: '대형 바퀴',
    description: '이동용 대형 캐스터',
    icon: '🛞',
    group: 'base',
    exclusive: ['leveling_foot', 'small_wheel'],
  },
];

export function getOptionsByGroup(group: RackOption['group']): RackOption[] {
  return RACK_OPTIONS.filter(o => o.group === group);
}
