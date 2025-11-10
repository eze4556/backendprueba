import { Item } from './ranking.types';

export const rankItems = (items: Item[]): Item[] => {
    // Lógica para ordenar los items por score descendente
    return items.sort((a, b) => b.score - a.score);
};

// Función auxiliar para agregar rangos a los items
export const addRanksToItems = (items: Item[]): (Item & { rank: number })[] => {
    const rankedItems = rankItems(items);
    return rankedItems.map((item, index) => ({
        ...item,
        rank: index + 1
    }));
};