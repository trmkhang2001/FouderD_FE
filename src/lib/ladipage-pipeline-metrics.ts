export type LadipageStageSummary = {
  key: string;
  label: string;
  count: number;
  amount?: string | null;
  ratio: number | null;
};

/** Bỏ dấu, chữ hoa — dùng so khớp nhãn stage Ladipage */
export function normalizeViLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export type LadipageStageCounts = {
  moi: number;
  hoanTien: number;
  tiepCan: number;
  thuyetPhuc: number;
  vaoNhomZalo: number;
  thanhToan: number;
};

/**
 * Gom count theo nhãn phổ biến từ Ladipage (thứ tự ưu tiên tránh trùng).
 */
export function countsFromStages(
  stages: LadipageStageSummary[],
): LadipageStageCounts {
  const out: LadipageStageCounts = {
    moi: 0,
    hoanTien: 0,
    tiepCan: 0,
    thuyetPhuc: 0,
    vaoNhomZalo: 0,
    thanhToan: 0,
  };

  for (const st of stages) {
    const n = normalizeViLabel(st.label);
    const c = st.count;

    if (
      n.includes("THANH TOAN") ||
      n.includes("DAT THANH TOAN") ||
      n.includes("THANH TOAN THANH CONG")
    ) {
      out.thanhToan += c;
      continue;
    }
    if (n.includes("ZALO") || n.includes("NHOM ZALO") || n.includes("VAO NHOM")) {
      out.vaoNhomZalo += c;
      continue;
    }
    if (n.includes("THUYET PHUC")) {
      out.thuyetPhuc += c;
      continue;
    }
    if (n.includes("TIEP CAN")) {
      out.tiepCan += c;
      continue;
    }
    if (n.includes("HOAN TIEN")) {
      out.hoanTien += c;
      continue;
    }
    if (n === "MOI" || (n.includes("MOI") && !n.includes("TIEP"))) {
      out.moi += c;
      continue;
    }
  }

  return out;
}

export type LadipageDerivedRatios = {
  /** MỚI / (Thanh toán + Vào nhóm Zalo) */
  tyLeChuyenDoiMua: number | null;
  /** Vào nhóm Zalo / (Thanh toán + Vào nhóm Zalo) */
  tyLeZaloTrongNhomThanhToanZalo: number | null;
  /** (MỚI + Vào nhóm Zalo) / (Thanh toán + Vào nhóm Zalo) = tổng hai tỉ lệ trên */
  tyLeTongHaiTren: number | null;
  /** (Tiếp cận + Thuyết phục) / MỚI */
  tyLeTuongTacTrenMoi: number | null;
  /** Vào nhóm Zalo / Đã thanh toán */
  tyLeZaloTrenThanhToan: number | null;
};

export function deriveLadipageRatios(c: LadipageStageCounts): LadipageDerivedRatios {
  const denom = c.thanhToan + c.vaoNhomZalo;
  const tyLeChuyenDoiMua = denom > 0 ? c.moi / denom : null;
  const tyLeZaloTrongNhomThanhToanZalo = denom > 0 ? c.vaoNhomZalo / denom : null;
  const tyLeTongHaiTren =
    denom > 0 ? (c.moi + c.vaoNhomZalo) / denom : null;
  const tyLeTuongTacTrenMoi =
    c.moi > 0 ? (c.tiepCan + c.thuyetPhuc) / c.moi : null;
  const tyLeZaloTrenThanhToan =
    c.thanhToan > 0 ? c.vaoNhomZalo / c.thanhToan : null;

  return {
    tyLeChuyenDoiMua,
    tyLeZaloTrongNhomThanhToanZalo,
    tyLeTongHaiTren,
    tyLeTuongTacTrenMoi,
    tyLeZaloTrenThanhToan,
  };
}

export function formatRatio(r: number | null, digits = 1): string {
  if (r == null || Number.isNaN(r)) return "—";
  return `${(r * 100).toFixed(digits)}%`;
}
