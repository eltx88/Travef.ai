import foodDataJSON from '@/googleplacesfilters/food.json';
import attractionsDataJSON from '@/googleplacesfilters/attractions.json';
import Fuse, { IFuseOptions } from 'fuse.js';
import { TripData } from '@/Types/InterfaceTypes';

interface FuseSearchItem {
  path: string;
  category: string;
  values: string[];
}

interface FlattenedKey {
  path: string;
  key: string;
}
function stem(word: string): string {
  word = word.toLowerCase();
  
  // Remove trailing 's', 'es', 'ing', 'ed'
  if (word.endsWith('ing')) {
    return word.slice(0, -3);
  } else if (word.endsWith('ed') && word.length > 3) {
    return word.slice(0, -2);
  } else if (word.endsWith('es')) {
    return word.slice(0, -2);
  } else if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  
  return word;
}

export class CategoryMapper {
  private fuseFoodKeys: Fuse<FlattenedKey>;
  private fuseFoodValues: Fuse<FuseSearchItem>;
  private fuseAttractionKeys: Fuse<FlattenedKey>;
  private fuseAttractionValues: Fuse<FuseSearchItem>;
  private flattenedFoodKeys: FlattenedKey[];
  private flattenedFoodValues: FuseSearchItem[];
  private flattenedAttractionKeys: FlattenedKey[];
  private flattenedAttractionValues: FuseSearchItem[];

  constructor() {
    // Initialize both flattened structures for attractions and food
    const attractionsFlattened = this.flattenStructures(attractionsDataJSON);
    const foodFlattened = this.flattenStructures(foodDataJSON);

    this.flattenedAttractionKeys = attractionsFlattened.keyItems;
    this.flattenedAttractionValues = attractionsFlattened.valueItems;
    this.flattenedFoodKeys = foodFlattened.keyItems;
    this.flattenedFoodValues = foodFlattened.valueItems;

    // Define Fuse options
    const keyOptions: IFuseOptions<FlattenedKey> = {
      keys: ['key'],
      threshold: 0.3,
      minMatchCharLength: 3
    };

    const valueOptions: IFuseOptions<FuseSearchItem> = {
      keys: ['values'],
      threshold: 0.3,
      minMatchCharLength: 2,
      includeMatches: true
    };

    // Initialize Fuse instances
    this.fuseFoodKeys = new Fuse(this.flattenedFoodKeys, keyOptions);
    this.fuseFoodValues = new Fuse(this.flattenedFoodValues, valueOptions);
    this.fuseAttractionKeys = new Fuse(this.flattenedAttractionKeys, keyOptions);
    this.fuseAttractionValues = new Fuse(this.flattenedAttractionValues, valueOptions);
  }

  private flattenStructures(obj: any): { 
    keyItems: FlattenedKey[], 
    valueItems: FuseSearchItem[] 
  } {
    const keyItems: FlattenedKey[] = [];
    const valueItems: FuseSearchItem[] = [];

    const traverse = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        
        keyItems.push({ path, key });

        if (value && typeof value === 'object') {
          if ('values' in value) {
            valueItems.push({
              path,
              category: key,
              values: (value as { values: string[] }).values
            });
          } else {
            traverse(value, path);
          }
        }
      }
    };

    traverse(obj);
    return { keyItems, valueItems };
  }

  private findMatches(
    searchTerm: string, 
    keyFuse: Fuse<FlattenedKey>, 
    valueFuse: Fuse<FuseSearchItem>, 
    flattenedKeys: FlattenedKey[]
  ): string[] {
    const stemmedTerm = stem(searchTerm);   
    const searchTermLower = searchTerm.toLowerCase();

    // Try exact key match with STEMMED term
    const exactKeyMatch = flattenedKeys.find(
      item => item.key.toLowerCase() === stemmedTerm 
    );
    if (exactKeyMatch) {
      return [exactKeyMatch.path];
    }

    // Try fuzzy key match with original term
    const keyResults = keyFuse.search(searchTermLower);
    if (keyResults.length > 0 && keyResults[0].score! < 0.3) {
      return [keyResults[0].item.path];
    }

    // Try values match with both original and stemmed terms
    const valueResults = valueFuse.search(searchTermLower);
    const matches = valueResults
      .filter(result => 
        result.item.values.some(value => {
          const valueLower = value.toLowerCase();
          return valueLower.includes(searchTermLower) || 
                 valueLower.includes(stemmedTerm) ||
                 stem(valueLower).includes(stemmedTerm);
        })
      )
      .map(result => result.item.path);

    return [...new Set(matches)];
  }

  public async getCategoryMappings(tripData: TripData): Promise<{
    foodCategories: string;
    attractionCategories: string;
    unmapped: {
      food: string[];
      interests: string[];
    };
  }> {
    const mappedFood = new Set<string>();
    const mappedAttractions = new Set<string>();
    const unmapped = {
      food: [] as string[],
      interests: [] as string[]
    };

    // Process food preferences
    const allFoodPrefs = [
      ...(tripData.foodPreferences || []),
      ...(tripData.customFoodPreferences || [])
    ].map(pref => pref.trim());

    if (allFoodPrefs.length === 0) {
      mappedFood.add('catering.restaurant');
    } else {
        for (const food of allFoodPrefs) {
        const matches = this.findMatches(
          food,
          this.fuseFoodKeys,
          this.fuseFoodValues,
          this.flattenedFoodKeys
        );
        if (matches.length > 0) {
          matches.forEach(match => mappedFood.add(match));
        } else {
          unmapped.food.push(food);
        }
      }
    }
    
    // Process interests
    const allInterests = [
      ...(tripData.interests || []),
      ...(tripData.customInterests || [])
    ].map(interest => interest.trim());

    if (allInterests.length === 0) {
      mappedAttractions.add('tourism');
      mappedAttractions.add('entertainment');
    } else {
        for (const interest of allInterests) {
        const matches = this.findMatches(
          interest,
          this.fuseAttractionKeys,
          this.fuseAttractionValues,
          this.flattenedAttractionKeys
        );
        if (matches.length > 0) {
          matches.forEach(match => mappedAttractions.add(match));
        } else {
          unmapped.interests.push(interest);
        }
      }
    }
    
    return {
      foodCategories: Array.from(mappedFood).join(','),
      attractionCategories: Array.from(mappedAttractions).join(','),
      unmapped
    };
  }
}