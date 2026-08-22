/**
 * Scholarship Database — Real Indian Scholarships
 * ============================================================
 * Each entry sourced from official government portals, National Scholarship Portal
 * (scholarships.gov.in), state scholarship portals, and well-known private foundations.
 *
 * SOURCE TAGS:
 *   'official'  — Scheme exists on scholarships.gov.in, state portals, or verified foundation sites
 *   'demo'      — Placeholder entry for testing/demo purposes only
 *
 * PRIVACY: This file contains NO student data — it's a static reference database.
 *
 * DEADLINE NOTE: Deadlines are set for the 2026-2027 academic cycle. Exact dates are
 * realistic approximations — actual dates shift each year when portals open.
 *
 * INCOME RANGES used in eligibility:
 *   'below_1L'   →  Annual family income < ₹1,00,000
 *   '1_2.5L'     →  ₹1,00,000 – ₹2,50,000
 *   '2.5_5L'     →  ₹2,50,000 – ₹5,00,000
 *   '5_8L'       →  ₹5,00,000 – ₹8,00,000
 *   'above_8L'   →  > ₹8,00,000
 */

// Helper: income range hierarchy for ceiling checks
// A student with income 'below_1L' qualifies for a ceiling of '2.5_5L', etc.
export const INCOME_ORDER = ['below_1L', '1_2.5L', '2.5_5L', '5_8L', 'above_8L'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/**
 * The scholarship database.
 * Each entry follows the schema documented above.
 */
const scholarships = [

  // ─────────────────────────────────────────────────────────────
  // CENTRAL GOVERNMENT — National Scholarship Portal (NSP)
  // ─────────────────────────────────────────────────────────────

  // SOURCE: official — scholarships.gov.in, Ministry of Social Justice & Empowerment
  {
    id: 'nsp-prematric-sc',
    name: 'Pre-Matric Scholarship for SC Students',
    provider: 'Ministry of Social Justice & Empowerment',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['SC'],
      states: null,
      classRange: [9, 10],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹3,500/year + ₹6,000 (hosteller)',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Pre-matric scholarship for students belonging to Scheduled Castes studying in classes 9-10. Covers maintenance allowance and books/ad-hoc grant.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Social Justice & Empowerment
  {
    id: 'nsp-postmatric-sc',
    name: 'Post-Matric Scholarship for SC Students',
    provider: 'Ministry of Social Justice & Empowerment',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['SC'],
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹7,000–₹13,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Post-matric scholarship for SC students in classes 11-12 and above, covering tuition, maintenance, and study tour charges.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Tribal Affairs
  {
    id: 'nsp-prematric-st',
    name: 'Pre-Matric Scholarship for ST Students',
    provider: 'Ministry of Tribal Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['ST'],
      states: null,
      classRange: [9, 10],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹3,500/year + ₹7,000 (hosteller)',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Pre-matric scholarship for ST students in classes 9-10, aimed at reducing dropout rates among tribal communities.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Tribal Affairs
  {
    id: 'nsp-postmatric-st',
    name: 'Post-Matric Scholarship for ST Students',
    provider: 'Ministry of Tribal Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['ST'],
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹7,000–₹13,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Post-matric scholarship for ST students in classes 11-12 and above. Covers tuition fees, maintenance allowance, and book grants.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Social Justice & Empowerment
  {
    id: 'nsp-postmatric-obc',
    name: 'Post-Matric Scholarship for OBC Students',
    provider: 'Ministry of Social Justice & Empowerment',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: ['OBC'],
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹2,500–₹8,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Post-matric scholarship for OBC students with family income below ₹1.5 lakh per annum, studying in class 11 onwards.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Minority Affairs
  {
    id: 'nsp-prematric-minority',
    name: 'Pre-Matric Scholarship for Minorities',
    provider: 'Ministry of Minority Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: null,
      states: null,
      classRange: [6, 10],
      streams: null,
      minMarks: 'above_50',
      gender: null,
      minority: true,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹4,500–₹6,000/year',
    deadline: '2026-10-31',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Pre-matric scholarship for minority community students (Muslim, Christian, Sikh, Buddhist, Jain, Parsi) studying in classes 6-10.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Minority Affairs
  {
    id: 'nsp-postmatric-minority',
    name: 'Post-Matric Scholarship for Minorities',
    provider: 'Ministry of Minority Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_50',
      gender: null,
      minority: true,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹10,000/year',
    deadline: '2026-10-31',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Post-matric scholarship for students of minority communities studying in class 11 onwards.',
  },

  // SOURCE: official — scholarships.gov.in, Ministry of Minority Affairs
  {
    id: 'nsp-merit-cum-means-minority',
    name: 'Merit-cum-Means Scholarship for Minorities',
    provider: 'Ministry of Minority Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_50',
      gender: null,
      minority: true,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Up to ₹25,000/year',
    deadline: '2026-10-31',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Merit-cum-means scholarship for meritorious students of minority communities for professional and technical courses.',
  },

  // SOURCE: official — MHRD/Department of School Education
  {
    id: 'nsp-nmms',
    name: 'National Means-cum-Merit Scholarship (NMMS)',
    provider: 'Department of School Education & Literacy',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: null,
      states: null,
      classRange: [9, 12],
      streams: null,
      minMarks: 'above_55',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹12,000/year',
    deadline: '2026-10-31',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'NMMS provides scholarships to meritorious students of economically weaker sections to reduce dropouts at class 8 and encourage them to continue education up to class 12.',
  },

  // SOURCE: official — Ministry of Social Justice & Empowerment
  {
    id: 'nsp-topclass-sc',
    name: 'Top Class Education for SC Students',
    provider: 'Ministry of Social Justice & Empowerment',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: ['SC'],
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_60',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Full tuition + ₹2,200/month',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Scholarship for SC students admitted to top institutions (IITs, IIMs, NITs etc.) to cover full tuition, living expenses, books, and computer.',
  },

  // SOURCE: official — Department of Empowerment of Persons with Disabilities
  {
    id: 'nsp-prematric-disability',
    name: 'Pre-Matric Scholarship for Students with Disabilities',
    provider: 'Dept. of Empowerment of PwD',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [9, 10],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: true,
      noOtherScholarship: false,
    },
    awardAmount: '₹4,000–₹7,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Pre-matric scholarship for students with benchmark disabilities (40% or more) in classes 9-10 to promote education among PwD students.',
  },

  // SOURCE: official — Department of Empowerment of Persons with Disabilities
  {
    id: 'nsp-postmatric-disability',
    name: 'Post-Matric Scholarship for Students with Disabilities',
    provider: 'Dept. of Empowerment of PwD',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: true,
      noOtherScholarship: false,
    },
    awardAmount: '₹7,000–₹13,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Post-matric scholarship for students with disabilities studying in class 11 and above, covering tuition fees and maintenance allowance.',
  },

  // SOURCE: official — CBSE / Ministry of Education
  {
    id: 'cbse-single-girl-child',
    name: 'CBSE Single Girl Child Scholarship',
    provider: 'Central Board of Secondary Education',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_60',
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹500/month (renewable)',
    deadline: '2026-12-15',
    applicationUrl: 'https://www.cbse.gov.in/',
    description: 'Scholarship for single girl children who have passed CBSE Class 10 with 60% or more marks. Must be the only child of the parents (or twin girls).',
  },

  // SOURCE: official — Ministry of Education / AICTE
  {
    id: 'pragati-girls-aicte',
    name: 'AICTE Pragati Scholarship for Girls',
    provider: 'AICTE',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: ['Science'],
      minMarks: null,
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹50,000/year (up to 4 years)',
    deadline: '2026-12-31',
    applicationUrl: 'https://www.aicte-india.org/',
    description: 'Pragati scholarship for girl students pursuing technical education (engineering/degree). Provides tuition fee waiver and incidental charges.',
  },

  // SOURCE: official — AICTE
  {
    id: 'saksham-disability-aicte',
    name: 'AICTE Saksham Scholarship for PwD',
    provider: 'AICTE',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: ['Science'],
      minMarks: null,
      gender: null,
      minority: null,
      disability: true,
      noOtherScholarship: false,
    },
    awardAmount: '₹50,000/year (up to 4 years)',
    deadline: '2026-12-31',
    applicationUrl: 'https://www.aicte-india.org/',
    description: 'Saksham scholarship for differently-abled students pursuing technical education. Covers tuition and incidental charges.',
  },

  // SOURCE: official — Ministry of Education
  {
    id: 'nsp-pm-scholarship-wards',
    name: 'PM\'s Scholarship for Central Armed Police Forces Wards',
    provider: 'Ministry of Home Affairs',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_60',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹2,500–₹3,000/month',
    deadline: '2026-10-15',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Scholarship for wards of serving/ex/deceased CAPF & AR personnel for professional degree courses. Minimum 60% in board exams.',
  },

  // ─────────────────────────────────────────────────────────────
  // STATE-SPECIFIC SCHOLARSHIPS
  // ─────────────────────────────────────────────────────────────

  // SOURCE: official — Maharashtra Social Justice Department
  {
    id: 'mh-rajarshi-shahu',
    name: 'Rajarshi Shahu Maharaj Shikshan Shulkh Scholarship',
    provider: 'Maharashtra Social Justice Dept.',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: ['OBC', 'SC', 'ST', 'EWS'],
      states: ['Maharashtra'],
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Full tuition fee reimbursement',
    deadline: '2026-12-31',
    applicationUrl: 'https://mahadbt.maharashtra.gov.in/',
    description: 'Tuition fee scholarship for economically backward students in Maharashtra from OBC/SC/ST/EWS communities pursuing higher education.',
  },

  // SOURCE: official — Karnataka State Government
  {
    id: 'ka-postmatric-sc-st',
    name: 'Karnataka Post-Matric Scholarship for SC/ST',
    provider: 'Karnataka Social Welfare Dept.',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['SC', 'ST'],
      states: ['Karnataka'],
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹15,000/year',
    deadline: '2027-01-15',
    applicationUrl: 'https://sw.kar.nic.in/',
    description: 'Post-matric scholarship for SC/ST students domiciled in Karnataka, studying in class 11 and above.',
  },

  // SOURCE: official — UP Scholarship Portal
  {
    id: 'up-prematric-obc',
    name: 'UP Pre-Matric Scholarship for OBC Students',
    provider: 'Uttar Pradesh Scholarship Board',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: ['OBC'],
      states: ['Uttar Pradesh'],
      classRange: [9, 10],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹2,000–₹4,000/year',
    deadline: '2026-12-15',
    applicationUrl: 'https://scholarship.up.gov.in/',
    description: 'Pre-matric scholarship for OBC students from Uttar Pradesh studying in classes 9-10.',
  },

  // SOURCE: official — UP Scholarship Portal
  {
    id: 'up-postmatric-sc',
    name: 'UP Post-Matric Scholarship for SC/ST/General',
    provider: 'Uttar Pradesh Scholarship Board',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['SC', 'ST'],
      states: ['Uttar Pradesh'],
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹12,000/year',
    deadline: '2026-12-31',
    applicationUrl: 'https://scholarship.up.gov.in/',
    description: 'Post-matric scholarship for SC/ST students from Uttar Pradesh in class 11 and above.',
  },

  // SOURCE: official — Bihar Government
  {
    id: 'bihar-combined-scholarship',
    name: 'Bihar Combined Entrance Competitive Exam Scholarship',
    provider: 'Bihar Education Department',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: ['Bihar'],
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_75',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹10,000–₹25,000/year',
    deadline: '2027-01-31',
    applicationUrl: 'https://edudbt.bih.nic.in/',
    description: 'Merit-based scholarship for Bihar domiciled students scoring above 75% in board exams and pursuing higher education.',
  },

  // SOURCE: official — Tamil Nadu Government (BC/MBC)
  {
    id: 'tn-bc-mbc-scholarship',
    name: 'Tamil Nadu BC/MBC Post-Matric Scholarship',
    provider: 'Tamil Nadu BC/MBC Welfare Dept.',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: ['OBC'],
      states: ['Tamil Nadu'],
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹4,000–₹12,500/year',
    deadline: '2027-01-31',
    applicationUrl: 'https://www.tndce.gov.in/',
    description: 'Post-matric scholarship for BC/MBC community students from Tamil Nadu in class 11 and above.',
  },

  // SOURCE: official — West Bengal Government
  {
    id: 'wb-kanyashree',
    name: 'Kanyashree Prakalpa (West Bengal)',
    provider: 'West Bengal Women & Child Dev. Dept.',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: null,
      states: ['West Bengal'],
      classRange: [8, 12],
      streams: null,
      minMarks: null,
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹750/year (K1) + ₹25,000 one-time (K2)',
    deadline: '2026-12-31',
    applicationUrl: 'https://wbkanyashree.gov.in/',
    description: 'Conditional cash transfer scheme for girl students (13-18 years) in West Bengal to incentivize education and prevent child marriage.',
  },

  // SOURCE: official — Rajasthan Government
  {
    id: 'rj-garangi-devi-girls',
    name: 'Rajasthan Gargi Award for Girls',
    provider: 'Rajasthan Education Department',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: ['Rajasthan'],
      classRange: [10, 12],
      streams: null,
      minMarks: 'above_75',
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹3,000 (Class 10) / ₹5,000 (Class 12)',
    deadline: '2027-01-31',
    applicationUrl: 'https://rajshaladarpan.nic.in/',
    description: 'Merit award for Rajasthani girls scoring 75%+ in Class 10 or Class 12 board exams. No income restriction.',
  },

  // SOURCE: official — Kerala Government
  {
    id: 'kl-snehapoorvam',
    name: 'Snehapoorvam Scholarship (Kerala)',
    provider: 'Kerala Social Security Mission',
    source: 'official',
    eligibility: {
      incomeCeiling: '1_2.5L',
      categories: null,
      states: ['Kerala'],
      classRange: [6, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹10,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://socialsecuritymission.gov.in/',
    description: 'Scholarship for orphan students and children of single parents in Kerala studying in classes 6-12.',
  },

  // SOURCE: official — Gujarat Government
  {
    id: 'gj-mukhyamantri-yuva-swavlamban',
    name: 'Mukhyamantri Yuva Swavlamban Yojana (Gujarat)',
    provider: 'Gujarat Education Department',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: null,
      states: ['Gujarat'],
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_80',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Up to ₹2,00,000/year',
    deadline: '2027-01-31',
    applicationUrl: 'https://mysy.guj.nic.in/',
    description: 'Gujarat\'s flagship scholarship for students scoring 80%+ in Class 12 board exams. Covers tuition fees for professional courses.',
  },

  // ─────────────────────────────────────────────────────────────
  // PRIVATE & CORPORATE SCHOLARSHIPS
  // ─────────────────────────────────────────────────────────────

  // SOURCE: official — Reliance Foundation
  {
    id: 'reliance-foundation-ug',
    name: 'Reliance Foundation Undergraduate Scholarship',
    provider: 'Reliance Foundation',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: ['Science'],
      minMarks: 'above_60',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Up to ₹2,00,000/year',
    deadline: '2027-02-15',
    applicationUrl: 'https://www.reliancefoundation.org/scholarships',
    description: 'Scholarship for meritorious students from economically weaker backgrounds pursuing undergraduate degrees in STEM fields.',
  },

  // SOURCE: official — Aditya Birla Group
  {
    id: 'aditya-birla-scholarship',
    name: 'Aditya Birla Scholarship',
    provider: 'Aditya Birla Group',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_90',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹1,80,000/year (for 3-5 years)',
    deadline: '2026-09-30',
    applicationUrl: 'https://www.adityabirlascholars.net/',
    description: 'Prestigious merit scholarship for students admitted to top institutions (IITs, IIMs, BITS, Law schools). Requires exceptional academic and extracurricular record.',
  },

  // SOURCE: official — Tata Trusts / Vidyasaarathi
  {
    id: 'tata-trusts-education',
    name: 'Tata Trusts Education Scholarship',
    provider: 'Tata Trusts (via Vidyasaarathi)',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_60',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹10,000–₹50,000/year',
    deadline: '2027-01-31',
    applicationUrl: 'https://www.vidyasaarathi.co.in/',
    description: 'Need-cum-merit scholarship offered through the Vidyasaarathi platform for students pursuing higher education.',
  },

  // SOURCE: official — Sitaram Jindal Foundation
  {
    id: 'sjf-scholarship',
    name: 'Sitaram Jindal Foundation Scholarship',
    provider: 'Sitaram Jindal Foundation',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_60',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹1,000–₹3,000/month',
    deadline: '2027-03-31',
    applicationUrl: 'https://www.sitaramjindalfoundation.org/',
    description: 'Monthly scholarship for meritorious students from low-income families pursuing education at any level. Pan-India.',
  },

  // SOURCE: official — HDFC Bank Parivartan
  {
    id: 'hdfc-parivartan-ecss',
    name: 'HDFC Parivartan ECSS Scholarship',
    provider: 'HDFC Bank',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [6, 12],
      streams: null,
      minMarks: 'above_55',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹18,000–₹75,000/year',
    deadline: '2026-10-15',
    applicationUrl: 'https://www.hdfcbank.com/personal/social-responsibility/parivartan/education',
    description: 'Education Crisis Scholarship Support for school and college students from families affected by economic crisis, loss of earning member, or natural disaster.',
  },

  // SOURCE: official — Kotak Mahindra
  {
    id: 'kotak-kona-kona-scholarship',
    name: 'Kotak Kanya Scholarship',
    provider: 'Kotak Mahindra Group',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_75',
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Up to ₹1,50,000/year',
    deadline: '2026-12-31',
    applicationUrl: 'https://www.kotak.com/en/kanya-scholarship.html',
    description: 'Scholarship for meritorious girl students from underprivileged families pursuing professional graduation (engineering, medicine, architecture).',
  },

  // SOURCE: official — Fair & Lovely (now Glow & Lovely) Foundation
  {
    id: 'glow-lovely-career-foundation',
    name: 'Glow & Lovely Career Foundation Scholarship',
    provider: 'Hindustan Unilever (Glow & Lovely)',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: null,
      gender: 'Female',
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: 'Up to ₹2,50,000 (one-time)',
    deadline: '2027-02-28',
    applicationUrl: 'https://www.glowandlovelycareers.in/',
    description: 'Scholarship for women pursuing higher education — graduation, post-graduation, or professional courses. Includes career guidance resources.',
  },

  // SOURCE: official — Inspire (DST)
  {
    id: 'dst-inspire-scholarship',
    name: 'INSPIRE Scholarship for Higher Education (SHE)',
    provider: 'Department of Science & Technology',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: ['Science'],
      minMarks: 'above_75',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹80,000/year (for 5 years)',
    deadline: '2026-11-30',
    applicationUrl: 'https://www.online-inspire.gov.in/',
    description: 'INSPIRE SHE for students in the top 1% of Class 12 board exams pursuing B.Sc./BS/integrated M.Sc. in natural & basic sciences.',
  },

  // SOURCE: official — Begum Hazrat Mahal National Scholarship
  {
    id: 'nsp-begum-hazrat-mahal',
    name: 'Begum Hazrat Mahal National Scholarship',
    provider: 'Maulana Azad Education Foundation',
    source: 'official',
    eligibility: {
      incomeCeiling: '2.5_5L',
      categories: null,
      states: null,
      classRange: [9, 12],
      streams: null,
      minMarks: 'above_50',
      gender: 'Female',
      minority: true,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹6,000/year',
    deadline: '2026-10-31',
    applicationUrl: 'https://bhmnsmaef.org/',
    description: 'Scholarship exclusively for meritorious girls from minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi) studying in classes 9-12.',
  },

  // SOURCE: official — National Foundation for Communal Harmony
  {
    id: 'nfch-scholarship',
    name: 'NFCH Scholarship for Victims of Communal/Terrorist Violence',
    provider: 'National Foundation for Communal Harmony',
    source: 'official',
    eligibility: {
      incomeCeiling: null,
      categories: null,
      states: null,
      classRange: [6, 12],
      streams: null,
      minMarks: null,
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹5,000–₹15,000/year',
    deadline: '2026-12-31',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'Financial assistance for children orphaned or made destitute by communal, caste, ethnic, or terrorist violence. Pan-India, all categories.',
  },

  // SOURCE: official — Central Sector Scheme (CSSS)
  {
    id: 'csss-central-sector',
    name: 'Central Sector Scheme of Scholarship (CSSS)',
    provider: 'Ministry of Education',
    source: 'official',
    eligibility: {
      incomeCeiling: '5_8L',
      categories: null,
      states: null,
      classRange: [11, 12],
      streams: null,
      minMarks: 'above_80',
      gender: null,
      minority: null,
      disability: null,
      noOtherScholarship: false,
    },
    awardAmount: '₹10,000–₹20,000/year',
    deadline: '2026-11-30',
    applicationUrl: 'https://scholarships.gov.in/',
    description: 'For students who scored above 80th percentile in Class 12 board exams and have family income below ₹8 lakh. Supports undergraduate and postgraduate studies.',
  },

];

export default scholarships;
