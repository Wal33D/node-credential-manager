import ReadlineManager from "./ReadlineManager";

export const initializeGlobals = async () => {
    let projectName = '';
    while (!projectName) {
        projectName = (await ReadlineManager.askQuestion('Enter project name (or type "exit" to quit): ')as string).trim();
        if (projectName.toLowerCase() === 'exit') return null;
        if (!projectName) console.log('Project name cannot be empty. Please enter a valid name.');
    }

    let serviceName = '';
    while (!serviceName) {
        serviceName = (await ReadlineManager.askQuestion('Enter service name (or type "exit" to quit): ')as string).trim();
        if (serviceName.toLowerCase() === 'exit') return null;
        if (!serviceName) console.log('Service name cannot be empty. Please enter a valid name.');
    }

    let secretName = '';
    while (!secretName) {
        secretName = (await ReadlineManager.askQuestion('Enter secret name (or type "exit" to quit): ')as string).trim();
        if (secretName.toLowerCase() === 'exit') return null;
        if (!secretName) console.log('Secret name cannot be empty. Please enter a valid name.');
    }

    let decryptedSelection;
    let decryptChoice;
    do {
        decryptChoice = (await ReadlineManager.askQuestion('Do you want the versions decrypted? (yes/no): ')).trim().toLowerCase();
        if (decryptChoice === 'exit') return null;
        if (decryptChoice !== 'yes' && decryptChoice !== 'no') {
            console.log('Invalid input. Please answer "yes" or "no" or type "exit" to quit.');
        }
    } while (decryptChoice !== 'yes' && decryptChoice !== 'no');
    decryptedSelection = decryptChoice === 'yes';

    return { projectName, serviceName, secretName, decryptedSelection };
};
