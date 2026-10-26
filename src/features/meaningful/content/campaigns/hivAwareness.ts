import type { Campaign } from '../../domain/types.js'

const UNAIDS_FACT_SHEET = 'https://www.unaids.org/en/resources/fact-sheet'
const WHO_HIV_DATA =
  'https://www.who.int/teams/global-hiv-hepatitis-and-stis-programmes/hiv/strategic-information/hiv-data-and-statistics'
const WHO_VIRAL_SUPPRESSION_BRIEF =
  'https://www.who.int/publications-detail-redirect/9789240055179'

export const hivAwarenessCampaign: Campaign = {
  id: 'hiv-awareness',
  slug: 'hiv-awareness',
  month: 12,
  title: 'Move for HIV Awareness',
  cause: 'HIV awareness and reducing stigma',
  summary:
    'HIV testing, treatment access, and ending the stigma that still surrounds people living with HIV.',
  description:
    'December opens with World AIDS Day on 1 December. HIV is now a treatable condition: with effective treatment, people living with HIV can live long, healthy lives. Stigma and unequal access to testing and treatment remain some of the biggest barriers.',
  icon: 'Ribbon',
  tracks: [
    {
      id: 'on-foot',
      label: 'Run, walk or roll',
      activityTypes: ['run', 'walk', 'hike', 'wheelchair'],
    },
    { id: 'cycling', label: 'Cycling', activityTypes: ['ride'] },
  ],
  status: 'published',
  featuredStatisticId: 'dec-41m-living-with-hiv',
  statistics: [
    {
      id: 'dec-41m-living-with-hiv',
      statement:
        'An estimated 41.0 million people were living with HIV worldwide in 2025.',
      value: {
        kind: 'range',
        value: 41_000_000,
        low: 35_300_000,
        high: 47_500_000,
      },
      unit: 'people',
      period: '2025',
      geography: 'Global',
      population: 'People of all ages living with HIV',
      category: 'prevalence',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'UNAIDS publishes this as an estimate with an uncertainty range (35.3–47.5 million). Behind the number are people living full lives, many of them on treatment.',
      goalMappingNote:
        "Educational only — the month's goals are the same for every statistic.",
    },
    {
      id: 'dec-1-2m-new',
      statement: 'About 1.2 million people newly acquired HIV in 2025.',
      value: { kind: 'range', value: 1_200_000, low: 950_000, high: 1_700_000 },
      unit: 'people',
      period: '2025',
      geography: 'Global',
      population: 'People of all ages',
      category: 'prevalence',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Testing, prevention tools such as PrEP, and effective treatment all reduce new infections.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-42pct-fewer-new',
      statement:
        'New HIV acquisitions fell by 42% between 2010 and 2025 (2.1 million to 1.2 million).',
      value: { kind: 'estimate', value: 42 },
      unit: '% decline',
      period: '2010–2025',
      geography: 'Global',
      population: 'People of all ages',
      category: 'progress',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Real progress — though UNAIDS also reports new infections rising in some regions and countries in 2025.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-32m-on-treatment',
      statement:
        '32.1 million people were accessing antiretroviral therapy in 2025, up from 7.6 million in 2010.',
      value: {
        kind: 'range',
        value: 32_100_000,
        low: 28_200_000,
        high: 33_400_000,
      },
      unit: 'people',
      period: '2025',
      geography: 'Global',
      population: 'People living with HIV',
      category: 'accessToCare',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Antiretroviral therapy keeps HIV under control. More than four times as many people had access in 2025 as in 2010.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-78pct-on-treatment',
      statement:
        'About 78% of all people living with HIV were accessing treatment in 2025.',
      value: { kind: 'range', value: 78, low: 62, high: 90 },
      unit: '% of people living with HIV',
      period: '2025',
      geography: 'Global',
      population: 'People living with HIV',
      category: 'accessToCare',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Roughly one in five people living with HIV still lacks treatment — often because of cost, distance, or stigma.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-570k-deaths',
      statement:
        'About 570,000 people died from AIDS-related illnesses in 2025.',
      value: { kind: 'range', value: 570_000, low: 430_000, high: 780_000 },
      unit: 'deaths',
      period: '2025',
      geography: 'Global',
      population: 'People of all ages',
      category: 'healthImpact',
      sourceOrg: 'UNAIDS',
      sourceUrl: UNAIDS_FACT_SHEET,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Most of these deaths are preventable with timely testing and treatment.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-73pct-fewer-deaths',
      statement:
        'HIV claimed 73% fewer lives in 2025 than at the epidemic’s peak in 2004.',
      value: { kind: 'estimate', value: 73 },
      unit: '% decline',
      period: '2004–2025',
      geography: 'Global',
      population: 'People of all ages',
      category: 'progress',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_HIV_DATA,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'This is what treatment access achieves. UNAIDS gives a similar figure (74%) for AIDS-related deaths.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'dec-undetectable-zero-risk',
      statement:
        'People living with HIV who have an undetectable viral load and take their medication as prescribed have zero risk of passing HIV to sexual partners.',
      value: { kind: 'exact', value: 0 },
      unit: 'risk of sexual transmission',
      period: 'Current WHO guidance',
      geography: 'Global',
      population: 'People living with HIV on effective treatment',
      category: 'prevention',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_VIRAL_SUPPRESSION_BRIEF,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Often summarised as "Undetectable = Untransmittable" (U=U). Knowing this helps break down stigma.',
      goalMappingNote: 'Educational only.',
    },
  ],
  goals: [
    {
      id: 'dec-easy',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'EASY',
      goalType: 'totalDistance',
      target: 10,
      symbolicExplanation:
        'A first step: 10 km across December, starting from World AIDS Day.',
      badge: { name: 'Red Ribbon Mover' },
    },
    {
      id: 'dec-medium',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'MEDIUM',
      goalType: 'totalDistance',
      target: 31,
      symbolicExplanation:
        "31 km — one for each day of December. Awareness doesn't stop after 1 December.",
      badge: { name: 'Red Ribbon Strider' },
    },
    {
      id: 'dec-hard',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'HARD',
      goalType: 'totalDistance',
      target: 60,
      symbolicExplanation:
        'An ambitious 60 km — about 2 km for every day of the month.',
      badge: { name: 'Red Ribbon 60' },
    },
    {
      id: 'dec-cycling-easy',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'EASY',
      goalType: 'totalDistance',
      target: 30,
      symbolicExplanation: 'A first step on two wheels: 30 km across December.',
      badge: { name: 'Red Ribbon Rider' },
    },
    {
      id: 'dec-cycling-medium',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'MEDIUM',
      goalType: 'totalDistance',
      target: 93,
      symbolicExplanation:
        'Three times the on-foot Silver distance, to match the effort of cycling.',
      badge: { name: 'Red Ribbon Cyclist' },
    },
    {
      id: 'dec-cycling-hard',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'HARD',
      goalType: 'totalDistance',
      target: 180,
      symbolicExplanation:
        'Three times the on-foot Gold distance, so a cycling Gold takes comparable effort.',
      badge: { name: 'Red Ribbon 180' },
    },
  ],
  learnMore: [
    { label: 'UNAIDS — Global HIV & AIDS statistics', url: UNAIDS_FACT_SHEET },
    { label: 'WHO — HIV data and statistics', url: WHO_HIV_DATA },
  ],
  supportResources: [],
  symbolicNote:
    "Your kilometres are symbolic. They don't fund treatment or prevent infections on their own — they're a reason to learn the facts, talk openly, and push back against stigma.",
}
