/**
 * Planning configuration. Every value here is a business decision, not a
 * constant — each is surfaced in the UI and changeable without a code release.
 */
export interface PlanningConfig {
  /**
   * Multiplier on stdev(L6M) inside AMC.
   *
   * KNOWN DEFECT (carried, not silently reproduced): AMC already embeds a
   * variability buffer via `+ 1 x stdev(L6M)`, and MSL then adds `safetyDays`
   * of cover on top. That is very likely double-counting. The live workbook
   * does exactly this today, so it is NOT a drafting error in the BRD — it is
   * current behaviour. It is implemented as written but exposed as this named,
   * configurable factor and shown as its own line in the calculation trail, so
   * it is visible and can be dialled to 0 without touching the engine.
   */
  safetyBufferFactor: number
  /** Days of consumption below which a line is flagged as below cover. */
  lowCoverDays: number
  /** Days of cover above which a line is flagged as overstocked. */
  highCoverDays: number
  /**
   * OPEN QUESTION (BRD gap 1): is inventory close per-unit or group-wide?
   * The BRD is consistent about per-unit — design principle ("each unit can run
   * its own plan without waiting for another unit to close inventory"), pain
   * point fixed by "Run calendar per unit", and the data table row
   * "Unit close calendar | Finance | Sets the earliest valid run date per unit".
   * A squad call instead said group-wide on the second working day, which
   * contradicts the document it derives from. Defaulting to the BRD position.
   */
  inventoryClose: 'per-unit' | 'group-wide'
  /** Number of months of forecast covered by Logic 1. BRD 13.4: M + M+1. */
  forecastMonths: number
}

export const DEFAULT_CONFIG: PlanningConfig = {
  safetyBufferFactor: 1,
  // OPEN QUESTION (BRD gap 3): no tolerance bands are defined anywhere in the
  // source material. These are sensible defaults, surfaced in the run panel.
  lowCoverDays: 15,
  highCoverDays: 120,
  inventoryClose: 'per-unit',
  forecastMonths: 2,
}
