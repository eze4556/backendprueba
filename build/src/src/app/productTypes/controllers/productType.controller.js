"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductTypes = exports.associateProductType = exports.search = exports.changeAccess = exports.createProductType = exports.getProductTypes = void 0;
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const search_models_1 = __importDefault(require("../../../models/search.models"));
const search_tools_1 = __importDefault(require("../../../tools/search.tools"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const productTypes = [
    { id: 1, name: 'Electronics', imageUrl: '/public/images/electronics.jpg' },
    { id: 2, name: 'Clothing', imageUrl: '/public/images/clothing.jpg' },
    { id: 3, name: 'Books', imageUrl: '/public/images/books.jpg' },
    { id: 4, name: 'Furniture', imageUrl: '/public/images/furniture.jpg' },
    { id: 5, name: 'Toys', imageUrl: '/public/images/toys.jpg' },
];
const getProductTypes = (req, res) => {
    res.json(productTypes);
};
exports.getProductTypes = getProductTypes;
const createProductType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }
        const imageUrl = `/uploads/${req.file.filename}`; // Guarda la URL de la imagen
        const newProductType = new productTypes_models_1.default({ name, imageUrl });
        await newProductType.save();
        res.status(201).json(newProductType);
    }
    catch (e) {
        return res.status(500).json({ message: 'Internal Server Error', error: e.message });
    }
};
exports.createProductType = createProductType;
const changeAccess = async (req, res) => {
    try {
        const { access } = req.body.product_access;
        const product = await productTypes_models_1.default.findByIdAndUpdate(req.body._id, { $set: { 'product_access.access': access } }); // Find by id and update product access
        return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, {
            message: 'Product access edited successfully',
            data: { _id: product === null || product === void 0 ? void 0 : product._id },
        });
    }
    catch (e) {
        return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
            message: 'Internal Error',
            data: { error: e.message },
        });
    }
};
exports.changeAccess = changeAccess;
const search = async (req, res) => {
    try {
        const raw_search = req.body.search;
        // Parse search and remove black list items
        const search = search_tools_1.default.parseSearch(raw_search);
        // Save search and raw search
        const registerSearch = new search_models_1.default({ search, raw_search });
        await registerSearch.save();
        // Product aggregation
        const products = await productTypes_models_1.default.aggregate([
            {
                $match: {
                    'product_access.access': true,
                    tags: {
                        $all: search,
                    },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categorie',
                    foreignField: '_id',
                    as: 'categorie',
                },
            },
            {
                $unwind: {
                    path: '$categorie',
                    includeArrayIndex: 'categorie._id',
                },
            },
            {
                $project: {
                    categorie: '$categorie.categorie',
                    product_info: 1,
                    product_access: 1,
                },
            },
        ]);
        return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, {
            message: 'Response successfully',
            data: { products },
        });
    }
    catch (e) {
        return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
            message: 'Internal Error',
            data: { error: e.message },
        });
    }
};
exports.search = search;
const associateProductType = async (req, res) => {
    try {
        const { _id } = req;
        const { product_id } = req.body;
        const product = await productTypes_models_1.default.updateOne({ _id: new mongoose_1.default.Types.ObjectId(product_id) }, { $addToSet: { associate: { _id: new mongoose_1.default.Types.ObjectId(_id), createdAt: (0, moment_1.default)() } } });
        return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Association successfully', data: { product } });
    }
    catch (e) {
        return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
            message: 'Internal Error',
            data: { error: e.message },
        });
    }
};
exports.associateProductType = associateProductType;
const getAllProductTypes = async (req, res) => {
    try {
        const { _id } = req; // Extract _id from token
        // Get all products from user
        const products = await productTypes_models_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(_id),
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categorie',
                    foreignField: '_id',
                    as: 'categorie',
                },
            },
            {
                $unwind: {
                    path: '$categorie',
                    includeArrayIndex: 'categorie._id',
                },
            },
            {
                $project: {
                    categorie: '$categorie.categorie',
                    product_info: 1,
                    product_access: 1,
                },
            },
        ]);
        return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, {
            message: 'Response successfully',
            data: { products },
        });
    }
    catch (e) {
        return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
            message: 'Internal Error',
            data: { error: e.message },
        });
    }
};
exports.getAllProductTypes = getAllProductTypes;
