import Product from '../../productTypes/models/productTypes.models';
import Professional from '../../professional/models/professional.models';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  profession?: string;
}

export interface SearchResult {
  products: any[];
  professionals: any[];
  total: {
    products: number;
    professionals: number;
  };
}

class SearchService {
  
  /**
   * Búsqueda global en productos y profesionales
   */
  public async globalSearch(
    query: string,
    type?: 'product' | 'professional' | 'all',
    filters?: SearchFilters,
    limit: number = 10,
    page: number = 1
  ): Promise<SearchResult> {
    const skip = (page - 1) * limit;
    const searchType = type || 'all';
    
    const result: SearchResult = {
      products: [],
      professionals: [],
      total: { products: 0, professionals: 0 }
    };
    
    // Búsqueda en productos
    if (searchType === 'product' || searchType === 'all') {
      const productQuery: any = {
        $or: [
          { 'product_info.name': { $regex: query, $options: 'i' } },
          { 'product_info.description': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };
      
      // Aplicar filtros
      if (filters?.category) {
        productQuery.categorie = filters.category;
      }
      
      if (filters?.minPrice || filters?.maxPrice) {
        productQuery['product_info.price'] = {};
        if (filters.minPrice) productQuery['product_info.price'].$gte = filters.minPrice;
        if (filters.maxPrice) productQuery['product_info.price'].$lte = filters.maxPrice;
      }
      
      result.total.products = await Product.countDocuments(productQuery);
      result.products = await Product.find(productQuery)
        .populate('user', 'name email')
        .populate('categorie', 'name')
        .skip(skip)
        .limit(limit)
        .select('product_info product_status tags createdAt')
        .lean();
    }
    
    // Búsqueda en profesionales
    if (searchType === 'professional' || searchType === 'all') {
      const professionalQuery: any = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { profession: { $regex: query, $options: 'i' } },
          { categorie: { $regex: query, $options: 'i' } }
        ]
      };
      
      // Aplicar filtros
      if (filters?.profession) {
        professionalQuery.profession = { $regex: filters.profession, $options: 'i' };
      }
      
      if (filters?.minRating) {
        professionalQuery.score = { $gte: filters.minRating };
      }
      
      result.total.professionals = await Professional.countDocuments(professionalQuery);
      result.professionals = await Professional.find(professionalQuery)
        .skip(skip)
        .limit(limit)
        .select('name profession experience score categorie')
        .lean();
    }
    
    return result;
  }
  
  /**
   * Autocomplete para búsqueda rápida
   */
  public async autocomplete(query: string, limit: number = 5): Promise<any[]> {
    if (!query || query.length < 2) {
      return [];
    }
    
    const regex = new RegExp(`^${query}`, 'i');
    
    // Buscar productos
    const products = await Product.find({
      'product_info.name': regex
    })
      .limit(limit)
      .select('product_info.name product_info.imageUrl')
      .lean();
    
    // Buscar profesionales
    const professionals = await Professional.find({
      name: regex
    })
      .limit(limit)
      .select('name profession')
      .lean();
    
    // Combinar resultados
    const suggestions = [
      ...products.map(p => ({
        type: 'product',
        id: p._id,
        name: (p as any).product_info.name,
        imageUrl: (p as any).product_info.imageUrl
      })),
      ...professionals.map(p => ({
        type: 'professional',
        id: p._id,
        name: (p as any).name,
        profession: (p as any).profession
      }))
    ];
    
    return suggestions.slice(0, limit);
  }
  
  /**
   * Búsqueda por categoría con filtros avanzados
   */
  public async searchByCategory(
    categoryId: string,
    filters?: SearchFilters,
    limit: number = 20,
    page: number = 1,
    sortBy: 'price_asc' | 'price_desc' | 'rating' | 'newest' = 'newest'
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    const query: any = { categorie: categoryId };
    
    // Aplicar filtros
    if (filters?.minPrice || filters?.maxPrice) {
      query['product_info.price'] = {};
      if (filters.minPrice) query['product_info.price'].$gte = filters.minPrice;
      if (filters.maxPrice) query['product_info.price'].$lte = filters.maxPrice;
    }
    
    // Determinar ordenamiento
    let sort: any = { createdAt: -1 };
    switch (sortBy) {
      case 'price_asc':
        sort = { 'product_info.price': 1 };
        break;
      case 'price_desc':
        sort = { 'product_info.price': -1 };
        break;
      case 'rating':
        sort = { 'product_info.rating': -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
    }
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('user', 'name')
      .populate('categorie', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    return {
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  }
  
  /**
   * Obtener productos relacionados (por tags y categoría)
   */
  public async getRelatedProducts(productId: string, limit: number = 5): Promise<any[]> {
    const product = await Product.findById(productId).select('tags categorie').lean();
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const query: any = {
      _id: { $ne: productId },
      $or: [
        { categorie: (product as any).categorie },
        { tags: { $in: (product as any).tags } }
      ]
    };
    
    const related = await Product.find(query)
      .limit(limit)
      .select('product_info tags')
      .lean();
    
    return related;
  }
  
  /**
   * Productos populares/destacados
   */
  public async getPopularProducts(limit: number = 10): Promise<any[]> {
    const products = await Product.find({
      'product_status.status': 'active'
    })
      .sort({ 'associate.length': -1, createdAt: -1 })
      .limit(limit)
      .populate('user', 'name')
      .populate('categorie', 'name')
      .select('product_info tags')
      .lean();
    
    return products;
  }
  
  /**
   * Profesionales mejor calificados
   */
  public async getTopProfessionals(limit: number = 10, profession?: string): Promise<any[]> {
    const query: any = {};
    
    if (profession) {
      query.profession = { $regex: profession, $options: 'i' };
    }
    
    const professionals = await Professional.find(query)
      .sort({ score: -1, experience: -1 })
      .limit(limit)
      .lean();
    
    return professionals;
  }
}

export default new SearchService();
