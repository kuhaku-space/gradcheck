/**
 * 成績 CSV/TXT のバイト列を文字列にデコードする。
 * KOAN/SIRS の出力は Shift_JIS (CP932) だが、ユーザーが UTF-8 で保存し直した
 * ファイルにも対応するため、まず UTF-8 (fatal) を試し、失敗したら
 * Shift_JIS として読む。
 */
export function decodeCsvBytes(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('shift_jis').decode(buf)
  }
}
