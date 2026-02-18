'use client';

import { useRackSim } from '../rack-context';
import { getOptionsByGroup } from '../data/rack-options';
import type { RackItem } from '../types';

const GROUP_LABELS: Record<string, string> = {
  shelf: '선반',
  safety: '안전',
  cover: '커버',
  base: '하부',
};

interface OptionToggleProps {
  icon: string;
  name: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

function OptionToggle({ icon, name, description, active, onClick }: OptionToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        active
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-slate-700'}`}>
          {name}
        </p>
        <p className="truncate text-[10px] text-slate-400">{description}</p>
      </div>
      <span
        className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
          active ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
        }`}
      />
    </button>
  );
}

function BaseTypeGroup({ item, dispatch }: { item: RackItem; dispatch: React.Dispatch<Parameters<ReturnType<typeof useRackSim>['dispatch']>[0]> }) {
  const baseOptions = getOptionsByGroup('base');

  return (
    <div className="flex flex-col gap-1">
      {baseOptions.map((opt) => {
        const isSelected = item.baseType === opt.type;
        return (
          <button
            key={opt.type}
            onClick={() =>
              dispatch({
                type: 'SET_BASE_TYPE',
                payload: { id: item.id, baseType: opt.type as RackItem['baseType'] },
              })
            }
            className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
              isSelected
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {/* Radio indicator */}
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-blue-500' : 'border-slate-300'
              }`}
            >
              {isSelected && (
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </span>
            <span className="text-sm leading-none">{opt.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                {opt.name}
                {opt.type === 'leveling_foot' && (
                  <span className="ml-1 text-[10px] text-slate-400">(기본)</span>
                )}
              </p>
              <p className="truncate text-[10px] text-slate-400">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function OptionPanel() {
  const { selectedItem, dispatch } = useRackSim();

  if (!selectedItem) {
    return (
      <div className="flex h-full w-56 flex-col items-center justify-center border-l border-slate-200 bg-white p-4">
        <p className="text-center text-xs text-slate-400">제품을 선택하면 옵션을 설정할 수 있습니다</p>
      </div>
    );
  }

  // Non-base options to render as toggles
  const nonBaseGroups: Array<'shelf' | 'safety' | 'cover'> = ['shelf', 'safety', 'cover'];

  return (
    <div className="flex h-full w-56 flex-col gap-3 overflow-y-auto border-l border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">옵션</p>

      {nonBaseGroups.map((group) => {
        const options = getOptionsByGroup(group);
        return (
          <div key={group}>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-400">{GROUP_LABELS[group]}</p>
            <div className="flex flex-col gap-1">
              {options.map((opt) => {
                const active = selectedItem.options.includes(opt.type);
                return (
                  <OptionToggle
                    key={opt.type}
                    icon={opt.icon}
                    name={opt.name}
                    description={opt.description}
                    active={active}
                    onClick={() =>
                      dispatch({
                        type: 'TOGGLE_OPTION',
                        payload: { id: selectedItem.id, option: opt.type },
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Base type group (radio) */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-slate-400">{GROUP_LABELS['base']}</p>
        <BaseTypeGroup item={selectedItem} dispatch={dispatch} />
      </div>
    </div>
  );
}
