import { MongoClient } from "mongodb";
import { projects } from "../src/database/projects";
import { secrets } from "../src/database/secrets";
import { versions } from "../src/database/versions";
import {EnvType} from "../src/database/databaseTypes";

export async function seedDemoDB(dbClient: MongoClient) {
    const projectsInfo = [
        {
            name: "WeatherApp",
            services: [
                {
                    name: "OpenAI",
                    secrets: [
                        { name: "OPENAI_API_KEY", value: "Initial OpenAI API key", envType: "production" }
                    ]
                },
                {
                    name: "EmailService",
                    secrets: [
                        { name: "SMTP_SERVER", value: "Initial SMTP server", envType: "development" },
                        { name: "EMAIL_API_KEY", value: "Initial email service API key", envType: "production" }
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
                        { name: "DB_CONNECTION_STRING", value: "Initial DB connection string", envType: "test" },
                        { name: "DB_USER", value: "Initial DB user", envType: "development" },
                        { name: "DB_PASS", value: "Initial DB pass", envType: "production" }
                    ]
                },
                {
                    name: "Authentication",
                    secrets: [
                        { name: "AUTH_SECRET", value: "Initial auth secret", envType: "production" },
                        { name: "REFRESH_SECRET", value: "Initial refresh secret", envType: "test" }
                    ]
                }
            ]
        }
    ];

    for (let project of projectsInfo) {
        for (let service of project.services) {
            await projects.create({ dbClient, projectName: project.name, serviceName: service.name });

            for (let { name: secretName, value: initialValue, envType } of service.secrets) {
                // Add the secret with its initial version
                await secrets.add({
                    dbClient,
                    projectName: project.name,
                    serviceName: service.name,
                    secretName,
                    envName: secretName, // envName is the name of the secret
                    envType: envType as EnvType,
                    versions: [{ versionName: 'v1.0', value: initialValue }]
                });

                // Optionally, add more versions if needed
            }
        }
    }

    console.log("Realistic dummy data insertion complete.");
}
