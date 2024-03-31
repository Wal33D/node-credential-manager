import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForNewServiceName = async ({
    readLineInterface
}: {
    readLineInterface?: readline.Interface
}): Promise<{ status: boolean; serviceName?: string; message: string; }> => {
    let readlineInterface: any = readLineInterface;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (interfaceCreationResult.status) {
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        } else {
            console.error(interfaceCreationResult.message);
            return { status: false, message: interfaceCreationResult.message };
        }
    }

    return new Promise((resolve) => {
        const question = 'Enter the name of the new service you want to add:\n';

        readlineInterface.question(question, (serviceName: string) => {
            if (serviceName.toLowerCase() === "exit") {
                console.log('Exiting to main menu...');
                resolve({ status: false, message: 'Exited to main menu.' });
            } else {
                resolve({ status: true, serviceName: serviceName, message: 'Service name received.' });
            }

            if (createdInternally) {
                readlineInterface.close();
            }
        });
    });
}
