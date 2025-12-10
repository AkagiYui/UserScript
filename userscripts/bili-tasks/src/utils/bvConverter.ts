/**
 * BV号与AV号互转工具
 * 基于 https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/bvid_desc.md
 */

const XOR_CODE = 23442827791579n;
const MASK_CODE = 2251799813685247n;
const MAX_AID = 1n << 51n;
const BASE = 58n;

const data = 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';


/**
 * AV号转BV号
 * @param aid AV号
 * @returns BV号
 */
export function av2bv(aid: number) {
  const bytes = ['B', 'V', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0'];
  let bvIndex = bytes.length - 1;
  let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
  while (tmp > 0) {
    bytes[bvIndex] = data[Number(tmp % BigInt(BASE))];
    tmp = tmp / BASE;
    bvIndex -= 1;
  }
  [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
  [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
  return bytes.join('');
}

/**
 * BV号转AV号
 * @param bvid BV号
 * @returns AV号
 */
export function bv2av(bvid: string) {
  const bvidArr = Array.from(bvid);
  [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
  [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
  bvidArr.splice(0, 3);
  const tmp = bvidArr.reduce((pre, bvidChar) => pre * BASE + BigInt(data.indexOf(bvidChar)), 0n);
  return Number((tmp & MASK_CODE) ^ XOR_CODE);
}

//“bvid”恒为长度为 12 的字符串，前 3 个固定为“BV1”，后 9 个为 base58 计算结果（不包含数字 0 和大写字母 I、 O 以及小写字母 l）
//AV 最大值为 2⁵¹。

/**
 * 检查是否为有效的BV号
 * @param bvid BV号
 * @returns 是否有效
 */
export function isValidBvid(bvid: string): boolean {  
  // BV号长度为12，前3位为"BV1"
  if (typeof bvid !== 'string' || bvid.length !== 12) return false;
  if (!bvid.startsWith('BV1')) return false;
  // base58字符集，不包含0, I, O, l
  const base58 = /^[FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf]{9}$/;
  return base58.test(bvid.slice(3));
}


/**
 * 检查是否为有效的AV号
 * @param aid AV号
 * @returns 是否有效
 */
export function isValidAid(aid: number): boolean {
  // 必须为正整数且小于2^51
  return (
    typeof aid === 'number' &&
    Number.isInteger(aid) &&
    aid > 0 &&
    BigInt(aid) < MAX_AID
  );
}