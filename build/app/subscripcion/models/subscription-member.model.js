"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = exports.MemberStatus = exports.PlanType = void 0;
var PlanType;
(function (PlanType) {
    PlanType["BASE"] = "BASE";
    PlanType["PREMIUM"] = "PREMIUM";
    PlanType["ENTERPRISE"] = "ENTERPRISE";
})(PlanType || (exports.PlanType = PlanType = {}));
var MemberStatus;
(function (MemberStatus) {
    MemberStatus["INVITED"] = "INVITED";
    MemberStatus["ACTIVE"] = "ACTIVE";
    MemberStatus["INACTIVE"] = "INACTIVE";
})(MemberStatus || (exports.MemberStatus = MemberStatus = {}));
var UserType;
(function (UserType) {
    UserType["FREELANCE"] = "FREELANCE";
    UserType["EMPLOYEE"] = "EMPLOYEE";
    UserType["ADMIN"] = "ADMIN";
})(UserType || (exports.UserType = UserType = {}));
//# sourceMappingURL=subscription-member.model.js.map