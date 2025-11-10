import { Request, Response } from 'express';
import HttpHandler from '../helpers/handler.helper';
import mongoose from 'mongoose';

export abstract class BaseController {
  protected model: mongoose.Model<any>;

  constructor(model: mongoose.Model<any>) {
    this.model = model;
  }

  // Método GET genérico con paginación y filtros
  protected async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      const filter = this.buildFilter(req.query);
      const sort = this.buildSort(req.query.sort as string);

      const [items, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit),
        this.model.countDocuments(filter)
      ]);

      return HttpHandler.success(res, {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // Método GET por ID genérico
  protected async getById(req: Request, res: Response) {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        return HttpHandler.error(res, {
          code: 404,
          message: 'Item not found'
        });
      }
      return HttpHandler.success(res, item);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // Método CREATE genérico
  protected async create(req: Request, res: Response) {
    try {
      const item = new this.model(req.body);
      await item.save();
      return HttpHandler.success(res, item, 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // Método UPDATE genérico
  protected async update(req: Request, res: Response) {
    try {
      const item = await this.model.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!item) {
        return HttpHandler.error(res, {
          code: 404,
          message: 'Item not found'
        });
      }
      return HttpHandler.success(res, item);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // Método DELETE genérico
  protected async delete(req: Request, res: Response) {
    try {
      const item = await this.model.findByIdAndDelete(req.params.id);
      if (!item) {
        return HttpHandler.error(res, {
          code: 404,
          message: 'Item not found'
        });
      }
      return HttpHandler.success(res, { message: 'Item deleted successfully' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // Métodos auxiliares
  private buildFilter(query: any): any {
    const filter: any = {};
    // Eliminar parámetros de paginación y ordenamiento
    delete query.page;
    delete query.limit;
    delete query.sort;

    // Construir filtro basado en los parámetros restantes
    Object.keys(query).forEach(key => {
      if (query[key]) {
        if (mongoose.Types.ObjectId.isValid(query[key])) {
          filter[key] = query[key];
        } else if (typeof query[key] === 'string') {
          filter[key] = new RegExp(query[key], 'i');
        } else {
          filter[key] = query[key];
        }
      }
    });

    return filter;
  }

  private buildSort(sortParam: string): any {
    if (!sortParam) return { createdAt: -1 };
    
    const sort: any = {};
    const fields = sortParam.split(',');
    
    fields.forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });

    return sort;
  }

  private handleError(res: Response, error: any) {
    console.error('Error in controller:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'Validation Error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error instanceof mongoose.Error.CastError) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'Invalid ID format'
      });
    }

    if (error.code === 11000) { // Duplicate key error
      return HttpHandler.error(res, {
        code: 409,
        message: 'Duplicate entry'
      });
    }

    return HttpHandler.error(res, {
      code: 500,
      message: 'Internal Server Error'
    });
  }
}