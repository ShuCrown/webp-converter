export interface CertificateConfig {
  cert: string;
  key: string;
}

export interface HttpsConfig {
  port: number;
  host: string;
}

export interface Config {
  https: HttpsConfig;
  certificates: CertificateConfig;
}

declare const config: Config;
declare const certificates: CertificateConfig;

export { config, certificates };
