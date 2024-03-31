export const promptMenu = async ({ readLineInterface }: { readLineInterface: any }): Promise<{ status: boolean; choice: string; message: string; }> => {
    let status = false;
    let choice = '';
    let message = 'Failed to receive input';

    try {
        choice = await new Promise((resolve) => {
            readLineInterface.question(
                'What would you like to do next?\n' +
                ' 1. Add a new credential\n' +
                ' 2. Update an existing credential\n' +
                ' 3. View all credentials\n' + // Updated the text here to match your provided actions
                ' 4. Search for a specific key\n' +
                ' 5. Search by service name\n' + // Updated for clarity based on your provided actions
                ' 6. Initialize DB with default structure\n' + // New option added
                ' 7. Exit\n'+
                'Please enter your choice (1-7):\n',
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
