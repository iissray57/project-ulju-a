import type { RackProductType } from './rack-products';

export interface RackSizeConfig {
  widthOptions: number[];
  depthOptions: number[];
  heightOptions: number[];
  defaultWidth: number;
  defaultDepth: number;
  defaultHeight: number;
}

export const RACK_SIZE_CONFIGS: Record<RackProductType, RackSizeConfig> = {
  normal: {
    widthOptions: [400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1500, 1800],
    depthOptions: [300, 350, 400, 450, 500, 600],
    heightOptions: [1200, 1500, 1800, 2000, 2100, 2400],
    defaultWidth: 900,
    defaultDepth: 450,
    defaultHeight: 1800,
  },
  bottom_open: {
    widthOptions: [600, 700, 800, 900, 1000, 1200],
    depthOptions: [300, 350, 400, 450, 500],
    heightOptions: [1500, 1800, 2000, 2100, 2400],
    defaultWidth: 900,
    defaultDepth: 400,
    defaultHeight: 1800,
  },
  washing: {
    widthOptions: [600, 700, 800, 900, 1000],
    depthOptions: [400, 450, 500, 600],
    heightOptions: [1800, 2000, 2100, 2400],
    defaultWidth: 700,
    defaultDepth: 500,
    defaultHeight: 2100,
  },
  hanger: {
    widthOptions: [600, 700, 800, 900, 1000, 1200],
    depthOptions: [400, 450, 500],
    heightOptions: [1800, 2000, 2100, 2400],
    defaultWidth: 900,
    defaultDepth: 450,
    defaultHeight: 2100,
  },
};

/** Find nearest valid option for a given dimension */
export function findNearestOption(value: number, options: number[]): number {
  return options.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}
