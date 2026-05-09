// Single source of truth for common two-level public suffixes
export const TWO_LEVEL_SUFFIXES = new Set([
  'co.uk','org.uk','ac.uk','gov.uk','net.uk','ltd.uk','plc.uk','me.uk','sch.uk',
  'com.au','net.au','org.au','edu.au','gov.au','asn.au','id.au',
  'co.jp','or.jp','ne.jp','ac.jp','go.jp','ed.jp','gr.jp',
  'co.in','org.in','net.in','gov.in','ac.in','edu.in','gen.in','firm.in','ind.in',
  'com.br','org.br','net.br','gov.br','edu.br','mil.br',
  'co.kr','or.kr','ne.kr','go.kr','ac.kr','re.kr','pe.kr',
  'com.sg','org.sg','net.sg','gov.sg','edu.sg','per.sg',
  'com.cn','net.cn','org.cn','gov.cn','edu.cn','ac.cn',
  'com.tw','org.tw','net.tw','gov.tw','edu.tw',
  'com.mx','org.mx','net.mx','gob.mx','edu.mx',
  'co.za','org.za','net.za','gov.za','ac.za','alt.za','web.za',
  'co.nz','org.nz','net.nz','govt.nz','ac.nz','maori.nz',
  'com.ar','org.ar','net.ar','gov.ar','edu.ar','int.ar',
  'com.ua','org.ua','net.ua','gov.ua','edu.ua',
]);

export function isTwoLevelSuffix(s) {
  if (!s) return false;
  return TWO_LEVEL_SUFFIXES.has(String(s).toLowerCase());
}
