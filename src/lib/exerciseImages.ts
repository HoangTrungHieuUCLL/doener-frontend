// Real per-exercise photos/GIFs, served from public/exercises/. Takes
// priority over the Unsplash category fallback below. Add more as they're
// filmed -- an exercise with no entry here just keeps using its category
// stock photo.
const EXERCISE_MEDIA: Partial<Record<string, string>> = {
  warmup_bar_hang: '/exercises/bar-hang.png',
  warmup_deep_squat_hold: '/exercises/deep-squat-hold.gif',
  warmup_horizontal_arm_swings: '/exercises/horizontal-arm-swings.gif',
  warmup_torso_rotation_swings: '/exercises/torso-rotation-swings.gif',
  warmup_swimmers: '/exercises/swimmer.gif',
  warmup_hip_raises: '/exercises/hip-raises.gif',
  warmup_jumping_jacks: '/exercises/jumping-jacks.gif',
  a_lying_leg_curl: '/exercises/lying-leg-curl.gif',
  a_goblet_squat: '/exercises/goblet-squat.gif',
  a_machine_row: '/exercises/machine-row.gif',
  a_push_up: '/exercises/push-up.gif',
  a_forearm_plank: '/exercises/forearm-plank.gif',
  b_back_extension: '/exercises/back-extension.gif',
  b_reverse_lunge: '/exercises/reverse-lunges.gif',
  b_reverse_fly: '/exercises/reverse-fly.gif',
  custom_running: '/exercises/running.gif',
}

// Per-exercise images sourced from Unsplash, grouped by movement pattern
// (many exercises share a category image rather than each having a unique
// lookup). Hotlinked with size/quality params so we never ship full-res
// photos to a phone screen.
function unsplashUrl(photoId: string, width = 480): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=60`
}

const CATEGORY_IMAGE: Record<string, string> = {
  mobility_warmup: unsplashUrl('photo-1601422407692-ec4eeec1d9b3'),
  jumping_jacks: unsplashUrl('photo-1517931524326-bdd55a541177'),
  leg_curl: unsplashUrl('photo-1675026482808-33f7515ecddd'),
  squat: unsplashUrl('photo-1546483875-ad9014c88eba'),
  row: unsplashUrl('photo-1519505907962-0a6cb0167c73'),
  push_up: unsplashUrl('photo-1598971457999-ca4ef48a9a71'),
  plank: unsplashUrl('photo-1714646442330-9068099f5521'),
  back_extension: unsplashUrl('photo-1641337221253-fdc7237f6b61'),
  lunge: unsplashUrl('photo-1567598508481-65985588e295'),
  lateral_raise: unsplashUrl('photo-1581009146145-b5ef050c2e1e'),
  chest_press: unsplashUrl('photo-1532029837206-abbe2b7620e3'),
  hip_thrust: unsplashUrl('photo-1588271956031-bd2698e27dd6'),
  leg_press: unsplashUrl('photo-1434682772747-f16d3ea162c3'),
  lat_pulldown: unsplashUrl('photo-1507398941214-572c25f4b1dc'),
  running: unsplashUrl('photo-1764347753770-08c46fd4fa0d'),
  walking: unsplashUrl('photo-1761072087053-2bff48d50499'),
  cycling: unsplashUrl('photo-1783458604866-371e445d7f5e'),
  jump_rope: unsplashUrl('photo-1514994667787-b48ca37155f0'),
  rowing_machine: unsplashUrl('photo-1780398585038-d77d3817c3c6'),
  sit_up: unsplashUrl('photo-1571019613454-1cb2f99b2d8b'),
  burpee: unsplashUrl('photo-1631361927604-424b038b558c'),
  pull_up: unsplashUrl('photo-1734980339741-6255c609961a'),
}

const EXERCISE_CATEGORY: Record<string, keyof typeof CATEGORY_IMAGE> = {
  warmup_bar_hang: 'mobility_warmup',
  warmup_deep_squat_hold: 'mobility_warmup',
  warmup_horizontal_arm_swings: 'mobility_warmup',
  warmup_torso_rotation_swings: 'mobility_warmup',
  warmup_swimmers: 'mobility_warmup',
  warmup_hip_raises: 'hip_thrust',
  warmup_jumping_jacks: 'jumping_jacks',

  a_lying_leg_curl: 'leg_curl',
  a_goblet_squat: 'squat',
  a_machine_row: 'row',
  a_push_up: 'push_up',
  a_forearm_plank: 'plank',

  b_back_extension: 'back_extension',
  b_reverse_lunge: 'lunge',
  b_reverse_fly: 'lateral_raise',
  b_chest_press: 'chest_press',
  b_side_plank: 'plank',

  c_hip_thrust: 'hip_thrust',
  c_leg_press: 'leg_press',
  c_lat_pulldown: 'lat_pulldown',
  c_machine_fly: 'lateral_raise',
  c_cable_lateral_raise: 'lateral_raise',

  custom_running: 'running',
  custom_walking: 'walking',
  custom_cycling: 'cycling',
  custom_jump_rope: 'jump_rope',
  custom_rowing_machine: 'rowing_machine',
  custom_sit_up: 'sit_up',
  custom_burpee: 'burpee',
  custom_pull_up: 'pull_up',
}

export function exerciseImageUrl(exerciseKey: string, width = 480): string {
  const media = EXERCISE_MEDIA[exerciseKey]
  if (media) return media

  const category = EXERCISE_CATEGORY[exerciseKey]
  const base = category ? CATEGORY_IMAGE[category] : CATEGORY_IMAGE.mobility_warmup
  return width === 480 ? base : base.replace(/w=\d+/, `w=${width}`)
}
