import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import { runAllTests } from "./tests/runAllTests";



import inquirer from 'inquirer';
import { services, secrets, projects } from './database';

type MainMenuOptions = 'Services' | 'Secrets' | 'Projects' | 'Exit';
type ServiceMenuOptions = 'List Services' | 'Add Service' | 'Rename Service' | 'Remove Service' | 'Back';
type SecretMenuOptions = 'List Secrets' | 'Add Secret' | 'Rename Secret' | 'Remove Secret' | 'Back';
type ProjectMenuOptions = 'List Projects' | 'Create Project' | 'Delete Project' | 'Copy Project' | 'Back';

const mainMenu = async () => {
    const answer = await inquirer.prompt({
        name: 'mainMenuChoice',
        type: 'list',
        message: 'Welcome to Credential Manager. Select an option:',
        choices: ['Services', 'Secrets', 'Projects', 'Exit'],
    });

    switch (answer.mainMenuChoice) {
        case 'Services':
            return servicesMenu();
        case 'Secrets':
            return secretsMenu();
        case 'Projects':
            return projectsMenu();
        case 'Exit':
            console.log('Exiting Credential Manager.');
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

    switch (answer.serviceMenuChoice) {
        case 'List Services':
            // Implement your function to list services
            console.log('Listing services...');
            break;
        case 'Add Service':
            // Implement your function to add a service
            console.log('Adding a new service...');
            break;
        case 'Rename Service':
            // Implement your function to rename a service
            console.log('Renaming a service...');
            break;
        case 'Remove Service':
            // Implement your function to remove a service
            console.log('Removing a service...');
            break;
        case 'Back':
            return mainMenu();
    }
};

const secretsMenu = async () => {
};

const projectsMenu = async () => {
};

runAllTests();
checkAndGenerateEncryptionKey();
mainMenu();
