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
        } else {
            // This else block is theoretically unnecessary due to how createInterface works,
            // but is included for completeness according to the guidelines.
            throw new Error('Failed to create readline interface.');
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, interfaceInstance, message };
};
