export interface AfipConfig {
  cuit: string;
  certificatePath: string;
  privateKeyPath: string;
  isProduction: boolean;
}

export interface AfipEndpoints {
  wsaa: string;
  wsfe: string;
}