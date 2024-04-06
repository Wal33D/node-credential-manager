import readline from "readline";

class ReadlineManager {
    rl: readline.Interface;
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    askQuestion(query:any) {
        return new Promise((resolve) => {
            this.rl.question(query, (answer:any) => {
                resolve(answer);
            });
        });
    }

    close() {
        this.rl.close();
    }
}

export default new ReadlineManager();
