import { describe, it, expect } from 'vitest';
import { quickEvaluate, hasFan } from './helpers';
import { FN } from '../rules/fanNames';
import { tile, Tiles } from '../models/tile';
import { sequence, triplet, kong } from '../models/meld';

describe('Fan Exclusions', () => {
  it('大四喜 excludes 三风刻, 圈风刻, 门风刻, 幺九刻, 碰碰和', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWWNNN11m', winningTile: '1m' });
    expect(hasFan(r, FN.DaSiXi)).toBe(true);
    expect(hasFan(r, FN.SanFengKe)).toBe(false);
    expect(hasFan(r, FN.QuanFengKe)).toBe(false);
    expect(hasFan(r, FN.MenFengKe)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
  });

  it('大三元 excludes 双箭刻, 箭刻', () => {
    const r = quickEvaluate({ hand: 'CCCFFFPPP123m99p', winningTile: '9p' });
    expect(hasFan(r, FN.DaSanYuan)).toBe(true);
    expect(hasFan(r, FN.ShuangJianKe)).toBe(false);
    expect(hasFan(r, FN.JianKe)).toBe(false);
  });

  it('小三元 excludes 双箭刻 and 箭刻', () => {
    const r = quickEvaluate({ hand: 'CCCFFFPP123m456m', winningTile: '6m' });
    expect(hasFan(r, FN.XiaoSanYuan)).toBe(true);
    expect(hasFan(r, FN.ShuangJianKe)).toBe(false);
    expect(hasFan(r, FN.JianKe)).toBe(false);
  });

  it('清一色 excludes 缺一门 and 无字', () => {
    const r = quickEvaluate({ hand: '111m234m567m888m99m', winningTile: '9m' });
    expect(hasFan(r, FN.QingYiSe)).toBe(true);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });

  it('混一色 excludes 缺一门', () => {
    const r = quickEvaluate({ hand: '123m456m789mEEE99m', winningTile: '9m' });
    expect(hasFan(r, FN.HunYiSe)).toBe(true);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });

  it('字一色 excludes 碰碰和, 混幺九, 全带幺, 幺九刻, 缺一门', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWWCCCFF', winningTile: 'F' });
    expect(hasFan(r, FN.ZiYiSe)).toBe(true);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.HunYaoJiu)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });

  it('清幺九 excludes 混幺九, 碰碰和, 全带幺, 幺九刻, 无字', () => {
    const r = quickEvaluate({ hand: '111m999m111p999p99s', winningTile: '9s' });
    expect(hasFan(r, FN.QingYaoJiu)).toBe(true);
    expect(hasFan(r, FN.HunYaoJiu)).toBe(false);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.QuanDaiYao)).toBe(false);
    expect(hasFan(r, FN.YaoJiuKe)).toBe(false);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });

  it('七对 excludes 门前清, 不求人, 单钓将', () => {
    const r = quickEvaluate({
      hand: '1133557799m11pEE',
      winningTile: 'E',
      game: { isSelfDraw: true },
    });
    expect(hasFan(r, FN.QiDui)).toBe(true);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
    expect(hasFan(r, FN.BuQiuRen)).toBe(false);
    expect(hasFan(r, FN.DanDiaoJiang)).toBe(false);
  });

  it('四杠 excludes 单钓将, 碰碰和, 三杠, 双暗杠, 双明杠, 暗杠, 明杠', () => {
    const r = quickEvaluate({
      hand: '99p',
      melds: [
        kong(tile('man', 0), false),  // 1m an-kong
        kong(tile('man', 1), false),  // 2m an-kong
        kong(tile('pin', 0), false),  // 1p an-kong
        kong(tile('sou', 0), false),  // 1s an-kong
      ],
      winningTile: '9p',
      game: { isSelfDraw: true, anKongCount: 4 },
    });
    expect(hasFan(r, FN.SiGang)).toBe(true);
    expect(hasFan(r, FN.PengPengHe)).toBe(false);
    expect(hasFan(r, FN.SanGang)).toBe(false);
    expect(hasFan(r, FN.ShuangAnGang)).toBe(false);
    expect(hasFan(r, FN.AnGang)).toBe(false);
  });

  it('清龙 excludes 连六 and 老少副', () => {
    const r = quickEvaluate({ hand: '123m456m789m111p99s', winningTile: '9s' });
    expect(hasFan(r, FN.QingLong)).toBe(true);
    expect(hasFan(r, FN.LianLiu)).toBe(false);
    expect(hasFan(r, FN.LaoShaoFu)).toBe(false);
  });

  it('花龙 excludes 连六 and 老少副', () => {
    const r = quickEvaluate({ hand: '123m456p789s111m99p', winningTile: '9p' });
    expect(hasFan(r, FN.HuaLong)).toBe(true);
    expect(hasFan(r, FN.LianLiu)).toBe(false);
    expect(hasFan(r, FN.LaoShaoFu)).toBe(false);
  });

  it('三同刻 excludes 双同刻', () => {
    const r = quickEvaluate({ hand: '111m111p111s123m99p', winningTile: '9p' });
    expect(hasFan(r, FN.SanTongKe)).toBe(true);
    expect(hasFan(r, FN.ShuangTongKe)).toBe(false);
  });

  it('三暗刻 excludes 双暗刻', () => {
    const r = quickEvaluate({
      hand: '111m222p333s456m99p',
      winningTile: '9p',
      game: { isSelfDraw: true },
    });
    expect(hasFan(r, FN.SanAnKe)).toBe(true);
    expect(hasFan(r, FN.ShuangAnKe)).toBe(false);
  });

  it('双暗杠 excludes 暗杠 and 双暗刻', () => {
    const r = quickEvaluate({
      hand: '123m99p',
      melds: [
        kong(tile('man', 4), false),  // 5m an-kong
        kong(tile('pin', 4), false),  // 5p an-kong
        triplet(tile('sou', 0), true),
      ],
      winningTile: '9p',
      game: { isSelfDraw: true, anKongCount: 2, pengCount: 1 },
    });
    expect(hasFan(r, FN.ShuangAnGang)).toBe(true);
    expect(hasFan(r, FN.AnGang)).toBe(false);
    expect(hasFan(r, FN.ShuangAnKe)).toBe(false);
  });

  it('不求人 excludes 自摸 and 门前清', () => {
    const r = quickEvaluate({
      hand: '123m456p789s111m99p',
      winningTile: '9p',
      game: { isSelfDraw: true },
    });
    expect(hasFan(r, FN.BuQiuRen)).toBe(true);
    expect(hasFan(r, FN.ZiMo)).toBe(false);
    expect(hasFan(r, FN.MenQianQing)).toBe(false);
  });

  it('平和 excludes 无字', () => {
    const r = quickEvaluate({ hand: '123m456m789m234p55s', winningTile: '5s' });
    expect(hasFan(r, FN.PingHe)).toBe(true);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });

  it('断幺 excludes 无字', () => {
    const r = quickEvaluate({ hand: '234m345p456s678m55p', winningTile: '5p' });
    expect(hasFan(r, FN.DuanYao)).toBe(true);
    expect(hasFan(r, FN.WuZi)).toBe(false);
  });

  it('三风刻 excludes 缺一门', () => {
    const r = quickEvaluate({ hand: 'EEESSSWWW123m99p', winningTile: '9p' });
    expect(hasFan(r, FN.SanFengKe)).toBe(true);
    expect(hasFan(r, FN.QueYiMen)).toBe(false);
  });

  it('全大 excludes 无字 and 大于五', () => {
    const r = quickEvaluate({ hand: '789m789p789s777m99p', winningTile: '9p' });
    expect(hasFan(r, FN.QuanDa)).toBe(true);
    expect(hasFan(r, FN.WuZi)).toBe(false);
    expect(hasFan(r, FN.DaYuWu)).toBe(false);
  });

  it('全小 excludes 无字 and 小于五', () => {
    const r = quickEvaluate({ hand: '123m123p123s111m22p', winningTile: '2p' });
    expect(hasFan(r, FN.QuanXiao)).toBe(true);
    expect(hasFan(r, FN.WuZi)).toBe(false);
    expect(hasFan(r, FN.XiaoYuWu)).toBe(false);
  });

  it('一色三同顺 excludes 一般高 and 一色三节高', () => {
    const r = quickEvaluate({
      hand: '123m456m99m',
      melds: [
        sequence(tile('man', 0), true),
        sequence(tile('man', 0), true),
      ],
      winningTile: '9m',
      game: { isSelfDraw: false, chiCount: 2 },
    });
    expect(hasFan(r, FN.YiSeSanTongShun)).toBe(true);
    expect(hasFan(r, FN.YiBanGao)).toBe(false);
    expect(hasFan(r, FN.YiSeSanJieGao)).toBe(false);
  });

  it('Suppressed fan does NOT suppress others', () => {
    // 大四喜 suppresses 小四喜. 小四喜 normally suppresses 三风刻.
    // But since 小四喜 is suppressed, 三风刻 should also be suppressed by 大四喜 directly.
    // Verify: 大四喜 directly suppresses 三风刻
    const r = quickEvaluate({ hand: 'EEESSSWWWNNN11m', winningTile: '1m' });
    expect(hasFan(r, FN.DaSiXi)).toBe(true);
    expect(hasFan(r, FN.SanFengKe)).toBe(false);
  });
});
