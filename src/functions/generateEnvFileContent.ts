import { MongoClient } from "mongodb";
import { secrets } from "../database/secrets"; 
import fs from "fs";
import path from "path";

/**
 * Generates a .env file for a specified project from the database and saves it locally.
 * 
 * @param dbClient - The MongoDB client instance.
 * @param projectName - The name of the project for which to generate the .env file.
 * @param outputPath - The output directory where the .env file will be saved.
 */
export async function generateEnvFileForProject(dbClient: MongoClient, projectName: string, outputPath: string): Promise<void> {
    try {
        // Fetch all secrets for the specified project
        const projectSecrets = await secrets.list({ dbClient, projectName });
        
        if (!projectSecrets.length) {
            console.log(`No secrets found for project: ${projectName}`);
            return;
        }

        // Generate .env content
        let envContent = projectSecrets.map((secret: { versions: { value: string; }[]; envName: any; }) => {
            // Assuming the 'envName' field in your secrets schema is the environment variable name
            // and the first version in the versions array is the current value to use.
            const currentValue = secret.versions[0]?.value || '';
            return `${secret.envName}=${currentValue}`;
        }).join('\n');

        // Define the output file path
        const envFilePath = path.join(outputPath, `${projectName}.env`);

        // Write the .env content to a file
        fs.writeFile(envFilePath, envContent, (err) => {
            if (err) throw err;
            console.log(`The .env file has been saved as ${envFilePath}`);
        });
    } catch (error: any) {
        console.error(`An error occurred while generating the .env file: ${error.message}`);
    }
}
