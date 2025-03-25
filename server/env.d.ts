interface Environment {
  ENVIRONMENT: 'development' | 'production'
}

declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string
    ENVIRONMENT: 'development' | 'production'
    CLIENT_URL: string
    TELEGRAM_TOKEN: string
  }
}
