import readline from 'readline';

export const createReadlineInterface = (): { status: boolean; interfaceInstance: readline.Interface | null; message: string } => {
    let interfaceInstance = null;
    let message = '';
    let status = false;

    try {
        interfaceInstance = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        if (interfaceInstance) {
            status = true;
            message = 'Readline interface created successfully.';
        } 
    } catch (error: any) {
        status = false;
        message = `Error: ${error.message}`;
    }

    return { status, interfaceInstance, message };
};
