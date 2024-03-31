import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';
import { ReadlineInterfaceResult } from '../types';

interface NewServiceNameResult {
    status: boolean;
    serviceName?: string;
    message: string;
}
interface PromptForNewServiceNameParams {
    readLineInterface?: readline.Interface;
}

export const promptForNewServiceName = async ({
}: PromptForNewServiceNameParams): Promise<NewServiceNameResult> => {
    let readlineInterface: readline.Interface |any;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult: ReadlineInterfaceResult = createReadlineInterface();
        if (interfaceCreationResult.status && interfaceCreationResult.interfaceInstance) {
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        } else {
            console.error(interfaceCreationResult.message);
            return { status: false, message: interfaceCreationResult.message };
        }
    }

    const askQuestion = async (): Promise<NewServiceNameResult> => {
        return new Promise((resolve) => {
            const question = 'Enter the name of the new service you want to add (no spaces, type "exit" to quit):\n';
            readlineInterface.question(question, (serviceName: string) => {
                if (serviceName.toLowerCase() === "exit") {
                    console.log('Exiting to main menu...');
                    resolve({ status: false, message: 'Exited to main menu.' });
                } else if (serviceName.includes(' ')) {
                    console.log('Service name should not contain spaces. Please try again.');
                    resolve(askQuestion()); // Recursively ask the question again
                } else {
                    resolve({ status: true, serviceName: serviceName, message: 'Service name received.' });
                }
            });
        });
    };

    const result = await askQuestion();

    if (createdInternally && readlineInterface) {
        readlineInterface.close();
    }

    return result;
};
