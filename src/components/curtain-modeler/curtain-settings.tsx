'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCurtainModeler, type CurtainStyle, type BlindStyle, type ProductType } from './curtain-context';

const CURTAIN_STYLE_LABELS: Record<CurtainStyle, string> = {
  drape: '드레이프 (일반)',
  sheer: '쉬어 (투명)',
  blackout: '암막',
  roman: '로만 셰이드',
  cafe: '카페 커튼',
};

const BLIND_STYLE_LABELS: Record<BlindStyle, string> = {
  roller: '롤 블라인드',
  venetian: '베네시안 (가로)',
  vertical: '버티칼 (세로)',
  honeycomb: '허니콤',
  combi: '콤비 (비전)',
};

const CURTAIN_LENGTH_LABELS = {
  sill: '창대까지',
  'below-sill': '창대 아래',
  floor: '바닥까지',
};

// 커튼 색상 프리셋
const COLOR_PRESETS = [
  { label: '아이보리', value: '#F5F0E8' },
  { label: '베이지', value: '#D4C8A8' },
  { label: '브라운', value: '#8B7355' },
  { label: '다크브라운', value: '#5C4033' },
  { label: '그레이', value: '#808080' },
  { label: '차콜', value: '#404040' },
  { label: '네이비', value: '#2C3E6B' },
  { label: '와인', value: '#722F37' },
  { label: '올리브', value: '#6B7B3A' },
  { label: '화이트', value: '#FAFAFA' },
  { label: '블랙', value: '#1A1A1A' },
  { label: '핑크', value: '#D4A0A0' },
];

export function CurtainSettings() {
  const { state, setWindow, setConfig } = useCurtainModeler();
  const { window: win, config } = state;

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-sm">창문 설정</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">창 폭 (mm)</Label>
          <Input
            type="number"
            value={win.width}
            onChange={(e) => setWindow({ width: Number(e.target.value) || 0 })}
            min={300}
            max={5000}
            step={100}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">창 높이 (mm)</Label>
          <Input
            type="number"
            value={win.height}
            onChange={(e) => setWindow({ height: Number(e.target.value) || 0 })}
            min={300}
            max={3000}
            step={100}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">창대 높이 (mm)</Label>
        <Input
          type="number"
          value={win.sillHeight}
          onChange={(e) => setWindow({ sillHeight: Number(e.target.value) || 0 })}
          min={0}
          max={1500}
          step={100}
        />
      </div>

      <Separator />

      <h3 className="font-semibold text-sm">제품 유형</h3>

      <Select
        value={config.productType}
        onValueChange={(v) => setConfig({ productType: v as ProductType })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="curtain">커튼</SelectItem>
          <SelectItem value="blind">블라인드</SelectItem>
        </SelectContent>
      </Select>

      {config.productType === 'curtain' ? (
        <>
          <div className="space-y-1">
            <Label className="text-xs">커튼 스타일</Label>
            <Select
              value={config.curtainStyle}
              onValueChange={(v) => setConfig({ curtainStyle: v as CurtainStyle })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURTAIN_STYLE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 암막률 (암막 스타일일 때만) */}
          {config.curtainStyle === 'blackout' && (
            <div className="space-y-2">
              <Label className="text-xs">암막률: {config.blackoutPercent}%</Label>
              <Slider
                value={[config.blackoutPercent]}
                onValueChange={([v]) => setConfig({ blackoutPercent: v })}
                min={60}
                max={100}
                step={1}
              />
              <p className="text-[10px] text-muted-foreground">
                60~80%=1급 암막 / 80~95%=2급 암막 / 95~100%=완전 암막
              </p>
            </div>
          )}

          {/* 겉커튼 색상 */}
          <div className="space-y-1.5">
            <Label className="text-xs">겉커튼 색상</Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    className={`h-5 w-5 rounded-full border-2 transition-all ${
                      config.curtainColor === c.value
                        ? 'border-primary scale-110 ring-1 ring-primary/30'
                        : 'border-transparent hover:border-muted-foreground/40'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setConfig({ curtainColor: c.value })}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={config.curtainColor}
                onChange={(e) => setConfig({ curtainColor: e.target.value })}
                className="h-7 w-10 p-0.5 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">주름 배율: {config.foldMultiplier.toFixed(1)}배</Label>
            <Slider
              value={[config.foldMultiplier]}
              onValueChange={([v]) => setConfig({ foldMultiplier: v })}
              min={1.5}
              max={3.0}
              step={0.1}
            />
            <p className="text-[10px] text-muted-foreground">1.5배=절약형, 2.0배=기본, 2.5~3.0배=풍성</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">커튼 길이</Label>
            <Select
              value={config.curtainLength}
              onValueChange={(v) => setConfig({ curtainLength: v as 'sill' | 'below-sill' | 'floor' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURTAIN_LENGTH_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">양개 (중앙 분할)</Label>
            <Switch
              checked={config.splitCenter}
              onCheckedChange={(v) => setConfig({ splitCenter: v })}
            />
          </div>

          {/* 개폐 조절 */}
          <div className="space-y-2">
            <Label className="text-xs">
              커튼 개폐: {config.openRatio === 0 ? '닫힘' : config.openRatio >= 1 ? '완전 열림' : `${Math.round(config.openRatio * 100)}% 열림`}
            </Label>
            <Slider
              value={[config.openRatio]}
              onValueChange={([v]) => setConfig({ openRatio: v })}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          <Separator />

          {/* 2중 커튼 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">2중 커튼 (속+겉)</Label>
            <Switch
              checked={config.doubleCurtain}
              onCheckedChange={(v) => setConfig({ doubleCurtain: v })}
            />
          </div>

          {config.doubleCurtain && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <p className="text-[10px] font-medium text-muted-foreground">속커튼 설정</p>

              <div className="space-y-1">
                <Label className="text-xs">속커튼 스타일</Label>
                <Select
                  value={config.innerCurtainStyle}
                  onValueChange={(v) => setConfig({ innerCurtainStyle: v as CurtainStyle })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURTAIN_STYLE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">속커튼 색상</Label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.slice(0, 6).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        className={`h-4 w-4 rounded-full border-2 transition-all ${
                          config.innerCurtainColor === c.value
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:border-muted-foreground/40'
                        }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setConfig({ innerCurtainColor: c.value })}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={config.innerCurtainColor}
                    onChange={(e) => setConfig({ innerCurtainColor: e.target.value })}
                    className="h-6 w-8 p-0.5 cursor-pointer"
                  />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground">
                속커튼은 항상 닫힌 상태로 표시됩니다. 겉커튼을 열면 속커튼이 보입니다.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-xs">블라인드 스타일</Label>
            <Select
              value={config.blindStyle}
              onValueChange={(v) => setConfig({ blindStyle: v as BlindStyle })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BLIND_STYLE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(config.blindStyle === 'venetian' || config.blindStyle === 'vertical') && (
            <div className="space-y-2">
              <Label className="text-xs">슬랫 각도: {config.slatAngle}°</Label>
              <Slider
                value={[config.slatAngle]}
                onValueChange={([v]) => setConfig({ slatAngle: v })}
                min={0}
                max={90}
                step={5}
              />
            </div>
          )}

          {/* 블라인드 분할 */}
          <div className="space-y-2">
            <Label className="text-xs">분할 수: {config.blindSections}단</Label>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <Button
                  key={n}
                  variant={config.blindSections === n ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={() => setConfig({ blindSections: n })}
                >
                  {n}단
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              한 창에 블라인드를 {config.blindSections}개로 나누어 설치
            </p>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-1">
        <Label className="text-xs">레일 좌우 연장 (mm)</Label>
        <Input
          type="number"
          value={config.railExtension}
          onChange={(e) => setConfig({ railExtension: Number(e.target.value) || 0 })}
          min={0}
          max={500}
          step={50}
        />
        <p className="text-[10px] text-muted-foreground">창 양쪽으로 추가 확장할 길이</p>
      </div>
    </div>
  );
}
