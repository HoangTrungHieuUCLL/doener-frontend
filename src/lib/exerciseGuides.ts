// How-to steps and form notes per exercise, keyed by Exercise.key.
// Adapted from the Men's Health "Muskelaufbau" 2-week beginner gym plan --
// the same program already seeded in the database (same sets/reps/tempo/rest).
// Static reference content (not user data), so it lives here rather than in
// the database -- same rationale as exerciseImages.ts.
export interface ExerciseGuide {
  howTo: string[]
  caution: string
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  warmup_bar_hang: {
    howTo: [
      'Grip a pull-up bar overhand, about shoulder-width apart.',
      'Let your body hang and relax, feeling the stretch through your back and shoulders.',
    ],
    caution: 'Use a step or box to reach the bar safely rather than jumping into the hang.',
  },
  warmup_deep_squat_hold: {
    howTo: [
      'Stand shoulder-width apart, feet turned slightly outward.',
      'Brace your core and sink into as deep a squat as you can, keeping your torso upright.',
      'Press your elbows against the inside of your thighs and hold the position.',
    ],
    caution: 'Keep your torso as upright as possible — don\'t let it collapse forward to reach depth.',
  },
  warmup_horizontal_arm_swings: {
    howTo: [
      'Stand hip-width apart, arms extended out to the sides at shoulder height.',
      'Keeping your arms straight, swing them across in front of your body, then back out. Keep it dynamic, without stopping.',
    ],
    caution: 'Dynamic doesn\'t mean forced — let the swing stay controlled, not a ballistic snap.',
  },
  warmup_torso_rotation_swings: {
    howTo: [
      'Stand upright, arms extended in front of you at shoulder height.',
      'Rotate your torso to one side until your arms point as far back as possible — your head turns with it and the trailing heel lifts.',
      'Repeat to the other side, alternating in a fluid motion.',
    ],
    caution: 'Let the rotation come from your torso and hips, not by twisting through the knees.',
  },
  warmup_swimmers: {
    howTo: [
      'Lie face down, arms extended forward beside your head.',
      'Engage your lower back and glutes to lift your chest and arms off the floor.',
      'Sweep your hands in a wide arc down toward your glutes, backs of the hands facing down, keeping arms nearly straight and gaze at the floor. Reverse back to the start.',
    ],
    caution: 'Keep the range small and controlled — this is a warm-up, not a max-effort back exercise.',
  },
  warmup_hip_raises: {
    howTo: [
      'Lie on your back, knees bent, feet flat on the floor, arms resting at your sides for stability.',
      'Lift and squeeze your glutes so your torso and thighs form a straight line. Hold briefly, then lower.',
    ],
    caution: 'Stop the lift once hips, knees, and shoulders line up straight — don\'t overarch the lower back at the top.',
  },
  warmup_jumping_jacks: {
    howTo: [
      'Stand upright, feet together, arms at your sides.',
      'Push off the floor and jump your feet out while raising your straight arms overhead until your hands touch. Jump straight back to start.',
    ],
    caution: 'Land softly with slightly bent knees to keep impact off the joints.',
  },

  a_lying_leg_curl: {
    howTo: [
      'Lie face down on the machine, hands under your head, legs straight.',
      'Curl your heels toward your glutes by engaging your hamstrings until your feet lift off the pad, then lower with control back to the start.',
    ],
    caution: 'Don\'t let your hips lift off the pad — that shifts the work off the hamstrings and onto the lower back.',
  },
  a_goblet_squat: {
    howTo: [
      'Hold a dumbbell in front of your chest, feet shoulder-width and turned slightly out, elbows pointing down, gaze forward.',
      'Lower into as deep a squat as you can with control, torso as upright as possible.',
      'Extend your knees and hips to return to standing.',
    ],
    caution: 'Keep your knees tracking over your toes rather than caving inward, especially as you fatigue.',
  },
  a_machine_row: {
    howTo: [
      'Sit at the machine, knees slightly bent, torso leaning slightly forward, and grip the handles.',
      'Pull the handles toward your body by drawing your back and shoulders back until your elbows are close to your body and shoulder blades are squeezed together.',
      'Return to the starting position with control.',
    ],
    caution: 'Avoid jerking the weight with your torso — keep the pull driven by your back, not momentum.',
  },
  a_push_up: {
    howTo: [
      'Get into push-up position, hands slightly wider than shoulder-width, core and glutes braced so your body forms a straight line.',
      'Bend your arms to about 45° from your torso and lower with control until your chest nearly touches the floor.',
      'Press back up to the starting position.',
    ],
    caution: 'Don\'t let your hips sag or pike up — a straight line from shoulders to ankles protects the lower back.',
  },
  a_forearm_plank: {
    howTo: [
      'Support yourself on your forearms and toes, elbows roughly under your shoulders.',
      'Brace your core and hold a straight line from head to heels.',
    ],
    caution: 'Squeeze your glutes and keep hips level — a sagging hip means the set is effectively over.',
  },

  b_back_extension: {
    howTo: [
      'Lie face down on the back-extension machine, hips and legs secured, arms crossed over your chest.',
      'Raise your torso by engaging your back muscles, as far up as is comfortable.',
      'Lower with control back to the starting position.',
    ],
    caution: 'Don\'t hyperextend at the top — stop at a comfortable, straight-line position.',
  },
  b_reverse_lunge: {
    howTo: [
      'Stand hip-width apart, core braced.',
      'Take a big step backward with one leg, keeping the front leg planted, and bend both knees until the back knee nearly touches the floor. Keep your torso upright.',
      'Push through the front foot to return to standing, then repeat on the other side.',
    ],
    caution: 'Keep the front knee tracking over the foot, and let the back knee tap down lightly rather than slamming it.',
  },
  b_reverse_fly: {
    howTo: [
      'Sit at the reverse-fly machine, grip the handles in front of you, and sit upright.',
      'Pull the handles apart by engaging your shoulders and upper back until they\'re maximally spread.',
      'Return to the starting position with control.',
    ],
    caution: 'Use a load you can control — swinging the handles shifts strain to the lower back and neck.',
  },
  b_chest_press: {
    howTo: [
      'Sit at the machine, grip the handles with a parallel (neutral) grip, palms facing each other, hands at chest height.',
      'Press the handles forward by engaging your chest until your arms are almost fully extended.',
      'Lower with control back to the starting position.',
    ],
    caution: 'Keep shoulder blades pulled back against the pad — don\'t let your shoulders roll forward at the start.',
  },
  b_side_plank: {
    howTo: [
      'Prop yourself on one forearm, elbow under your shoulder, other arm resting along your body.',
      'Lift your hips so your whole body forms a straight line and hold it steady.',
      'After the set time, repeat on the other side.',
    ],
    caution: 'Keep hips lifted and stacked throughout — a sagging hip means the set is effectively over.',
  },

  c_hip_thrust: {
    howTo: [
      'Lie on your back, knees bent, feet flat on the floor, a dumbbell resting across your hips.',
      'Lift and squeeze your glutes so your torso and thighs form a straight line. Hold briefly.',
      'Lower your glutes back down with control.',
    ],
    caution: 'Stop the lift once hips, knees, and shoulders line up straight — avoid overarching the lower back at the top.',
  },
  c_leg_press: {
    howTo: [
      'Sit in the machine, feet on the platform, knees bent.',
      'Press the platform away by engaging your legs until they\'re almost extended.',
      'Lower the platform back with control.',
    ],
    caution: 'Never let your lower back round off the seat pad — reduce range of motion or load if it does.',
  },
  c_lat_pulldown: {
    howTo: [
      'Sit at the machine, legs slightly bent, torso upright, and grip the bar.',
      'Pull the bar down to your chest by engaging your lats.',
      'Let the bar rise back to the starting position with control.',
    ],
    caution: 'Avoid leaning back excessively or using momentum — let your lats do the work, not a body swing.',
  },
  c_machine_fly: {
    howTo: [
      'Sit at the machine with your back pressed against the pad, gripping the handles with straight arms.',
      'Bring the handles together in front of your chest by engaging your chest muscles, until they nearly touch.',
      'Return slowly to the starting position.',
    ],
    caution: 'Don\'t let the handles swing back too far — keep tension on the chest and stop before the shoulders overstretch.',
  },
  c_cable_lateral_raise: {
    howTo: [
      'Set the cable pulley to ankle height, stand side-on to it, and hold the handle in your outer hand.',
      'Raise the handle out to the side, away from your body, until your arm is at shoulder height and parallel to the floor.',
      'Hold briefly, then lower with control. Repeat on the other side.',
    ],
    caution: 'Lead with your elbow, not your wrist, and avoid shrugging your shoulder up toward your ear.',
  },
}
