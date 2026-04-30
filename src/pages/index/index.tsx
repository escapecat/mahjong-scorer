import { View } from '@tarojs/components';
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { useCalculator } from './useCalculator';
import { parseHandString } from '../../engine/handString';
import { ScoreBar } from '../../components/ScoreBar';
import { SettingsPanel } from '../../components/SettingsPanel';
import { HandDisplay } from '../../components/HandDisplay';
import { ResultDisplay } from '../../components/ResultDisplay';
import { WaitSuggestions } from '../../components/WaitSuggestions';
import { TileKeyboard } from '../../components/TileKeyboard';
import { BottomNav } from '../../components/BottomNav';
import { DiscardSuggestion } from '../../components/DiscardSuggestion';
import { FanPotential } from '../../components/FanPotential';
import { subtractMelds } from '../../engine/decomposer';
import styles from './index.module.css';

export default function Index() {
  const {
    state, dispatch, total, expected,
    currentResult, winSuggestions, addTileToTarget, isTileDisabled,
    discardAnalysisInputs, fanPotentialInputs,
    canUndo, canRedo, exportHandString,
  } = useCalculator();

  // weapp share. No-op on H5.
  useShareAppMessage(() => ({
    title: currentResult
      ? `我和了 ${currentResult.totalFan} 番 — 国标麻将算番器`
      : '国标麻将算番器 · 算番 / 听牌 / 计分一站搞定',
    path: '/pages/index/index',
  }));
  useShareTimeline(() => ({
    title: '国标麻将算番器',
    query: '',
  }));

  async function handleCopy() {
    const s = exportHandString();
    if (!s || s === '(空)') {
      Taro.showToast({ title: '手牌为空', icon: 'none', duration: 1500 });
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(s);
      } else {
        await Taro.setClipboardData({ data: s });
      }
      Taro.showToast({ title: '已复制', icon: 'success', duration: 1200 });
    } catch (e) {
      Taro.showToast({ title: '复制失败', icon: 'none', duration: 1500 });
    }
  }

  async function handlePaste() {
    let text: string | null = null;
    if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      text = window.prompt('粘贴手牌字符串，例如:\n1133m456p99s | c1m | p3p | *7p');
    } else {
      try {
        const r = await Taro.getClipboardData();
        text = r.data || null;
      } catch (e) { /* ignore */ }
    }
    if (!text) return;
    const parsed = parseHandString(text);
    if (!parsed) {
      Taro.showToast({ title: '格式无法识别', icon: 'none', duration: 1800 });
      return;
    }
    dispatch({ type: 'IMPORT_HAND', data: parsed });
    Taro.showToast({ title: '已导入', icon: 'success', duration: 1200 });
  }

  // Build meld entries for HandDisplay
  const meldEntries = [
    ...state.chiMelds.map((m, i) => ({ meldType: 'chi' as const, index: i, meld: m, label: '吃' })),
    ...state.pengMelds.map((m, i) => ({ meldType: 'peng' as const, index: i, meld: m, label: '碰' })),
    ...state.mingKongMelds.map((m, i) => ({ meldType: 'mingKong' as const, index: i, meld: m, label: '明杠' })),
    ...state.anKongMelds.map((m, i) => ({ meldType: 'anKong' as const, index: i, meld: m, label: '暗杠' })),
  ];

  const hasAnyMeld = meldEntries.length > 0;

  // weapp pxtransform converts the CSS `max-width: 560px` (a desktop-only
  // constraint) into `560rpx` ≈ 290pt, leaving the app stranded in a narrow
  // column on phones. Override inline so weapp uses the full screen width.
  const appStyle = process.env.TARO_ENV !== 'h5' ? { maxWidth: 'none' } : undefined;

  return (
    <View className={styles.app} style={appStyle}>
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
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onRemoveTile={(t) => dispatch({ type: 'REMOVE_HAND_TILE', tile: t })}
          onRemoveMeld={(meldType, index) => dispatch({ type: 'REMOVE_MELD', meldType: meldType as any, index })}
          onClear={() => dispatch({ type: 'CLEAR_ALL' })}
        />

        {currentResult && discardAnalysisInputs && (
          <ResultDisplay
            result={currentResult}
            winningTile={state.winningTile}
            expandedFanName={state.expandedFanName}
            onExpandFan={(name) => dispatch({ type: 'EXPAND_FAN', name })}
            handCounts={subtractMelds(discardAnalysisInputs.allCounts, discardAnalysisInputs.melds)}
            lockedMelds={discardAnalysisInputs.melds}
            game={discardAnalysisInputs.game}
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
          <FanPotential
            allCounts={fanPotentialInputs.allCounts}
            lockedMelds={fanPotentialInputs.melds}
            game={fanPotentialInputs.game}
            totalCount={fanPotentialInputs.totalCount}
            expectedCount={fanPotentialInputs.expectedCount}
          />
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
