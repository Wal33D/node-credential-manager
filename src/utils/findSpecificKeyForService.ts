import { Db } from "mongodb";
const collectionName = 'testKeys';

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

      const dbCollection = dbConnection.collection(collectionName);
      const document = await dbCollection.findOne({}); // Assume this fetches the document relevant to this context

      if (document && document.services) {
        const caseInsensitiveMatchService = document.services.find((service: { name: string; }) => service.name.toLowerCase() === serviceName.toLowerCase());
  
        if (!caseInsensitiveMatchService) {
          message = `Service '${serviceName}' not found.`;
          return { status, credential, message };
        }
  
        if (caseInsensitiveMatchService.name !== serviceName) {
          message = `Did you mean this service '${caseInsensitiveMatchService.name}'? Service names are case-sensitive.`;
          return { status, credential, message };
        }
  
        const service = caseInsensitiveMatchService;
        const key = service.keys.find((key: { keyName: string; }) => key.keyName === keyType);
  
        if (key) {
          status = true;
          credential = key;
          message = `${keyType} key for service ${serviceName} retrieved successfully.`;
        } else {
          // Enhanced message hint if the key was not found
          let hint = "";
          if (keyType === "Primary" || keyType === "Secondary") {
            const alternativeKeyType = keyType === "Primary" ? "Secondary" : "Primary";
            const alternativeKey = service.keys.find((key: { keyName: string; }) => key.keyName === alternativeKeyType);
            if (alternativeKey) {
              hint = ` However, a ${alternativeKeyType} key is available.`;
            }
          }
          message = `${keyType} key for service '${serviceName}' not found.${hint}`;
        }
      } else {
        throw new Error('No services found in the database.');
      }
    } catch (error: any) {
      message = `Error: ${error.message}`;
    }

    return { status, credential, message };
  };
