import { MongoClient } from "mongodb";

interface DbConnectionParams {
  dbUsername?: string;
  dbPassword?: string;
  dbCluster?: string;
}

interface DbConnectionResult {
  status: boolean;
  message: string;
  client?: MongoClient;
}

export const initializeDbConnection = async ({
  dbUsername = process.env.DB_USERNAME || "admin",
  dbPassword = process.env.DB_PASSWORD || "password",
  dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net"
}: DbConnectionParams = {}): Promise<DbConnectionResult> => {
  let status = false;
  let message = "";
  let client: MongoClient | undefined;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const uri = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}`;
      client = new MongoClient(uri);
      await client.connect();
      status = true;
      message = "Database connection initialized successfully.";
      break; 
    } catch (error: any) {
      attempts++;
      message = `Attempt ${attempts}: Error initializing database connection: ${error.message}`;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  if (!status) {
    message = `Failed to initialize database connection after ${maxAttempts} attempts.`;
  }

  return { status, message, client };
};
