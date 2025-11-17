export interface HttpConfig {
  port: number;
  host: string;
}

export interface Config {
  http: HttpConfig;
}

declare const config: Config;

export { config };