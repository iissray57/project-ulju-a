import type { FloorObjectType } from '../types';

export interface ObjectCatalogEntry {
  type: FloorObjectType;
  name: string;
  defaultWidth: number;   // mm
  defaultDepth: number;   // mm
  defaultHeight: number;  // mm
  color: string;          // hex
}

export const OBJECT_CATALOG: Record<FloorObjectType, ObjectCatalogEntry> = {
  shelving_unit: {
    type: 'shelving_unit',
    name: '선반장',
    defaultWidth: 600,
    defaultDepth: 400,
    defaultHeight: 2000,
    color: '#8B9DC3',
  },
  hanger_rack: {
    type: 'hanger_rack',
    name: '행거',
    defaultWidth: 800,
    defaultDepth: 500,
    defaultHeight: 1800,
    color: '#A8D8A8',
  },
  drawer_unit: {
    type: 'drawer_unit',
    name: '서랍장',
    defaultWidth: 600,
    defaultDepth: 450,
    defaultHeight: 900,
    color: '#F4A261',
  },
  shoe_rack: {
    type: 'shoe_rack',
    name: '신발장',
    defaultWidth: 800,
    defaultDepth: 300,
    defaultHeight: 1200,
    color: '#E8C4A2',
  },
  mirror: {
    type: 'mirror',
    name: '전신거울',
    defaultWidth: 500,
    defaultDepth: 50,
    defaultHeight: 1800,
    color: '#B8D4E8',
  },
  island: {
    type: 'island',
    name: '아일랜드',
    defaultWidth: 1200,
    defaultDepth: 600,
    defaultHeight: 900,
    color: '#D4C5E2',
  },
  door: {
    type: 'door',
    name: '문',
    defaultWidth: 900,
    defaultDepth: 200,
    defaultHeight: 2100,
    color: '#D2B48C',
  },
  window: {
    type: 'window',
    name: '창문',
    defaultWidth: 1200,
    defaultDepth: 150,
    defaultHeight: 1200,
    color: '#87CEEB',
  },
};
