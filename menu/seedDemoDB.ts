import { MongoClient } from "mongodb";
import { projects } from "../src/database/projects";
import { secrets } from "../src/database/secrets";
import { versions } from "../src/database/versions";
import { EnvType } from "../src/database/databaseTypes";

export async function seedDemoDB(dbClient: MongoClient) {
    const projectsInfo = [
        {
            name: "WeatherApp",
            services: [
                {
                    name: "OpenAI",
                    secrets: [
                        { name: "OpenAI API Key", envName: "OPENAI_API_KEY", value: "Initial OpenAI API key", envType: "production" }
                    ]
                },
                {
                    name: "SendGrid",
                    secrets: [
                        { name: "SendGrid Email API Key", envName: "SENDGRID_EMAIL_API_KEY", value: "Initial SendGrid Email API key", envType: "production" },
                        { name: "SendGrid Address Validation Key", envName: "SENDGRID_ADDRESS_VALIDATION_KEY", value: "Initial SendGrid Address Validation key", envType: "production" }
                    ]
                },
                {
                    name: "Google",
                    secrets: [
                        {
                            name: "Google Service Account",
                            envName: "GOOGLE_SERVICE_ACCOUNT",
                            value: JSON.stringify({
                                "type": "service_account",
                                "project_id": "weatherApp",
                                "private_key_id": "someprivatekeyid",
                                "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBK...\\n-----END PRIVATE KEY-----\\n",
                                "client_email": "demo@weatherApp.iam.gserviceaccount.com",
                                "client_id": "1234567890",
                                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                                "token_uri": "https://oauth2.googleapis.com/token",
                                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                                "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/demo%40example.iam.gserviceaccount.com"
                            }, null, 2),
                            envType: "production"
                        },
                        {
                            name: "Google OAuth Key",
                            envName: "GOOGLE_OAUTH2_KEY",
                            value: JSON.stringify({
                                "installed": {
                                    "client_id": "WeatherApp.apps.googleusercontent.com",
                                    "project_id": "WeatherApp",
                                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                                    "token_uri": "https://oauth2.googleapis.com/token",
                                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                                    "client_secret": "weatherApp-client-secret",
                                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob","http://localhost"]
                                }
                            }, null, 2),
                            envType: "production"
                        }
                    ]
                }
            ]
        },
        {
            name: "ToDoListApp",
            services: [
                {
                    name: "Database",
                    secrets: [
                        { name: "Database Connection String", envName: "DB_CONNECTION_STRING", value: "Initial DB connection string", envType: "test" },
                        { name: "Database User", envName: "DB_USER", value: "Initial DB user", envType: "development" },
                        { name: "Database Password", envName: "DB_PASS", value: "Initial DB pass", envType: "production" }
                    ]
                },
                {
                    name: "Authentication",
                    secrets: [
                        { name: "Authentication Secret", envName: "AUTH_SECRET", value: "Initial auth secret", envType: "production" },
                        { name: "Refresh Secret", envName: "REFRESH_SECRET", value: "Initial refresh secret", envType: "test" }
                    ]
                }
            ]
        }
    ];

    for (let project of projectsInfo) {
        for (let service of project.services) {
            await projects.create({ dbClient, projectName: project.name, serviceName: service.name });

            for (let { name: secretName, value: initialValue, envName, envType } of service.secrets) {
                // Add the secret with its initial version
                await secrets.add({
                    dbClient,
                    projectName: project.name,
                    serviceName: service.name,
                    secretName,
                    envName: envName, // envName is the name of the secret
                    envType: envType as EnvType,
                    versions: [{ versionName: 'v1.0', value: initialValue }]
                });

                // Optionally, add more versions if needed
            }
        }
    }

    console.log("Realistic dummy data insertion complete.");
}
