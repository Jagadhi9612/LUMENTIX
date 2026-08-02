export interface DietProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
}

export function buildDietPrompt(profile: DietProfile): string {
  return `
You are an experienced certified nutritionist.

Generate a healthy one-day Indian diet plan.

User Details:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- Goal: ${profile.goal}

Requirements:
1. Calculate daily calories.
2. Calculate protein.
3. Calculate carbohydrates.
4. Calculate fats.
5. Provide:
   - Breakfast
   - Mid-morning Snack
   - Lunch
   - Evening Snack
   - Dinner
6. Keep meals practical and easy to prepare.

Return ONLY valid JSON.

{
  "calories": "",
  "protein": "",
  "carbs": "",
  "fat": "",
  "breakfast": "",
  "morningSnack": "",
  "lunch": "",
  "eveningSnack": "",
  "dinner": ""
}
`;
}