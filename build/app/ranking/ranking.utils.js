"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRanksToItems = exports.rankItems = void 0;
const rankItems = (items) => {
    // Lógica para ordenar los items por score descendente
    return items.sort((a, b) => b.score - a.score);
};
exports.rankItems = rankItems;
// Función auxiliar para agregar rangos a los items
const addRanksToItems = (items) => {
    const rankedItems = (0, exports.rankItems)(items);
    return rankedItems.map((item, index) => ({
        ...item,
        rank: index + 1
    }));
};
exports.addRanksToItems = addRanksToItems;
//# sourceMappingURL=ranking.utils.js.map