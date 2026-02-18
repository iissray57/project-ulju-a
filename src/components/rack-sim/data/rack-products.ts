export type RackProductType = 'normal' | 'bottom_open' | 'washing' | 'hanger';

export interface RackProduct {
  type: RackProductType;
  name: string;
  description: string;
  icon: string;
  defaultShelfCount: number;
  minShelfCount: number;
  maxShelfCount: number;
}

export const RACK_PRODUCTS: Record<RackProductType, RackProduct> = {
  normal: {
    type: 'normal',
    name: '일반 선반',
    description: '다용도 수납 앵글 선반',
    icon: '📦',
    defaultShelfCount: 5,
    minShelfCount: 2,
    maxShelfCount: 8,
  },
  bottom_open: {
    type: 'bottom_open',
    name: '하단오픈형',
    description: '하단이 열린 수납 선반',
    icon: '🗄️',
    defaultShelfCount: 4,
    minShelfCount: 2,
    maxShelfCount: 7,
  },
  washing: {
    type: 'washing',
    name: '세탁기용',
    description: '세탁기/건조기 위 수납',
    icon: '🧺',
    defaultShelfCount: 3,
    minShelfCount: 2,
    maxShelfCount: 5,
  },
  hanger: {
    type: 'hanger',
    name: '앵글 행거',
    description: '행거봉 포함 수납 앵글',
    icon: '👔',
    defaultShelfCount: 3,
    minShelfCount: 1,
    maxShelfCount: 6,
  },
};
