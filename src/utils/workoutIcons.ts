export function getWorkoutTypeIcon(name?: string) {
  switch (name) {
    case "Upper Body":
      return "Upper";
    case "Lower Body":
      return "Lower";
    case "Cardio":
      return "Cardio";
    case "Core":
      return "Core";
    case "Sauna":
      return "Sauna";
    default:
      return "Workout";
  }
}
