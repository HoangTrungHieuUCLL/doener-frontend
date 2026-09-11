// How-to steps and safety notes per exercise, keyed by Exercise.key.
// Static reference content (not user data), so it lives here rather than in
// the database -- same rationale as exerciseImages.ts.
//
// ponytail: written from general exercise-form knowledge, not the document
// the user meant to attach (it never arrived). Swap in the real content
// once it's sent -- shape (howTo: string[], caution: string) stays the same.
export interface ExerciseGuide {
  howTo: string[]
  caution: string
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  warmup_bar_hang: {
    howTo: [
      'Hang from a pull-up bar with arms fully extended, shoulders relaxed away from your ears.',
      'Let your body hang passively, breathing steadily.',
    ],
    caution: 'Use a step or box to get into position if you can\'t reach the bar safely; stop if you feel sharp shoulder pain.',
  },
  warmup_deep_squat_hold: {
    howTo: [
      'Stand with feet shoulder-width apart and squat down as low as comfortable, heels flat.',
      'Rest your elbows against the inside of your knees and hold, keeping your chest up.',
    ],
    caution: 'Keep heels on the floor; if they lift, widen your stance or place a small heel raise under them.',
  },
  warmup_horizontal_arm_swings: {
    howTo: [
      'Stand tall, arms out to the sides at shoulder height.',
      'Swing both arms across your chest and back out in a controlled, rhythmic motion.',
    ],
    caution: 'Keep the motion controlled, not ballistic — don\'t let momentum wrench the shoulders.',
  },
  warmup_torso_rotation_swings: {
    howTo: [
      'Stand with feet shoulder-width apart, arms relaxed.',
      'Rotate your torso side to side, letting your arms swing naturally with the motion.',
    ],
    caution: 'Keep knees soft and let the rotation come from the torso, not by twisting the knees.',
  },
  warmup_swimmers: {
    howTo: [
      'Lie face down, arms extended overhead.',
      'Alternately raise opposite arm and leg a few inches off the floor in a fluttering, swimming motion.',
    ],
    caution: 'Keep the range small and controlled — this is a warm-up, not a max-effort back exercise.',
  },
  warmup_hip_raises: {
    howTo: [
      'Lie on your back, knees bent, feet flat on the floor.',
      'Drive through your heels to lift your hips, squeezing your glutes at the top, then lower with control.',
    ],
    caution: 'Avoid overarching your lower back at the top — stop the lift when hips are in line with knees and shoulders.',
  },
  warmup_jumping_jacks: {
    howTo: [
      'Start standing with feet together, arms at your sides.',
      'Jump feet out while raising arms overhead, then jump back to start. Repeat at a steady pace.',
    ],
    caution: 'Land softly with slightly bent knees to keep impact off the joints.',
  },

  a_lying_leg_curl: {
    howTo: [
      'Lie face down on the machine with the pad against your ankles/lower calves.',
      'Curl your heels toward your glutes, pause briefly, then lower under control.',
    ],
    caution: 'Don\'t let your hips lift off the pad — that shifts the work off the hamstrings and onto the lower back.',
  },
  a_goblet_squat: {
    howTo: [
      'Hold a dumbbell vertically against your chest with both hands.',
      'Squat down between your knees, keeping your chest up and heels planted, then drive back up.',
    ],
    caution: 'Keep your knees tracking over your toes, not caving inward, especially as you fatigue.',
  },
  a_machine_row: {
    howTo: [
      'Sit with chest against the pad, grip the handles.',
      'Pull your elbows back, squeezing your shoulder blades together, then return with control.',
    ],
    caution: 'Avoid jerking the weight with your torso — keep your chest on the pad throughout.',
  },
  a_push_up: {
    howTo: [
      'Start in a plank with hands slightly wider than shoulders.',
      'Lower your chest toward the floor keeping your body in a straight line, then press back up.',
    ],
    caution: 'Don\'t let your hips sag or pike up — a straight line from shoulders to ankles protects the lower back.',
  },
  a_forearm_plank: {
    howTo: [
      'Support yourself on forearms and toes, elbows under shoulders.',
      'Hold a straight line from head to heels, bracing your core.',
    ],
    caution: 'Squeeze your glutes and avoid letting your hips drop — sagging shifts strain onto the lower back.',
  },

  b_back_extension: {
    howTo: [
      'Position your hips on the pad, ankles secured, torso hanging just past horizontal.',
      'Raise your torso to a straight line with your legs, then lower with control.',
    ],
    caution: 'Don\'t hyperextend at the top — stop at a neutral, straight-line position.',
  },
  b_reverse_lunge: {
    howTo: [
      'Stand tall, then step one foot backward and lower until both knees are near 90°.',
      'Push through the front heel to return to standing, then repeat on the other side.',
    ],
    caution: 'Keep the front knee tracking over the foot, and avoid letting the back knee slam the floor.',
  },
  b_reverse_fly: {
    howTo: [
      'Sit or stand leaning slightly forward, arms hanging with a slight bend at the elbow.',
      'Raise your arms out to the sides, squeezing your shoulder blades, then lower with control.',
    ],
    caution: 'Use a light load and controlled tempo — swinging the weight shifts strain to the lower back and neck.',
  },
  b_chest_press: {
    howTo: [
      'Sit with back against the pad, grips at chest height with a parallel (neutral) grip.',
      'Press forward until arms are extended, then return with control without locking out hard.',
    ],
    caution: 'Keep shoulder blades pulled back against the pad; don\'t let shoulders roll forward at the start.',
  },
  b_side_plank: {
    howTo: [
      'Lie on your side, propped on one forearm with elbow under your shoulder.',
      'Lift your hips so your body forms a straight line, holding steady, then repeat on the other side.',
    ],
    caution: 'Keep hips stacked and lifted throughout — a sagging hip means the set is effectively over.',
  },

  c_hip_thrust: {
    howTo: [
      'Sit with upper back against a bench, a dumbbell resting across your hips, knees bent.',
      'Drive through your heels to lift your hips until your torso is in line with your thighs, squeeze glutes, then lower.',
    ],
    caution: 'Avoid overarching the lower back at the top — stop the movement at a straight hip line.',
  },
  c_leg_press: {
    howTo: [
      'Sit in the machine with feet shoulder-width on the platform.',
      'Lower the platform under control until knees are near 90°, then press back up without locking knees hard.',
    ],
    caution: 'Never let your lower back round off the seat pad — reduce range of motion or load if it does.',
  },
  c_lat_pulldown: {
    howTo: [
      'Grip the bar wider than shoulder-width, sit with thighs secured under the pads.',
      'Pull the bar down to upper chest, squeezing shoulder blades down and back, then let it rise with control.',
    ],
    caution: 'Avoid leaning back excessively or using momentum — let your lats do the work, not your body swing.',
  },
  c_machine_fly: {
    howTo: [
      'Sit with back against the pad, grip the handles with elbows slightly bent.',
      'Bring your hands together in front of your chest, squeezing the chest, then return with control.',
    ],
    caution: 'Don\'t let the handles fly back too far — keep tension on the chest and stop before shoulders overstretch.',
  },
  c_cable_lateral_raise: {
    howTo: [
      'Stand side-on to a low cable pulley, handle in the far hand.',
      'Raise your arm out to the side to shoulder height, then lower with control. Repeat on the other side.',
    ],
    caution: 'Lead with your elbow, not your wrist, and avoid shrugging your shoulder up toward your ear.',
  },
}
