import { versionTests } from './versionTests';
import { secretTests } from './secretTests';

interface TestResult {
    test: string;
    passed: boolean;
    message: string;
}

async function runAllTests(): Promise<void> {
    console.log("Starting all tests...");

    try {
        console.log("\n=== Version Tests ===");
        const versionResults: TestResult[] = await versionTests();
        logTestResults(versionResults);

        console.log("\n=== Secret Tests ===");
        const secretResults: TestResult[] = await secretTests();
        logTestResults(secretResults);
    } catch (error) {
        console.error("An error occurred while running tests:", error);
    }

    console.log("All tests completed.");
}

function logTestResults(results: TestResult[]): void {
    results.forEach(result => {
        console.log(`${result.test}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.message}`);
    });
}

runAllTests();
