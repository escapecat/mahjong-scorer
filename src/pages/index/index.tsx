import { View } from '@tarojs/components';
import { useCalculator } from './useCalculator';
import { ScoreBar } from '../../components/ScoreBar';
import { SettingsPanel } from '../../components/SettingsPanel';
import { HandDisplay } from '../../components/HandDisplay';
import { ResultDisplay } from '../../components/ResultDisplay';
import { WaitSuggestions } from '../../components/WaitSuggestions';
import { TileKeyboard } from '../../components/TileKeyboard';
import { BottomNav } from '../../components/BottomNav';
import { DiscardSuggestion } from '../../components/DiscardSuggestion';
import { FanPotential } from '../../components/FanPotential';
import styles from './index.module.css';

export default function Index() {
  const {
    state, dispatch, total, expected,
    currentResult, winSuggestions, addTileToTarget, isTileDisabled,
    discardAnalysisInputs, fanPotentialInputs,
  } = useCalculator();

  // Build meld entries for HandDisplay
  const meldEntries = [
    ...state.chiMelds.map((m, i) => ({ meldType: 'chi' as const, index: i, meld: m, label: '吃' })),
    ...state.pengMelds.map((m, i) => ({ meldType: 'peng' as const, index: i, meld: m, label: '碰' })),
    ...state.mingKongMelds.map((m, i) => ({ meldType: 'mingKong' as const, index: i, meld: m, label: '明杠' })),
    ...state.anKongMelds.map((m, i) => ({ meldType: 'anKong' as const, index: i, meld: m, label: '暗杠' })),
  ];

  const hasAnyMeld = meldEntries.length > 0;

  return (
    <View className={styles.app}>
      <View className={styles.display}>
        <ScoreBar
          result={currentResult}
          tileCount={total}
          expectedCount={expected}
          settingsOpen={state.settingsOpen}
          onToggleSettings={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
        />

        {state.settingsOpen && (
          <SettingsPanel
            isSelfDraw={state.isSelfDraw}
            seatWind={state.seatWind}
            roundWind={state.roundWind}
            flowerCount={state.flowerCount}
            isLastTile={state.isLastTile}
            isKongDraw={state.isKongDraw}
            isRobbingKong={state.isRobbingKong}
            isWinningTileLast={state.isWinningTileLast}
            onSetSelfDraw={(v) => dispatch({ type: 'SET_SELF_DRAW', value: v })}
            onSetSeatWind={(w) => dispatch({ type: 'SET_SEAT_WIND', wind: w })}
            onSetRoundWind={(w) => dispatch({ type: 'SET_ROUND_WIND', wind: w })}
            onSetFlower={(n) => dispatch({ type: 'SET_FLOWER', count: n })}
            onToggleLastTile={() => dispatch({ type: 'TOGGLE_LAST_TILE' })}
            onToggleKongDraw={() => dispatch({ type: 'TOGGLE_KONG_DRAW' })}
            onToggleRobbingKong={() => dispatch({ type: 'TOGGLE_ROBBING_KONG' })}
            onToggleWinningTileLast={() => dispatch({ type: 'TOGGLE_WINNING_TILE_LAST' })}
          />
        )}

        <HandDisplay
          handCounts={state.handCounts}
          meldEntries={meldEntries}
          hasAnyMeld={hasAnyMeld}
          onRemoveTile={(t) => dispatch({ type: 'REMOVE_HAND_TILE', tile: t })}
          onRemoveMeld={(meldType, index) => dispatch({ type: 'REMOVE_MELD', meldType: meldType as any, index })}
          onClear={() => dispatch({ type: 'CLEAR_ALL' })}
        />

        {currentResult && (
          <ResultDisplay
            result={currentResult}
            winningTile={state.winningTile}
            expandedFanName={state.expandedFanName}
            onExpandFan={(name) => dispatch({ type: 'EXPAND_FAN', name })}
          />
        )}

        <WaitSuggestions
          suggestions={winSuggestions}
          expandedCode={state.expandedWaitTile}
          onExpand={(code) => dispatch({ type: 'EXPAND_WAIT', code })}
          onAddTile={(t) => dispatch({ type: 'ADD_WINNING_TILE', tile: t })}
        />

        {discardAnalysisInputs && (
          <DiscardSuggestion
            allCounts={discardAnalysisInputs.allCounts}
            lockedMelds={discardAnalysisInputs.melds}
            game={discardAnalysisInputs.game}
          />
        )}

        {fanPotentialInputs && (
          <FanPotential allCounts={fanPotentialInputs.allCounts} />
        )}
      </View>

      <TileKeyboard
        addTarget={state.addTarget}
        isTileDisabled={isTileDisabled}
        onAddTile={addTileToTarget}
        onSetTarget={(t) => dispatch({ type: 'SET_ADD_TARGET', target: t })}
      />

      <BottomNav active='home' />
    </View>
  );
}
