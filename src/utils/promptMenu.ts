export const promptMenu = async ({ rl }: { rl: any }): Promise<{ status: boolean; choice: string; message: string; }> => {
    let status = false;
    let choice = '';
    let message = 'Failed to receive input';

    try {
        choice = await new Promise((resolve) => {
            rl.question(
                'What would you like to do next?\n' +
                '1. Add a new credential\n' +
                '2. Update an existing credential\n' +
                '3. Delete a credential\n' +
                '4. Search for a specific key\n' +
                '5. Search by service name and key\n' +
                '6. Exit\nPlease enter your choice (1-6): ',
                (answer: any) => {
                    resolve(answer); 
                }
            );
        });
        status = true;
        message = 'Input received successfully';
    } catch (error: any) {
        status = false;
        message = `Error: ${error.message}`;
    }

    return { status, choice, message };
};