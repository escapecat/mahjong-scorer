export interface FanInfo {
  name: string;
  points: number;
  description: string;
  exampleTiles: string;
}

/** All 81 fan entries for the 番表 (Fan Table) reference page */
export const ALL_FANS: FanInfo[] = [
  // 88番
  { name: '大四喜', points: 88, description: '由4副风牌的刻子(杠)组成的和牌。不计圈风刻、门风刻、三风刻、幺九刻、碰碰和', exampleTiles: 'EEE SSS WWW NNN CC' },
  { name: '大三元', points: 88, description: '和牌中，有中发白3副刻子。不计双箭刻、箭刻', exampleTiles: 'CCC FFF PPP 123m 99p' },
  { name: '绿一色', points: 88, description: '由23468条及发字中的任何牌组成的和牌', exampleTiles: '222333444666s FF' },
  { name: '九莲宝灯', points: 88, description: '由一种花色序数牌按1112345678999组成的门清九面听。不计清一色、幺九刻、门前清；自摸记不求人', exampleTiles: '1112345678999m 5m' },
  { name: '四杠', points: 88, description: '4个杠（暗杠加计）。不计单钓将、碰碰和', exampleTiles: '1111m 2222m 3333p 4444s 55p' },
  { name: '连七对', points: 88, description: '由一种花色序数牌组成序数相连的7个对子的和牌。不计清一色、七对、单钓将、门前清；自摸记不求人', exampleTiles: '11223344556677m' },
  { name: '十三幺', points: 88, description: '由3种序数牌一九牌、7种字牌及其中一对作将。不计五门齐、单钓将、门前清、混幺九；自摸记不求人', exampleTiles: '1m 9m 1p 9p 1s 9s E S W N C F P 1m' },

  // 64番
  { name: '清幺九', points: 64, description: '由序数牌一、九刻子组成的和牌。不计碰碰和、全带幺、幺九刻、无字（可加双同刻、三同刻）', exampleTiles: '111999m 111999p 99s' },
  { name: '小四喜', points: 64, description: '和牌时有风牌的3副刻子及将牌。不计三风刻、幺九刻', exampleTiles: 'EEE SSS WWW NN 11m' },
  { name: '小三元', points: 64, description: '和牌时有箭牌的两副刻子及将牌。不计双箭刻、箭刻', exampleTiles: 'CCC FFF PP 123m' },
  { name: '字一色', points: 64, description: '由字牌的刻子(杠)、将组成的和牌。不计碰碰和、混幺九、全带幺、幺九刻、缺一门', exampleTiles: 'EEE SSS WWW NNN CC' },
  { name: '四暗刻', points: 64, description: '包含4个暗刻的和牌。不计门前清、碰碰和、三暗刻、双暗刻、不求人', exampleTiles: '111m 222m 333p 444s 55p' },
  { name: '一色双龙会', points: 64, description: '由一种花色的两个老少副，5作将的和牌。不计平和、七对、清一色、一般高、老少副、缺一门、无字', exampleTiles: '123789m 123789m 55m' },

  // 48番
  { name: '一色四同顺', points: 48, description: '一种花色4副序数相同的顺子。不计一色三节高、一般高、四归一、一色三同顺、缺一门', exampleTiles: '123m 123m 123m 123m 99p' },
  { name: '一色四节高', points: 48, description: '一种花色4副依次递增一位数字的刻子。不计一色三同顺、一色三节高、碰碰和、缺一门', exampleTiles: '111m 222m 333m 444m 55p' },

  // 32番
  { name: '一色四步高', points: 32, description: '一种花色4副依次递增一位或二位数字的顺子。不计一色三步高、缺一门', exampleTiles: '123m 234m 345m 456m 99p' },
  { name: '三杠', points: 32, description: '3个杠。不计双暗杠、双明杠、暗杠、明杠、明暗杠', exampleTiles: '1111m 2222p 3333p 55s' },
  { name: '混幺九', points: 32, description: '由字牌和序数牌一、九的刻子及将牌组成的和牌。不计碰碰和、幺九刻、全带幺', exampleTiles: '111m 999p EEE CC' },

  // 24番
  { name: '七对', points: 24, description: '由7个对子组成的和牌。不计门前清、不求人、单钓将', exampleTiles: '11223344556677m' },
  { name: '七星不靠', points: 24, description: '由7张不同字牌和三组147/258/369中任意7张序数牌组成。不计五门齐、不求人、单钓将、门前清、全不靠', exampleTiles: '147m 258p 369s E S W N C F P' },
  { name: '全双刻', points: 24, description: '由2、4、6、8序数牌的刻子、将牌组成的和牌。不计碰碰和、断幺、无字', exampleTiles: '222m 444m 666m 888m 22p' },
  { name: '清一色', points: 24, description: '由一种花色的序数牌组成的和牌。不计缺一门、无字', exampleTiles: '123456789m 111m 99m' },
  { name: '一色三同顺', points: 24, description: '一种花色3副序数相同的顺子。不计一色三节高、一般高', exampleTiles: '123m 123m 123m 456m 99m' },
  { name: '一色三节高', points: 24, description: '一种花色3副依次递增一位数字的刻子。不计一色三同顺', exampleTiles: '111m 222m 333m 456m 99m' },
  { name: '全大', points: 24, description: '由序数牌789组成的和牌。不计无字、大于五', exampleTiles: '789m 789p 789s 777m 99p' },
  { name: '全中', points: 24, description: '由序数牌456组成的和牌。不计断幺、无字', exampleTiles: '456m 456p 456s 444m 66p' },
  { name: '全小', points: 24, description: '由序数牌123组成的和牌。不计无字、小于五', exampleTiles: '123m 123p 123s 111m 22p' },

  // 16番
  { name: '清龙', points: 16, description: '一种花色的123、456、789三组顺子', exampleTiles: '123m 456m 789m 111p 99s' },
  { name: '三色双龙会', points: 16, description: '2种花色2个老少副、另一种花色5作将的和牌。不计喜相逢、老少副、无字、平和', exampleTiles: '123789m 123789p 55s' },
  { name: '一色三步高', points: 16, description: '一种花色3副依次递增一位或二位数字的顺子', exampleTiles: '123m 234m 345m 678m 99p' },
  { name: '全带五', points: 16, description: '每副牌及将牌必须有5的序数牌。不计断幺、无字', exampleTiles: '345m 456m 567p 555s 55m' },
  { name: '三同刻', points: 16, description: '3个序数相同的刻子(杠)。不计双同刻', exampleTiles: '111m 111p 111s 123m 99p' },
  { name: '三暗刻', points: 16, description: '3个暗刻。不计双暗刻', exampleTiles: '111m 222p 333s 456m 99p' },

  // 12番
  { name: '全不靠', points: 12, description: '由7张不同字牌与三组147/258/369任意14张组成。不计五门齐、不求人、单钓将、门前清', exampleTiles: '147m 258p 369s E S W N C F P' },
  { name: '组合龙', points: 12, description: '包含147、258、369三组组成的和牌', exampleTiles: '147m 258p 369s 111m 99p' },
  { name: '大于五', points: 12, description: '由序数牌6789组成的和牌。不计无字', exampleTiles: '6789m 678p 789s 88m' },
  { name: '小于五', points: 12, description: '由序数牌1234组成的和牌。不计无字', exampleTiles: '1234m 123p 234s 11m' },
  { name: '三风刻', points: 12, description: '3个风刻。不计缺一门', exampleTiles: 'EEE SSS WWW 123m 99p' },

  // 8番
  { name: '花龙', points: 8, description: '包含三色123/456/789组成1-9序数牌的和牌', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '推不倒', points: 8, description: '由1234589筒、245689条、白板组成的和牌。不计缺一门', exampleTiles: '1234589p 245689s PP' },
  { name: '三色三同顺', points: 8, description: '3种花色3副序数相同的顺子。不计喜相逢', exampleTiles: '123m 123p 123s 456m 99p' },
  { name: '三色三节高', points: 8, description: '3种花色3副依次递增一位数字的刻子', exampleTiles: '111m 222p 333s 456m 99p' },
  { name: '无番和', points: 8, description: '和牌后数不出任何番种分（不计其它所有番型）', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '妙手回春', points: 8, description: '自摸牌墙上最后一张牌和牌。不计自摸', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '海底捞月', points: 8, description: '和打出的最后一张牌', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '杠上开花', points: 8, description: '开杠补张成和，不计自摸', exampleTiles: '1111m 123p 456s 789m 99p' },
  { name: '抢杠和', points: 8, description: '和别人开明杠的牌。不计和绝张', exampleTiles: '1111m 123p 456s 789m 99p' },

  // 6番
  { name: '碰碰和', points: 6, description: '由4副刻子(或杠)、将牌组成的和牌', exampleTiles: '111m 222m 333p 444s 99m' },
  { name: '混一色', points: 6, description: '由一种花色序数牌及字牌组成的和牌。不计缺一门', exampleTiles: '123m 456m 789m EE 99m' },
  { name: '三色三步高', points: 6, description: '3种花色3副依次递增一位数字的顺子', exampleTiles: '123m 234p 345s 456m 99p' },
  { name: '五门齐', points: 6, description: '和牌时3种序数牌、风、箭牌齐全', exampleTiles: '123m 456p 789s E C 99m' },
  { name: '全求人', points: 6, description: '全靠吃牌、碰牌、单钓别人打出的牌和牌。不计单钓将', exampleTiles: '111m 222p 333s 456m 99p' },
  { name: '双箭刻', points: 6, description: '2副箭刻。不计箭刻', exampleTiles: 'CCC FFF 123m 99p' },
  { name: '双暗杠', points: 6, description: '2个暗杠。不计双暗刻、暗杠', exampleTiles: '1111m 2222p 123s 456m 99p' },

  // 4番
  { name: '全带幺', points: 4, description: '和牌时每副牌、将牌均含幺牌（1/9/字）', exampleTiles: '123m 789m 111p 999s 11m' },
  { name: '不求人', points: 4, description: '没有吃牌、碰牌（包括明杠），自摸和牌。不计门前清、自摸', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '双明杠', points: 4, description: '2个明杠。不计明杠', exampleTiles: '1111m 2222p 123s 456m 99p' },
  { name: '和绝张', points: 4, description: '和牌池、桌面已亮明的第4张牌', exampleTiles: '111m 222p 333s 444m 99p' },

  // 2番
  { name: '箭刻', points: 2, description: '中、发、白的刻子(或杠)', exampleTiles: 'CCC 123m 456p 789s 99m' },
  { name: '圈风刻', points: 2, description: '与圈风相同的风刻。计圈风刻的那副刻子不再计幺九刻', exampleTiles: 'EEE 123m 456p 789s 99m' },
  { name: '门风刻', points: 2, description: '与本门风相同的风刻。计门风刻的那副刻子不再计幺九刻', exampleTiles: 'SSS 123m 456p 789s 99m' },
  { name: '门前清', points: 2, description: '没有吃、碰、明杠，和别人打出的牌', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '平和', points: 2, description: '由4副顺子及序数牌作将组成的和牌。不计无字', exampleTiles: '123m 456m 789m 234p 55s' },
  { name: '四归一', points: 2, description: '和牌中，有4张相同的牌归于一家的顺、刻子、对、将牌中（杠不计）', exampleTiles: '1111m 123p 456s 789m 99p' },
  { name: '双同刻', points: 2, description: '2副序数相同的刻子', exampleTiles: '111m 111p 123m 456p 99s' },
  { name: '双暗刻', points: 2, description: '2个暗刻', exampleTiles: '111m 222p 456s 789m 99p' },
  { name: '暗杠', points: 2, description: '自抓4张相同的牌开杠', exampleTiles: '1111m 123p 456s 789m 99p' },
  { name: '断幺', points: 2, description: '和牌中没有一、九及字牌。不计无字', exampleTiles: '234m 345p 456s 678m 55p' },

  // 1番
  { name: '一般高', points: 1, description: '一种花色2副序数相同的顺子', exampleTiles: '123m 123m 456p 789s 99m' },
  { name: '喜相逢', points: 1, description: '2种花色2副序数相同的顺子', exampleTiles: '123m 123p 456m 789s 99m' },
  { name: '连六', points: 1, description: '一种花色6张相连接的序数牌', exampleTiles: '123456m 789p 111s 99m' },
  { name: '老少副', points: 1, description: '一种花色牌的123、789两组顺子', exampleTiles: '123m 789m 456p 111s 99m' },
  { name: '幺九刻', points: 1, description: '序数牌一、九的刻子（或杠），字牌的刻子（或杠）', exampleTiles: '111m 999p EEE' },
  { name: '明杠', points: 1, description: '有暗刻，碰别人打出的那张牌开杠或抓进一张与已碰明刻相同的牌开杠', exampleTiles: '1111m 123p 456s 789m 99p' },
  { name: '缺一门', points: 1, description: '和牌中缺少一种花色序数牌', exampleTiles: '123m 456m 789m 111s 99s' },
  { name: '无字', points: 1, description: '和牌中没有字牌', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '边张', points: 1, description: '单和123的3及789的7或1233和3、7789和7等', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '坎张', points: 1, description: '和2张牌之间的那张牌（4556和5亦为坎张）', exampleTiles: '456m 123p 789s 111m 99p' },
  { name: '单钓将', points: 1, description: '单钓一张将牌', exampleTiles: '123m 456p 789s 111m 55p' },
  { name: '自摸', points: 1, description: '自己抓进牌成和牌', exampleTiles: '123m 456p 789s 111m 99p' },
  { name: '花牌', points: 1, description: '春夏秋冬，梅兰竹菊，每花计一分', exampleTiles: '' },
];

export const FAN_CATEGORIES = [88, 64, 48, 32, 24, 16, 12, 8, 6, 4, 2, 1] as const;

/** Parse exampleTiles like "EEE SSS 123m 99p" into a list of tile codes for icon rendering */
export function parseExampleTiles(s: string): string[] {
  if (!s) return [];
  const result: string[] = [];
  for (const token of s.split(/\s+/)) {
    if (!token) continue;
    // Check if token ends with m/p/s (number tiles)
    const last = token[token.length - 1];
    if (last === 'm' || last === 'p' || last === 's') {
      const digits = token.slice(0, -1);
      for (const d of digits) {
        if (d >= '0' && d <= '9') {
          result.push(`${d}${last}`);
        }
      }
    } else {
      // Honor tile token like "EEE" or "C"
      const ch0 = token[0];
      if (['E', 'S', 'W', 'N', 'C', 'F', 'P'].includes(ch0)) {
        if (token.split('').every(c => c === ch0)) {
          for (let i = 0; i < token.length; i++) {
            result.push(ch0);
          }
        }
      }
    }
  }
  return result;
}
