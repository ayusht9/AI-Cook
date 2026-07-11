export const generateMealChoices = (schedule, diet, nonVegChoice, budget, aiText) => {
    const calorieBase = schedule === 'intense' ? 2800 : schedule === 'moderate' ? 2200 : 1800;
    const proteinFactor = schedule === 'intense' ? 'High Protein' : 'Standard Protein';
    const mainIngredient = diet === 'veg' ? 'Paneer/Tofu' : (nonVegChoice || 'Chicken');

    return [
      {
        id: 1,
        name: `${proteinFactor} Power Plan`,
        description: `AI Note: ${aiText.substring(0, 80)}... A perfect start for your day!`,
        breakfast: `Oats with Nuts & ${diet === 'veg' ? 'Milk' : 'Eggs'}`,
        lunch: `${mainIngredient} Curry with Brown Rice`,
        dinner: `Light Salad with ${mainIngredient}`,
        calories: calorieBase,
        budget: Math.round(budget * 0.9),
        groceryList: ['Oats', 'Nuts', 'Brown Rice', mainIngredient.split('/')[0], 'Mixed Greens'],
        substitutions: 'Swap Rice with Quinoa for lower GI.'
      },
      {
        id: 2,
        name: `Budget Saver ${diet === 'veg' ? 'Veggie' : 'Meat'} Feast`,
        description: `AI Note: A balanced approach keeping costs low.`,
        breakfast: `Poha/Upma with Veggies`,
        lunch: `Dal Tadka, Roti, and ${diet === 'veg' ? 'Aloo Gobi' : mainIngredient}`,
        dinner: `Soup and ${mainIngredient} stir fry`,
        calories: calorieBase - 200,
        budget: Math.round(budget * 0.6),
        groceryList: ['Poha/Rava', 'Dal', 'Wheat Flour', 'Onions/Tomatoes', mainIngredient.split('/')[0]],
        substitutions: 'Use seasonal veggies to save more.'
      },
      {
        id: 3,
        name: `Premium Chef's Special`,
        description: `AI Note: Indulge slightly while hitting macros.`,
        breakfast: `Avocado Toast & Protein Smoothie`,
        lunch: `Quinoa Bowl with Roasted ${mainIngredient}`,
        dinner: `Grilled ${mainIngredient} with Asparagus/Broccoli`,
        calories: calorieBase + 150,
        budget: Math.round(budget * 1.1),
        groceryList: ['Avocado', 'Quinoa', 'Protein Powder', 'Broccoli', mainIngredient.split('/')[0]],
        substitutions: 'Avocado can be swapped with Peanut Butter.'
      }
    ];
};
