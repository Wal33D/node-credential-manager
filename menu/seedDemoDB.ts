import { MongoClient } from "mongodb";
import { projects } from "../src/database/projects";
import { secrets } from "../src/database/secrets";
import { versions } from "../src/database/versions";
import { EnvType } from "../src/database/databaseTypes";

function getRandomInt(min: any, max: any) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addVersionsForSecret(dbClient: MongoClient, projectName: string, serviceName: string, secretName: string) {
    // Decide randomly how many versions to add (between 0 and 5)
    const versionsCount = getRandomInt(0, 5);
    for (let i = 1; i <= versionsCount; i++) {
        const versionName = `v1.${i}`;
        const value = `Dummy value for ${versionName}`;
        await versions.add({
            dbClient,
            projectName,
            serviceName,
            secretName,
            versionName,
            value,
        });
    }
}

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
                                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                                }
                            }, null, 2),
                            envType: "production"
                        }
                    ]
                },
                {
                    name: "Azure",
                    secrets: [
                        {
                            name: "Azure Web API Key 1",
                            envName: "AZURE_WEB_API_KEY_1",
                            value: "Initial Azure Web API Key 1",
                            envType: "production"
                        },
                        {
                            name: "Azure Web API Key 2",
                            envName: "AZURE_WEB_API_KEY_2",
                            value: "Initial Azure Web API Key 2",
                            envType: "production"
                        },
                        {
                            name: "Azure Endpoint",
                            envName: "AZURE_ENDPOINT",
                            value: "https://example.azure.com/api",
                            envType: "production"
                        }
                    ]
                },
                {
                    name: "AWS Services",
                    secrets: [
                        {
                            name: "AWS Access Key",
                            envName: "AWS_ACCESS_KEY_ID",
                            value: "Initial AWS Access Key",
                            envType: "production"
                        },
                        {
                            name: "AWS Secret Access Key",
                            envName: "AWS_SECRET_ACCESS_KEY",
                            value: "Initial AWS Secret Access Key",
                            envType: "production"
                        },
                        {
                            name: "AWS S3 Bucket Name",
                            envName: "AWS_S3_BUCKET_NAME",
                            value: "weatherapp-bucket",
                            envType: "production"
                        }
                    ]
                },
                {
                    name: "Stripe",
                    secrets: [
                        {
                            name: "Stripe Secret Key",
                            envName: "STRIPE_SECRET_KEY",
                            value: "Initial Stripe Secret Key",
                            envType: "production"
                        },
                        {
                            name: "Stripe Publishable Key",
                            envName: "STRIPE_PUBLISHABLE_KEY",
                            value: "Initial Stripe Publishable Key",
                            envType: "production"
                        }
                    ]
                }
            ]
        },

    ];

    for (let project of projectsInfo) {
        for (let service of project.services) {
            await projects.create({ dbClient, projectName: project.name, serviceName: service.name });

            for (let secret of service.secrets) {
                // Add the secret with its initial version
                await secrets.add({
                    dbClient,
                    projectName: project.name,
                    serviceName: service.name,
                    secretName: secret.name,
                    envName: secret.envName,
                    envType: secret.envType as EnvType,
                    versions: [{ versionName: 'v1.0', value: secret.value }]
                });

                // Dynamically add between 0 and 5 additional versions for each secret
                await addVersionsForSecret(dbClient, project.name, service.name, secret.name);
            }
        }
    }

    console.log("Realistic dummy data insertion complete with dynamic versions.");
}
