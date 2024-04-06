// startMenu.ts
import inquirer from 'inquirer';
import { MongoClient } from 'mongodb';
import { initializeDbConnection } from './database/initializeDbConnection';
import { checkAndGenerateEncryptionKey } from './encryptionInit';
import { runAllTests } from './tests/runAllTests';
import { createDatabaseManager } from './DatabaseManager';

type MainMenuOptions = 'Services' | 'Secrets' | 'Projects' | 'Run Tests' | 'Exit';
type ServiceMenuOptions = 'List Services' | 'Add Service' | 'Rename Service' | 'Remove Service' | 'Back';
type SecretMenuOptions = 'List Secrets' | 'Add Secret' | 'Rename Secret' | 'Remove Secret' | 'Back';
type ProjectMenuOptions = 'List Projects' | 'Create Project' | 'Delete Project' | 'Copy Project' | 'Back';

const startMenu = async () => {
    const inquirer = await import('inquirer');

    console.log("Credential Manager");
    console.log("Initializing database connection...");
    await checkAndGenerateEncryptionKey();

    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        return;
    }

    const dbClient: MongoClient = connectionResult.client;
    const databaseManager = await createDatabaseManager(dbClient);

    const mainMenu:any = async () => {
        const answer = await inquirer({
            name: 'mainMenuChoice',
            type: 'list',
            message: 'Welcome to Credential Manager. Select an option:',
            choices: ['Services', 'Secrets', 'Projects', 'Run Tests', 'Exit'],
        });

        switch (answer.mainMenuChoice) {
            case 'Services':
                return servicesMenu();
            case 'Secrets':
                return secretsMenu();
            case 'Projects':
                return projectsMenu();
            case 'Run Tests':
                await runAllTests();
                return mainMenu();
            case 'Exit':
                console.log('Exiting Credential Manager.');
                dbClient.close();
                process.exit();
        }
    };

    const servicesMenu = async () => {
        const answer = await inquirer.prompt({
            name: 'serviceMenuChoice',
            type: 'list',
            message: 'Services Menu:',
            choices: ['List Services', 'Add Service', 'Rename Service', 'Remove Service', 'Back'],
        });

        // Placeholder for actual implementation
        console.log(`You selected: ${answer.serviceMenuChoice}`);
        // Add implementation logic here
        
        if (answer.serviceMenuChoice === 'Back') {
            return mainMenu();
        }
    };

    const secretsMenu = async () => {
        // Similar structure to servicesMenu
        // Add implementation logic here
    };

    const projectsMenu = async () => {
        // Similar structure to servicesMenu
        // Add implementation logic here
    };

    await mainMenu();
};

startMenu();
