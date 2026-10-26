import type { Campaign } from '../../domain/types.js'

const WHO_SUICIDE_2021 = 'https://www.who.int/publications/i/item/9789240110069'
const WHO_LIFE_EXPECTANCY_2019 =
  'https://www.who.int/news/item/04-04-2019-uneven-access-to-health-services-drives-life-expectancy-gaps-who'

export const movemberCampaign: Campaign = {
  id: 'movember',
  slug: 'movember',
  month: 11,
  title: 'Move for Movember',
  cause: "Men's health",
  summary:
    "Men's mental health, suicide prevention, and the health issues men too often ignore.",
  description:
    "November is Movember: a month to talk openly about men's mental health, suicide prevention, and prostate and testicular cancer. Men on average die younger than women, and many of the causes are preventable. Moving together is a way to start conversations and look out for each other.",
  icon: 'HeartHandshake',
  tracks: [
    {
      id: 'on-foot',
      label: 'Run, walk or roll',
      activityTypes: ['run', 'walk', 'hike', 'wheelchair'],
    },
    { id: 'cycling', label: 'Cycling', activityTypes: ['ride'] },
  ],
  status: 'published',
  featuredStatisticId: 'nov-60-men-per-hour',
  statistics: [
    {
      id: 'nov-60-men-per-hour',
      statement: 'Around 60 men die by suicide every hour, worldwide.',
      value: { kind: 'estimate', value: 60 },
      unit: 'men per hour',
      period: 'Annual average',
      geography: 'Global',
      population: 'Men',
      category: 'healthImpact',
      sourceOrg: 'Movember',
      sourceUrl: 'https://nz.movember.com/index?locale=nz',
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        "This is Movember's own campaign figure. It is consistent with WHO's estimate of about 727,000 suicide deaths in 2021, most of them men.",
      goalMappingNote:
        "Movember's 60 km Move challenge stands for the 60 men lost every hour. The goals below are symbolic: covering the distance does not prevent deaths, but it keeps the conversation going.",
    },
    {
      id: 'nov-727k-suicides',
      statement:
        'An estimated 727,000 people died by suicide worldwide in 2021.',
      value: { kind: 'estimate', value: 727_000 },
      unit: 'deaths',
      period: '2021',
      geography: 'Global',
      population: 'All ages and sexes',
      category: 'prevalence',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_SUICIDE_2021,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'WHO notes that suicide numbers are likely underestimated, especially where death registration is limited. Every one of these deaths affects families, friends and communities.',
      goalMappingNote:
        "Educational only — no meaningful distance conversion. Your challenge uses Movember's standard 60 km goals.",
    },
    {
      id: 'nov-third-cause-young-men',
      statement:
        'Suicide was the third leading cause of death among males aged 15–29 in 2021.',
      value: { kind: 'exact', value: 3 },
      unit: 'rank among causes of death',
      period: '2021',
      geography: 'Global',
      population: 'Males aged 15–29',
      category: 'healthImpact',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_SUICIDE_2021,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'For females in the same age group it was the second leading cause. Young people are a key group for prevention and early support.',
      goalMappingNote:
        "Educational only. Your challenge uses Movember's standard 60 km goals.",
    },
    {
      id: 'nov-73pct-lmic',
      statement:
        'About 73% of suicides in 2021 occurred in low- and middle-income countries.',
      value: { kind: 'estimate', value: 73 },
      unit: '% of suicide deaths',
      period: '2021',
      geography: 'Global',
      population: 'All ages and sexes',
      category: 'accessToCare',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_SUICIDE_2021,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'Access to mental health care and support varies widely between countries. Suicide is a global issue, not only one for wealthy nations.',
      goalMappingNote:
        "Educational only. Your challenge uses Movember's standard 60 km goals.",
    },
    {
      id: 'nov-life-expectancy-gap',
      statement:
        'Boys born in 2019 were expected to live about 4.4 years less than girls (69.8 vs 74.2 years).',
      value: { kind: 'estimate', value: 4.4 },
      unit: 'years',
      period: '2019',
      geography: 'Global',
      population: 'Children born in 2019',
      category: 'context',
      sourceOrg: 'World Health Organization (World Health Statistics 2019)',
      sourceUrl: WHO_LIFE_EXPECTANCY_2019,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        "WHO found women outlive men everywhere in the world. Part of the gap comes from causes that can be prevented, which is why men's health gets its own month.",
      goalMappingNote:
        "Educational only. Your challenge uses Movember's standard 60 km goals.",
    },
    {
      id: 'nov-33-of-40-causes',
      statement:
        'Of the 40 leading causes of death, 33 contribute more to reduced life expectancy in men than in women.',
      value: { kind: 'exact', value: 33 },
      unit: 'causes of death (of 40)',
      period: '2019',
      geography: 'Global',
      population: 'Men and women',
      category: 'healthImpact',
      sourceOrg: 'World Health Organization (World Health Statistics 2019)',
      sourceUrl: WHO_LIFE_EXPECTANCY_2019,
      verification: 'verified',
      lastVerified: '2026-10-26',
      context:
        'WHO also reported that road injury death rates are more than twice as high in men from age 15, and homicide deaths are four times higher.',
      goalMappingNote:
        "Educational only. Your challenge uses Movember's standard 60 km goals.",
    },
    {
      id: 'nov-male-suicide-rate',
      statement:
        'Men die by suicide at roughly twice the rate of women globally.',
      value: { kind: 'estimate', value: 2.2 },
      unit: 'male-to-female rate ratio',
      period: '2021',
      geography: 'Global',
      population: 'Men and women',
      category: 'healthImpact',
      sourceOrg: 'World Health Organization',
      sourceUrl: WHO_SUICIDE_2021,
      verification: 'draft',
      lastVerified: null,
      context:
        'Sex-specific rates were only found in secondary summaries; confirm 12.3 vs 5.6 per 100,000 in the WHO report before publishing.',
      goalMappingNote: 'Educational only.',
    },
    {
      id: 'nov-testicular-young-men',
      statement: 'Testicular cancer is the most common cancer among young men.',
      value: { kind: 'exact', value: 1 },
      unit: 'rank among cancers',
      period: 'Varies by source',
      geography: 'Varies by source',
      population: 'Young men (age band varies: 15–39, 20–34)',
      category: 'prevention',
      sourceOrg: 'Movember',
      sourceUrl:
        'https://cdn.movember.com/uploads/files/Media%20Room/AU/TCAM%20Press%20Release_FINAL_AUS.pdf',
      verification: 'draft',
      lastVerified: null,
      context:
        'Sources disagree on the age band and one Movember survey conflicts; needs a primary registry source.',
      goalMappingNote: 'Educational only.',
    },
  ],
  goals: [
    {
      id: 'nov-easy',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'EASY',
      goalType: 'totalDistance',
      target: 10,
      symbolicExplanation:
        'A first step: 10 km across November, at your own pace.',
      badge: { name: 'Movember Mover' },
    },
    {
      id: 'nov-medium',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'MEDIUM',
      goalType: 'totalDistance',
      target: 30,
      symbolicExplanation: "30 km — halfway to Movember's 60 km challenge.",
      badge: { name: 'Movember Strider' },
    },
    {
      id: 'nov-hard',
      statisticId: null,
      trackId: 'on-foot',
      difficulty: 'HARD',
      goalType: 'totalDistance',
      target: 60,
      symbolicExplanation:
        "Movember's full 60 km, one kilometre for each of the 60 men lost to suicide every hour. A symbol of remembrance, not a measure of lives saved.",
      badge: { name: 'Movember 60' },
    },
    {
      id: 'nov-cycling-easy',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'EASY',
      goalType: 'totalDistance',
      target: 30,
      symbolicExplanation: 'A first step on two wheels: 30 km across November.',
      badge: { name: 'Movember Rider' },
    },
    {
      id: 'nov-cycling-medium',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'MEDIUM',
      goalType: 'totalDistance',
      target: 90,
      symbolicExplanation:
        'Three times the on-foot Silver distance, to match the effort of cycling.',
      badge: { name: 'Movember Cyclist' },
    },
    {
      id: 'nov-cycling-hard',
      statisticId: null,
      trackId: 'cycling',
      difficulty: 'HARD',
      goalType: 'totalDistance',
      target: 180,
      symbolicExplanation:
        'Three times the on-foot Gold distance, so a cycling Gold takes comparable effort.',
      badge: { name: 'Movember 180' },
    },
  ],
  learnMore: [
    { label: 'Movember', url: 'https://movember.com' },
    {
      label: 'WHO — Suicide worldwide in 2021',
      url: WHO_SUICIDE_2021,
    },
  ],
  supportResources: [
    {
      label: 'Find a Helpline — free, confidential support worldwide',
      url: 'https://findahelpline.com',
    },
  ],
  symbolicNote:
    "Your kilometres are symbolic. They don't raise money or save lives on their own — they're a reason to move, to talk, and to check in on the men around you. To donate, visit Movember directly.",
}
