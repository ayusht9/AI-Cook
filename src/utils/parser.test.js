import { describe, it, expect } from 'vitest';
import { generateMealChoices } from './parser';

describe('generateMealChoices', () => {
  it('should generate 3 choices based on inputs', () => {
    const choices = generateMealChoices('intense', 'non-veg', 'Fish', 1000, 'AI Gen Text');
    
    expect(choices.length).toBe(3);
    
    // intense schedule -> High Protein
    expect(choices[0].name).toContain('High Protein');
    
    // intense schedule -> 2800 calories base
    expect(choices[0].calories).toBe(2800);
    expect(choices[1].calories).toBe(2600);
    expect(choices[2].calories).toBe(2950);
    
    // budget checks
    expect(choices[0].budget).toBe(900); // 90%
    expect(choices[1].budget).toBe(600); // 60%
    expect(choices[2].budget).toBe(1100); // 110%
    
    // diet checks
    expect(choices[0].lunch).toContain('Fish');
  });

  it('should correctly handle vegetarian diet', () => {
    const choices = generateMealChoices('sedentary', 'veg', '', 500, 'AI Gen Text');
    
    // sedentary schedule -> 1800 calories base
    expect(choices[0].calories).toBe(1800);
    
    // veg -> Paneer/Tofu
    expect(choices[0].lunch).toContain('Paneer/Tofu');
  });
});
