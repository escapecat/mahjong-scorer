import { describe, it, expect } from 'vitest';
import { quickEvaluate, hasFan } from './helpers';
import { FN } from '../rules/fanNames';
import { tile, Tiles } from '../models/tile';
import { sequence, triplet, kong } from '../models/meld';

/**
 * Tests that high-value fans correctly cascade their exclusions to all relevant lower fans.
 */
describe('High Fan Cascade Exclusions - 88番', () => {
  it('大四喜 cascade — excludes wind-related lower fans', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWWNNN11m', winningTile: '1m' });
    expect(hasFan(r, FN.DaSiXi)).toBe(true);
    expect(hasFan(r, FN.XiaoSiXi)).toBe(false);
    expect(hasFan(r, FN.SanFengKe)).toBe(false);
    expect(hasFan(r, FN.QuanFengKe)).toBe(false);
    expect(hasFan(r, FN.MenFengKe)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
  });

  it('大三元 cascade — excludes dragon-related lower fans', () => {
    const r = quickEvaluate({ hand: 'CCCFFFPPP123m99p', winningTile: '9p' });
    expect(hasFan(r, FN.DaSanYuan)).toBe(true);
    expect(hasFan(r, FN.XiaoSanYuan)).toBe(false);
    expect(hasFan(r, FN.ShuangJianKe)).toBe(false);
    expect(hasFan(r, FN.JianKe)).toBe(false);
  });

  it('绿一色 with 发 — excludes 混一色', () => {
    const r = quickEvaluate({ hand: '222s333s444s666sFF', winningTile: 'F' });
    expect(hasFan(r, FN.LvYiSe)).toBe(true);
    expect(hasFan(r, FN.HunYiSe)).toBe(false);
  });

  it('绿一色 without 发 — includes 清一色', () => {
    const r = quickEvaluate({ hand: '222333444666s88s', winningTile: '8s' });
    expect(hasFan(r, FN.LvYiSe)).toBe(true);
    expect(hasFan(r, FN.QingYiSe)).toBe(true); // not excluded
  });

  it('九莲宝灯 cascade', () => {
    const r = quickEvaluate({ hand: '1112345678999m5m', winningTile: '5m' });
    expect(hasFan(r, FN.JiuLianBaoDeng)).toBe(true);
    expect(hasFan(r, FN.QingYiSe)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
  });

  it('十三幺 cascade', () => {
    const r = quickEvaluate({ hand: '1m9m1p9p1s9sESWNCFP1m', winningTile: '1m' });
    expect(hasFan(r, FN.ShiSanYao)).toBe(true);
    expect(hasFan(r, FN.WuMenQi)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
    expect(hasFan(r, FN.DanDiaoJiang)).toBe(false);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
    expect(hasFan(r, FN.HunYaoJiu)).toBe(false);
  });

  it('连七对 cascade', () => {
    const r = quickEvaluate({ hand: '11223344556677m', winningTile: '7m' });
    expect(hasFan(r, FN.LianQiDui)).toBe(true);
    expect(hasFan(r, FN.QingYiSe)).toBe(false);
    expect(hasFan(r, FN.QiDui)).toBe(false);
    expect(hasFan(r, FN.DanDiaoJiang)).toBe(false);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
  });

  it('四杠 cascade', () => {
    const r = quickEvaluate({
      hand: '99p',
      melds: [
        kong(tile('man', 0), false),
        kong(tile('man', 1), false),
        kong(tile('pin', 0), false),
        kong(tile('sou', 0), false),
      ],
      winningTile: '9p',
      game: { isSelfDraw: true, anKongCount: 4 },
    });
    expect(hasFan(r, FN.SiGang)).toBe(true);
    expect(hasFan(r, FN.SanGang)).toBe(false);
    expect(hasFan(r, FN.ShuangAnGang)).toBe(false);
    expect(hasFan(r, FN.AnGang)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.DanDiaoJiang)).toBe(false);
  });
});

describe('High Fan Cascade Exclusions - 64番', () => {
  it('清幺九 cascade', () => {
    const r = quickEvaluate({ hand: '111m999m111p999p99s', winningTile: '9s' });
    expect(hasFan(r, FN.QingYaoJiu)).toBe(true);
    expect(hasFan(r, FN.HunYaoJiu)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });

  it('小四喜 cascade', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWWNN123m', winningTile: '3m' });
    expect(hasFan(r, FN.XiaoSiXi)).toBe(true);
    expect(hasFan(r, FN.SanFengKe)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
  });

  it('小三元 cascade', () => {
    const r = quickEvaluate({ hand: 'CCCFFFPP123m456m', winningTile: '6m' });
    expect(hasFan(r, FN.XiaoSanYuan)).toBe(true);
    expect(hasFan(r, FN.ShuangJianKe)).toBe(false);
    expect(hasFan(r, FN.JianKe)).toBe(false);
  });

  it('字一色 cascade', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWWCCCFF', winningTile: 'F' });
    expect(hasFan(r, FN.ZiYiSe)).toBe(true);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.HunYaoJiu)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });

  it('四暗刻 cascade', () => {
    const r = quickEvaluate({
      hand: '111m222m333p444s55p',
      winningTile: '5p',
      game: { isSelfDraw: true },
    });
    expect(hasFan(r, FN.SiAnKe)).toBe(true);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.SanAnKe)).toBe(false);
    expect(hasFan(r, FN.ShuangAnKe)).toBe(false);
    expect(hasFan(r, FN.BuQiuRen)).toBe(false);
    expect(hasFan(r, FN.ZiMo)).toBe(false);
  });

  it('一色双龙会 cascade', () => {
    const r = quickEvaluate({ hand: '123m789m123m789m55m', winningTile: '5m' });
    expect(hasFan(r, FN.YiSeShuangLongHui)).toBe(true);
    expect(hasFan(r, FN.PingHe)).toBe(false);
    expect(hasFan(r, FN.QingYiSe)).toBe(false);
    expect(hasFan(r, FN.YiBanGao)).toBe(false);
    expect(hasFan(r, FN.LaoShaoFu)).toBe(false);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });
});

describe('High Fan Cascade Exclusions - 48番', () => {
  it('一色四同顺 cascade', () => {
    const r = quickEvaluate({
      hand: '123m123m99p',
      melds: [
        sequence(tile('man', 0), true),
        sequence(tile('man', 0), true),
      ],
      winningTile: '9p',
      game: { isSelfDraw: false, chiCount: 2 },
    });
    expect(hasFan(r, FN.YiSeSiTongShun)).toBe(true);
    expect(hasFan(r, FN.YiSeSanJieGao)).toBe(false);
    expect(hasFan(r, FN.YiBanGao)).toBe(false);
    expect(hasFan(r, FN.SiGuiYi)).toBe(false);
    expect(hasFan(r, FN.YiSeSanTongShun)).toBe(false);
  });

  it('一色四节高 cascade', () => {
    const r = quickEvaluate({ hand: '111m222m333m444m55p', winningTile: '5p' });
    expect(hasFan(r, FN.YiSeSiJieGao)).toBe(true);
    expect(hasFan(r, FN.YiSeSanTongShun)).toBe(false);
    expect(hasFan(r, FN.YiSeSanJieGao)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });
});

describe('High Fan Cascade Exclusions - 32番', () => {
  it('一色四步高 cascade', () => {
    const r = quickEvaluate({ hand: '123m234m345m456m99p', winningTile: '9p' });
    expect(hasFan(r, FN.YiSeSiBuGao)).toBe(true);
    expect(hasFan(r, FN.YiSeSanBuGao)).toBe(false);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });

  it('混幺九 cascade', () => {
    const r = quickEvaluate({ hand: '111m999pEEECCC99s', winningTile: '9s' });
    expect(hasFan(r, FN.HunYaoJiu)).toBe(true);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
  });
});

describe('Cross-Fan Interactions', () => {
  it('清一色 + 一色三同顺 — both fire', () => {
    const r = quickEvaluate({
      hand: '123m456m99m',
      melds: [
        sequence(tile('man', 0), true),
        sequence(tile('man', 0), true),
      ],
      winningTile: '9m',
      game: { chiCount: 2 },
    });
    expect(hasFan(r, FN.QingYiSe)).toBe(true);
    expect(hasFan(r, FN.YiSeSanTongShun)).toBe(true);
  });

  it('混一色 + 三风刻', () => {
    const r = quickEvaluate({ hand: '123m456m789mEEE99m', winningTile: '9m' });
    // Only 1 wind triplet, no 三风刻
    expect(hasFan(r, FN.HunYiSe)).toBe(true);
    expect(hasFan(r, FN.SanFengKe)).toBe(false);
  });

  it('断幺 + 平和', () => {
    const r = quickEvaluate({ hand: '234m345p456s678m55p', winningTile: '5p' });
    expect(hasFan(r, FN.DuanYao)).toBe(true);
    expect(hasFan(r, FN.PingHe)).toBe(true);
  });

  it('Multiple 幺九刻 (2 terminal triplets)', () => {
    // Two terminal triplets should award 幺九刻 twice
    const r = quickEvaluate({ hand: '111m999p234m567s99m', winningTile: '9m' });
    expect(hasFan(r, FN.YaoJiuKe)).toBe(true);
    const yaoJiuCount = r.fans.filter(f => f.name === '幺九刻').length;
    expect(yaoJiuCount).toBe(2);
  });

  it('箭刻 — 2 dragon triplets becomes 双箭刻', () => {
    const r = quickEvaluate({ hand: 'CCCFFF123m456p99s', winningTile: '9s' });
    expect(hasFan(r, FN.ShuangJianKe)).toBe(true);
    expect(hasFan(r, FN.JianKe)).toBe(false); // suppressed by 双箭刻
  });

  it('明杠 + 暗杠 mix', () => {
    const r = quickEvaluate({
      hand: '123m99p',
      melds: [
        kong(tile('man', 4), true),  // 5m ming-kong
        kong(tile('pin', 4), false), // 5p an-kong
        triplet(tile('sou', 0), true),
      ],
      winningTile: '9p',
      game: { isSelfDraw: false, mingKongCount: 1, anKongCount: 1, pengCount: 1 },
    });
    expect(hasFan(r, FN.MingGang)).toBe(true);
    expect(hasFan(r, FN.AnGang)).toBe(true);
  });

  it('Self-draw kong → 杠上开花 + cascading', () => {
    const r = quickEvaluate({
      hand: '123m456p789s99p',
      melds: [kong(tile('man', 0), false)],
      winningTile: '9p',
      game: { isSelfDraw: true, isKongDraw: true, anKongCount: 1 },
    });
    expect(hasFan(r, FN.GangShangKaiHua)).toBe(true);
    expect(hasFan(r, FN.ZiMo)).toBe(false); // suppressed
  });

  it('海底捞月 suppresses 自摸', () => {
    const r = quickEvaluate({
      hand: '123m456p789s111m99p',
      winningTile: '9p',
      game: { isSelfDraw: true, isLastTile: true },
    });
    expect(hasFan(r, FN.MiaoShouHuiChun)).toBe(true);
    expect(hasFan(r, FN.ZiMo)).toBe(false);
  });

  it('抢杠和 suppresses 和绝张', () => {
    const r = quickEvaluate({
      hand: '123m456p789s111m99p',
      winningTile: '9p',
      game: { isSelfDraw: false, isRobbingKong: true, isWinningTileLast: true },
    });
    expect(hasFan(r, FN.QiangGangHe)).toBe(true);
    expect(hasFan(r, FN.HeJueZhang)).toBe(false);
  });
});

describe('Total Fan Calculation', () => {
  it('basic hand fans add up correctly', () => {
    const r = quickEvaluate({
      hand: '123m456p789s111m99p',
      winningTile: '9p',
      game: { isSelfDraw: true },
    });
    // Should at least have 不求人 (4) + 花龙 (8) + 单钓将 (1) etc
    const sum = r.fans.reduce((s, f) => s + f.points, 0);
    expect(r.totalFan).toBe(sum);
  });

  it('flowers add to total', () => {
    const r = quickEvaluate({
      hand: '123m456p789s111m99p',
      winningTile: '9p',
      game: { isSelfDraw: true, flowerCount: 4 },
    });
    expect(r.fans.some(f => f.name.startsWith('花牌'))).toBe(true);
    const flowerFan = r.fans.find(f => f.name.startsWith('花牌'));
    expect(flowerFan?.points).toBe(4);
  });
});
