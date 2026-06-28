export const config = {
  api: {
    port: parseInt(process.env.PORT ?? "4000"),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"]
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-secret",
    expiry: process.env.JWT_EXPIRY ?? "1h"
  },
  database: {
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/elite_fitness"
  },
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  email: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM_EMAIL ?? "noreply@eliteifitness.com",
    fromName: process.env.SMTP_FROM_NAME ?? "Elite Fitness"
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  logging: {
    level: process.env.LOG_LEVEL ?? "info",
    filePath: process.env.LOG_FILE ?? "logs/api.log"
  },
  apm: {
    serverUrl: process.env.APM_SERVER_URL,
    serviceName: process.env.APM_SERVICE_NAME ?? "elite-fitness-api",
    environment: process.env.APM_ENVIRONMENT ?? "development"
  },
  aws: {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000"),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "600")
  }
};

export function validateConfig(): void {
  const requiredVars = ["DATABASE_URL"];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    const prodRequired = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "STRIPE_SECRET_KEY"];
    const prodMissing = prodRequired.filter((v) => !process.env[v] || process.env[v] === "dev-secret");
    if (prodMissing.length > 0) {
      throw new Error(`Missing production environment variables: ${prodMissing.join(", ")}`);
    }
  }
}
