// Unit list is sourced from BRD section 5.2 (13 legal entities enumerated).
//
// The count is genuinely disputed across the source material — do not hardcode one:
//   - BRD section 2 (Background) says "12 manufacturing units"
//   - BRD section 5.1 (In scope) says "13 manufacturing units"
//   - BRD section 5.2 enumerates 13, and FR-11 says 13
//   - The planner's own workbook (Notes sheet) says "All the units - 12 Units" and
//     lists 12, omitting AGCF 3147
//   - The live MRP sheet carries material data for only 10 (no AGPD, AGCF, AGSM)
//
// These are three different facts, not one disputed number, so each is modelled
// separately: `inScope` (BRD), `recognisedByPlanner` (workbook Notes), and whether
// seed data exists. BRD section 5.4 additionally puts *livestock materials* at
// 3145 and 3147 out of scope — that is a material-level exclusion, not an entity
// one, which is the likely origin of the 12-vs-13 confusion.

export interface Unit {
  readonly code: UnitCode
  readonly entity: string
  readonly name: string
  readonly business: string
  /** Listed in BRD 5.2 as an in-scope legal entity. */
  readonly inScope: boolean
  /** Present in the planner's workbook Notes sheet unit list. */
  readonly recognisedByPlanner: boolean
}

export const UNITS = [
  { code: 'NFM', entity: '3112', name: 'National Flour Mills Company', business: 'Flour', inScope: true, recognisedByPlanner: true },
  { code: 'JFM', entity: '3113', name: 'Jebel Ali Flour Mills', business: 'Flour', inScope: true, recognisedByPlanner: true },
  { code: 'OAT', entity: '3115', name: 'Oats Plant', business: 'Oats', inScope: true, recognisedByPlanner: true },
  { code: 'EOP', entity: '3116', name: 'Edible Oil Packing', business: 'Oil', inScope: true, recognisedByPlanner: true },
  { code: 'FPM', entity: '3118', name: 'Pasta & Macaroni Manufacturing', business: 'Pasta', inScope: true, recognisedByPlanner: true },
  { code: 'AGSM', entity: '3120', name: 'Al Ghurair Starch Manufacturing', business: 'Starch', inScope: true, recognisedByPlanner: true },
  { code: 'AGFM', entity: '3121', name: 'Al Ghurair Feed Mill', business: 'Feed', inScope: true, recognisedByPlanner: true },
  { code: 'AGPK', entity: '3142', name: 'Al Ghurair Poultry', business: 'Broiler Farm', inScope: true, recognisedByPlanner: true },
  { code: 'AGLE', entity: '3143', name: 'Egg Products and Egg Albumin Manufacturing', business: 'Liquid Eggs', inScope: true, recognisedByPlanner: true },
  { code: 'AGPP', entity: '3144', name: 'Processing and Preparation of Poultry Meat', business: 'Broiler Processing', inScope: true, recognisedByPlanner: true },
  { code: 'AGPD', entity: '3145', name: 'Al Ghurair Poultry — Dubai Branch (RAK + Diamond)', business: 'Poultry Dubai', inScope: true, recognisedByPlanner: true },
  // Enumerated in BRD 5.2 but absent from the planner's own unit list.
  { code: 'AGCF', entity: '3147', name: 'Al Ghurair Farming of Poultry', business: 'Farming of Poultry', inScope: true, recognisedByPlanner: false },
  { code: 'AGHP', entity: '3148', name: 'Hatchery', business: 'Hatchery', inScope: true, recognisedByPlanner: true },
] as const satisfies readonly Unit[]

export type UnitCode =
  | 'NFM' | 'JFM' | 'OAT' | 'EOP' | 'FPM' | 'AGSM' | 'AGFM'
  | 'AGPK' | 'AGLE' | 'AGPP' | 'AGPD' | 'AGCF' | 'AGHP'

export const unitByCode = (code: UnitCode): Unit =>
  UNITS.find((u) => u.code === code) as Unit

export const unitLabel = (code: UnitCode): string => `${code} ${unitByCode(code).entity}`
