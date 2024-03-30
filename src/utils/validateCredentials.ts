export const validateCredentials = ({ credentials }: { credentials: any }): { status: boolean; result: any; message: string; } => {
    let status = false;
    let result = null;
    let message = '';

    try {
        // Simulate validating credentials
        if (credentials) { // Simple validation logic
            status = true;
            result = { isValid: true };
            message = 'Credentials are valid';
        } else {
            throw new Error('Credentials are invalid');
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, result, message };
};
