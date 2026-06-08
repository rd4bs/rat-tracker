import type { Muscle } from "./muscle";

export type Exercise = {
  id: string;
  name: string;

  movement?: string[];     // squat, hinge, push, pull, carry
  equipment?: string[];    // barbell, dumbbell, machine, bodyweight

  muscles: {
    primary: Muscle[];
    secondary?: Muscle[];
    stabilizer?: Muscle[];
  };

  isCustom?: boolean;      // user-created exercise
};