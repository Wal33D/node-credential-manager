require('dotenv');

export const globalDbConfig = {
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbCluster: process.env.DB_CLUSTER,
};
