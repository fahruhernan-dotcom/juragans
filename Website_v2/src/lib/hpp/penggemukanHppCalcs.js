/**
 * Calculates Simple HPP (Cash Basis)
 * Returns structured HPP metrics for domba, kambing, and sapi.
 */
export function calculateSimpleHpp({ 
  animalList = [], 
  salesList = [], 
  thisBatchOpsCosts = [], 
  healthLogs = [], 
  leftoverAdjustmentIdr = 0 
}) {
  // Modal Beli (Direct sum of animal purchase price)
  const totalModalBeli = animalList.reduce((sum, a) => sum + (Number(a.purchase_price_idr) || 0), 0);

  // Biaya Pakan Cash Basis (Excluding allocation parents)
  const totalBiayaPakan = thisBatchOpsCosts
    .filter(c => c.category === 'pakan' && c.allocation_role !== 'parent')
    .reduce((sum, c) => sum + (Number(c.amount_idr) || 0), 0);

  // Biaya Ops Lain (Excluding allocation parents, pakan, and worker wages)
  const totalBiayaOps = thisBatchOpsCosts
    .filter(c => c.category !== 'pakan' && c.category !== 'gaji' && c.allocation_role !== 'parent')
    .reduce((sum, c) => sum + (Number(c.amount_idr) || 0), 0);

  // Biaya Kesehatan (Sum of treatment_cost_idr from health logs)
  const totalBiayaKesehatan = healthLogs.reduce((sum, hl) => sum + (Number(hl.treatment_cost_idr) || 0), 0);

  // Gross HPP calculation
  const grossHpp = totalModalBeli + totalBiayaPakan + totalBiayaOps + totalBiayaKesehatan;

  // Deduct Leftover Adjustment
  const totalHpp = Math.max(0, grossHpp - Number(leftoverAdjustmentIdr));

  // Count active, sold, dead animals
  const terjualCount = animalList.filter(a => a.status === 'sold').length;
  const aktifCount = animalList.filter(a => a.status === 'active').length;
  const matiCount = animalList.filter(a => a.status === 'dead' || a.status === 'culled').length;
  const produksiCount = aktifCount + terjualCount;

  // Revenue calculation
  const salesData = salesList ?? [];
  const totalPendapatan = salesData.reduce((sum, s) => sum + (Number(s.total_revenue_idr) || 0), 0);
  const totalPendapatanLunas = salesData.filter(s => s.is_paid).reduce((sum, s) => sum + (Number(s.total_revenue_idr) || 0), 0);
  const totalHutang = totalPendapatan - totalPendapatanLunas;

  // BEP (+20% target margin)
  const hppPerEkor = produksiCount > 0 ? totalHpp / produksiCount : 0;
  const bepPerEkor = hppPerEkor * 1.20;

  const sisaHpp = totalHpp - totalPendapatan;
  const profitLoss = totalPendapatan - totalHpp;

  // Bobot aktif calculations
  const activeAnimals = animalList.filter(a => a.status === 'active');
  const totalActiveWeightKg = activeAnimals.reduce(
    (s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0
  );
  const avgActiveWeightKg = activeAnimals.length > 0 ? totalActiveWeightKg / activeAnimals.length : 0;

  const warnPakanTanpaBiaya = false;
  const ternakTanpaHarga = animalList.filter(a => !a.purchase_price_idr || Number(a.purchase_price_idr) === 0).length;
  const allDead = animalList.length > 0 && aktifCount === 0 && terjualCount === 0;

  return {
    totalModalBeli,
    totalBiayaPakan,
    totalBiayaOps,
    totalBiayaOpsLain: totalBiayaOps,
    totalBiayaGaji: 0,
    totalBiayaGajiOverhead: 0, // Wages are not dynamically calculated per batch in simple mode
    totalBiayaKesehatan,
    totalHpp,
    hppPerEkor,
    bepPerEkor,
    aktifCount,
    terjualCount,
    matiCount,
    produksiCount,
    totalPendapatan,
    totalPendapatanLunas,
    totalHutang,
    profitLoss,
    sisaHpp,
    avgActiveWeightKg,
    totalActiveWeightKg,
    warnPakanTanpaBiaya,
    ternakTanpaHarga,
    allDead,
    isSimpleMode: true,
    // Stub properties to match the expected return shape of the hook
    bepSisa: 0,
    bepSisaKas: 0,
    bepSisaPerKg: 0,
    kgPakanTotal: 0,
    hargaRataPerKg: 0,
    animalDaysBatch: 0,
    animalDaysFormulaText: '',
    overheadActiveHeadSample: 0,
    overheadPeriods: []
  };
}
