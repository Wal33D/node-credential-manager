import { Db } from "mongodb";

export const findSpecificKeyForService = async ({
    serviceName,
    keyType,
    dbConnection
  }: {
    serviceName: string,
    keyType: string,
    dbConnection: Db | any
  }) => {
    let status = false;
    let credential = null;
    let message = '';
  
    try {
      if (!dbConnection) {
        throw new Error('Database connection is not initialized.');
      }
  
      const dbCollection = dbConnection.collection('apiKeys');
      const document = await dbCollection.findOne({}); // Fetch the single document
  
      if (document && document.services) {
        // Case-insensitive search for service
        const caseInsensitiveMatchService = document.services.find((service: { name: string; }) => service.name.toLowerCase() === serviceName.toLowerCase());
  
        if (!caseInsensitiveMatchService) {
          message = `Service '${serviceName}' not found.`;
          return { status, credential, message };
        }
  
        // Case-sensitive validation
        if (caseInsensitiveMatchService.name !== serviceName) {
          message = `Did you mean this service '${caseInsensitiveMatchService.name}'? Service names are case-sensitive.`;
          return { status, credential, message };
        }
  
        // At this point, caseInsensitiveMatchService.name === serviceName
        const service = caseInsensitiveMatchService; // No need to find again, reuse caseInsensitiveMatchService
  
        // Search for the key based on keyType
        const key = service.keys.find((key: { keyName: string; }) => key.keyName === keyType);
  
        if (key) {
          status = true;
          credential = key;
          message = `${keyType} key for service ${serviceName} retrieved successfully.`;
        } else {
          message = `${keyType} key for service '${serviceName}' not found.`;
        }
      } else {
        throw new Error('No services found in the database.');
      }
    } catch (error: any) {
      message = `Error: ${error.message}`;
    }
  
    return { status, credential, message };
  };
  