// Cálculo único de Subtotal / IVA / Total para cotizaciones (pantalla y PDFs).
// El total se redondea a centavos a partir del subtotal sin recortar y el IVA
// se obtiene como diferencia, así Subtotal + IVA = Total siempre cuadra.
// Ej: P. Neto 46,360.3448 (53,778 / 1.16) → Subtotal 46,360.34, IVA 7,417.66, Total 53,778.00

export const IVA_RATE = 0.16;

export const round2 = (n) => Math.round((Number(n) || 0) * 100 + Number.EPSILON) / 100;

const toNum = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

// Importe sin redondear de la partida; si el importe guardado no corresponde
// a cantidad × P. Neto se respeta el importe guardado.
const importeExacto = (p) => {
  const importe = toNum(p?.importe);
  const exacto = toNum(p?.cantidad) * toNum(p?.precioUnitario);
  if (Number.isFinite(exacto) && (!Number.isFinite(importe) || Math.abs(exacto - importe) < 0.01)) {
    return exacto;
  }
  return Number.isFinite(importe) ? importe : 0;
};

export function computeQuoteTotals(partidas) {
  const subtotalExacto = (Array.isArray(partidas) ? partidas : [])
    .reduce((sum, p) => sum + importeExacto(p), 0);
  const subtotal = round2(subtotalExacto);
  const total = round2(subtotalExacto * (1 + IVA_RATE));
  const iva = round2(total - subtotal);
  return { subtotal, iva, total };
}
