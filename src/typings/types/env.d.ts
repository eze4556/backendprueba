// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      JWT_KEY: string;
      DATABASE_URL: string;
    }
  }
  const port = process.env.PORT || '3000';
  const jwtKey = process.env.JWT_KEY;
  
  if (!jwtKey) {
    throw new Error('JWT_KEY no está definida en el archivo .env');
  }
  
  console.log(`Server running on port ${port}`);
  