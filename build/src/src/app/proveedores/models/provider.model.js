"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderCategory = exports.ProviderStatus = void 0;
var ProviderStatus;
(function (ProviderStatus) {
    ProviderStatus["PENDING"] = "PENDING";
    ProviderStatus["APPROVED"] = "APPROVED";
    ProviderStatus["REJECTED"] = "REJECTED";
})(ProviderStatus || (exports.ProviderStatus = ProviderStatus = {}));
var ProviderCategory;
(function (ProviderCategory) {
    ProviderCategory["EXAMPLE"] = "EXAMPLE";
    ProviderCategory["ANOTHER"] = "ANOTHER";
})(ProviderCategory || (exports.ProviderCategory = ProviderCategory = {}));
