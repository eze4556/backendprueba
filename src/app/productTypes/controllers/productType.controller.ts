// filepath: src/controllers/productTypes.controller.ts
import { Request, Response } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { CREATED, SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import ProductModel from '../models/productTypes.models';
import SearchModel, { ISearch } from "../../../models/search.models";
import { SearchInterface } from '../../../interfaces/search.interface';
import searchTool from '../../../tools/search.tools';
import mongoose from 'mongoose';
import moment from 'moment';

const productTypes = [
  { id: 1, name: 'Electronics', imageUrl: '/public/images/electronics.jpg' },
  { id: 2, name: 'Clothing', imageUrl: '/public/images/clothing.jpg' },
  { id: 3, name: 'Books', imageUrl: '/public/images/books.jpg' },
  { id: 4, name: 'Furniture', imageUrl: '/public/images/furniture.jpg' },
  { id: 5, name: 'Toys', imageUrl: '/public/images/toys.jpg' },
];

export const getProductTypes = (req: Request, res: Response) => {
  res.json(productTypes);
};

export const createProductType = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const imageUrl = `/uploads/${req.file.filename}`; // Guarda la URL de la imagen
    const newProductType = new ProductModel({ name, imageUrl });
    await newProductType.save();
    res.status(201).json(newProductType);
  } catch (e) {
    return res.status(500).json({ message: 'Internal Server Error', error: (e as Error).message });
  }
};

export const changeAccess = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { access } = req.body.product_access;
    const product = await ProductModel.findByIdAndUpdate(req.body._id, { $set: { 'product_access.access': access } }); // Find by id and update product access
    return HttpHandler.response(res, SUCCESS, {
      message: 'Product access edited successfully',
      data: { _id: product?._id },
    });
  } catch (e) {
    return HttpHandler.response(res, INTERNAL_ERROR, {
      message: 'Internal Error',
      data: { error: (e as Error).message },
    });
  }
};

export const search = async (req: Request, res: Response): Promise<Response> => {
  try {
    const raw_search = req.body.search;
    // Parse search and remove black list items
    const search = searchTool.parseSearch(raw_search);
    // Save search and raw search
    const registerSearch: ISearch = new SearchModel({ search, raw_search });
    await registerSearch.save();
    // Product aggregation
    const products = await ProductModel.aggregate([
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

    return HttpHandler.response(res, SUCCESS, {
      message: 'Response successfully',
      data: { products },
    });
  } catch (e) {
    return HttpHandler.response(res, INTERNAL_ERROR, {
      message: 'Internal Error',
      data: { error: (e as Error).message },
    });
  }
};

export const associateProductType = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id } = req;
    const { product_id } = req.body;
    const product = await ProductModel.updateOne(
      { _id: new mongoose.Types.ObjectId(product_id) },
      { $addToSet: { associate: { _id: new mongoose.Types.ObjectId(_id), createdAt: moment() } } }
    );
    return HttpHandler.response(res, SUCCESS, { message: 'Association successfully', data: { product } });
  } catch (e) {
    return HttpHandler.response(res, INTERNAL_ERROR, {
      message: 'Internal Error',
      data: { error: (e as Error).message },
    });
  }
};

export const getAllProductTypes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id } = req; // Extract _id from token
    // Get all products from user
    const products = await ProductModel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(_id),
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
    return HttpHandler.response(res, SUCCESS, {
      message: 'Response successfully',
      data: { products },
    });
  } catch (e) {
    return HttpHandler.response(res, INTERNAL_ERROR, {
      message: 'Internal Error',
      data: { error: (e as Error).message },
    });
  }
};