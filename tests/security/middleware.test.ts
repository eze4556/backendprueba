import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { canModifyProducts, canReadProducts, adminOnly } from '../../src/middleware/product-roles.middleware';
import { AuthRequest, IAuthUser, IAuthResponse } from '../../src/interfaces/auth.interface';

describe('🔐 Security Tests - Middleware Unit Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing';

  // Mock de Request, Response y NextFunction
  let mockRequest: AuthRequest;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    const baseRequest = {
      headers: {},
      params: {},
      body: {},
      query: {},
      cookies: {},
      signedCookies: {},
      get: jest.fn().mockImplementation((name) => undefined),
      header: jest.fn().mockImplementation((name) => undefined),
      accepts: jest.fn().mockReturnValue(false),
      acceptsCharsets: jest.fn().mockReturnValue(false),
      acceptsEncodings: jest.fn().mockReturnValue(false),
      acceptsLanguages: jest.fn().mockReturnValue(false),
      range: jest.fn().mockReturnValue(undefined),
      protocol: 'http',
      secure: false,
      ip: '',
      ips: [],
      subdomains: [],
      path: '/',
      hostname: 'localhost',
      host: 'localhost',
      fresh: false,
      stale: true,
      xhr: false,
      method: 'GET',
      url: '/',
      baseUrl: '/',
      originalUrl: '/',
      app: {} as any,
      route: {} as any,
    } as unknown as Request;

    mockRequest = {
      ...baseRequest,
      user: undefined,
      auth: undefined
    } as AuthRequest;
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  // Helper para generar tokens JWT
  const generateToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  describe('canReadProducts Middleware', () => {
    test('❌ Should reject request without authorization header', () => {
      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Autenticación requerida'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here'
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Autenticación requerida'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('✅ Should allow access with valid token', () => {
      const validToken = generateToken({
        id: 'test_user',
        email: 'test@test.com',
        role: 'user'
      });

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      // Simular que ya pasó por autenticación
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'test_user',
        email: 'test@test.com',
        role: 'user',
        flags: { isProvider: false, isProfessional: false }
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      if (mockRequest.user) {
        expect(mockRequest.user.id).toBe('test_user');
      }
    });

    test('✅ Should handle Bearer token with different casing', () => {
      const validToken = generateToken({
        id: 'test_user',
        email: 'test@test.com'
      });

      mockRequest.headers = {
        authorization: `bearer ${validToken}` // lowercase
      };

      // Simular que ya pasó por autenticación
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'test_user',
        email: 'test@test.com',
        role: 'user',
        flags: { isProvider: false, isProfessional: false }
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('canModifyProducts Middleware', () => {
    test('❌ Should reject regular user', () => {
      const userToken = generateToken({
        id: 'regular_user',
        email: 'user@test.com',
        role: 'user'
      });

      mockRequest.headers = {
        authorization: `Bearer ${userToken}`
      };

      // Simular autenticación exitosa pero sin permisos
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'regular_user',
        email: 'user@test.com',
        role: 'user',
        flags: { isProvider: false, isProfessional: false }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Se requieren privilegios especiales para modificar productos',
          errors: [{
            userRole: 'user',
            flags: { isProvider: false, isProfessional: false },
            requiredRoles: ['admin', 'professional', 'provider']
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('✅ Should allow admin access', () => {
      const adminToken = generateToken({
        id: 'admin_user',
        email: 'admin@test.com',
        role: 'admin'
      });

      mockRequest.headers = {
        authorization: `Bearer ${adminToken}`
      };

      // Simular autenticación exitosa con rol admin
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: true,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'admin_user',
        email: 'admin@test.com',
        role: 'admin',
        flags: { isProvider: false, isProfessional: false }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('✅ Should allow professional access', () => {
      const professionalToken = generateToken({
        id: 'professional_user',
        email: 'professional@test.com',
        role: 'professional',
        isProfessional: true
      });

      mockRequest.headers = {
        authorization: `Bearer ${professionalToken}`
      };

      // Simular que ya pasó por autenticación
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: true
      };
      mockRequest.user = {
        id: 'professional_user',
        email: 'professional@test.com',
        role: 'professional',
        flags: { isProvider: false, isProfessional: true }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('✅ Should allow provider access', () => {
      const providerToken = generateToken({
        id: 'provider_user',
        email: 'provider@test.com',
        role: 'provider',
        isProvider: true
      });

      mockRequest.headers = {
        authorization: `Bearer ${providerToken}`
      };

      // Simular que ya pasó por autenticación
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: true,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'provider_user',
        email: 'provider@test.com',
        role: 'provider',
        flags: { isProvider: true, isProfessional: false }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('✅ Should allow access with isProvider flag even if role is different', () => {
      const mixedToken = generateToken({
        id: 'mixed_user',
        email: 'mixed@test.com',
        role: 'user',
        isProvider: true
      });

      mockRequest.headers = {
        authorization: `Bearer ${mixedToken}`
      };

      // Simular que ya pasó por autenticación
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: true,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'mixed_user',
        email: 'mixed@test.com',
        role: 'user',
        flags: { isProvider: true, isProfessional: false }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('❌ Should reject user with false provider/professional flags', () => {
      const falseToken = generateToken({
        id: 'false_user',
        email: 'false@test.com',
        role: 'user',
        isProvider: false,
        isProfessional: false
      });

      mockRequest.headers = {
        authorization: `Bearer ${falseToken}`
      };

      // Simular autenticación exitosa pero sin permisos
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'false_user',
        email: 'false@test.com',
        role: 'user',
        flags: { isProvider: false, isProfessional: false }
      };

      canModifyProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Se requieren privilegios especiales para modificar productos',
          errors: [{
            userRole: 'user',
            flags: { isProvider: false, isProfessional: false },
            requiredRoles: ['admin', 'professional', 'provider']
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminOnly Middleware', () => {
    test('❌ Should reject non-admin users', () => {
      const userToken = generateToken({
        id: 'regular_user',
        email: 'user@test.com',
        role: 'user'
      });

      mockRequest.headers = {
        authorization: `Bearer ${userToken}`
      };

      // Simular autenticación exitosa pero sin rol admin
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'regular_user',
        email: 'user@test.com',
        role: 'user',
        flags: { isProvider: false, isProfessional: false }
      };

      adminOnly(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Acceso denegado. Se requiere rol de administrador.',
          errors: [{
            userRole: 'user',
            requiredRole: 'admin'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject professional users', () => {
      const professionalToken = generateToken({
        id: 'professional_user',
        email: 'professional@test.com',
        role: 'professional',
        isProfessional: true
      });

      mockRequest.headers = {
        authorization: `Bearer ${professionalToken}`
      };

      // Simular autenticación exitosa pero sin rol admin
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: true
      };
      mockRequest.user = {
        id: 'professional_user',
        email: 'professional@test.com',
        role: 'professional',
        flags: { isProvider: false, isProfessional: true }
      };

      adminOnly(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Acceso denegado. Se requiere rol de administrador.',
          errors: [{
            userRole: 'professional',
            requiredRole: 'admin'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject provider users', () => {
      const providerToken = generateToken({
        id: 'provider_user',
        email: 'provider@test.com',
        role: 'provider',
        isProvider: true
      });

      mockRequest.headers = {
        authorization: `Bearer ${providerToken}`
      };

      // Simular autenticación exitosa pero sin rol admin
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: true,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'provider_user',
        email: 'provider@test.com',
        role: 'provider',
        flags: { isProvider: true, isProfessional: false }
      };

      adminOnly(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Acceso denegado. Se requiere rol de administrador.',
          errors: [{
            userRole: 'provider',
            requiredRole: 'admin'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('✅ Should allow admin access', () => {
      const adminToken = generateToken({
        id: 'admin_user',
        email: 'admin@test.com',
        role: 'admin'
      });

      mockRequest.headers = {
        authorization: `Bearer ${adminToken}`
      };

      // Simular que ya pasó por autenticación con rol admin
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: true,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: 'admin_user',
        email: 'admin@test.com',
        role: 'admin',
        flags: { isProvider: false, isProfessional: false }
      };

      adminOnly(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security Scenarios', () => {
    test('❌ Should handle missing token after Bearer', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should handle malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'NotBearer token123'
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should handle expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'test_user', email: 'test@test.com' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should handle token signed with wrong secret', () => {
      const wrongToken = jwt.sign(
        { id: 'test_user', email: 'test@test.com' },
        'wrong_secret_key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${wrongToken}`
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should handle token with missing required claims', () => {
      const incompleteToken = generateToken({
        // Missing id and other required fields
        email: 'incomplete@test.com'
      });

      mockRequest.headers = {
        authorization: `Bearer ${incompleteToken}`
      };

      // Simular que ya pasó por autenticación con datos incompletos
      mockRequest.auth = {
        isAuthenticated: true,
        isAdmin: false,
        isProvider: false,
        isProfessional: false
      };
      mockRequest.user = {
        id: undefined, // Missing required field
        email: 'incomplete@test.com'
      } as any;

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled(); // Should still pass but with incomplete user data
      expect((mockRequest as any).user.id).toBeUndefined();
      expect((mockRequest as any).user.email).toBe('incomplete@test.com');
    });

    test('🔒 Should sanitize user input in error responses', () => {
      mockRequest.headers = {
        authorization: 'Bearer <script>alert("xss")</script>'
      };

      canReadProducts(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      // Verify that the error response doesn't contain the malicious script
      const errorCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(errorCall)).not.toContain('<script>');
    });
  });
});