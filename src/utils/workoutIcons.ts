export function getWorkoutTypeIcon(name?: string) {
    switch (name) {
        case "Upper Body":
            return "🏋️";
        case "Lower Body":
            return "🦵";
        case "Cardio":
            return "🚴";
        case "Core":
            return "🎯";
        case "Sauna":
            return "♨️";
        default:
            return "📋";
    }
}