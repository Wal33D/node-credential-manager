import { versionTests } from './versionTests';
import { secretTests } from './secretTests';
import { projectTests } from './projectTests';

interface TestResult {
    test: string;
    passed: boolean;
    message: string;
}

export async function runAllTests(simplified: boolean = true): Promise<void> {
    console.log("Starting all tests...");

    try {
        console.log("\n=== Version Tests ===");
        const versionResults: TestResult[] = await versionTests();
        checkTestResults(versionResults, "Version Tests", simplified);

        console.log("\n=== Secret Tests ===");
        const secretResults: TestResult[] = await secretTests();
        checkTestResults(secretResults, "Secret Tests", simplified);

        console.log("\n=== Project Tests ===");
        const projectResults: TestResult[] = await projectTests();
        checkTestResults(projectResults, "Project Tests", simplified);

    } catch (error:any) {
        console.error("An error occurred while running tests:", error);
        throw new Error(`Test Failure: ${error.message}`);
    }

    console.log("All tests completed.");
}

function checkTestResults(results: TestResult[], suiteName: string, simplified: boolean): void {
    const passCount = results.filter(result => result.passed).length;
    const failCount = results.length - passCount;
    if (simplified) {
        console.log(`${suiteName}: ${failCount === 0 ? 'TRUE' : 'FALSE'} - Total: ${results.length}, Passed: ${passCount}, Failed: ${failCount}`);
    } else {
        results.forEach(result => {
            console.log(`${result.test}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.message}`);
        });
    }
    if (failCount > 0) {
        throw new Error(`${suiteName} had failures. Total: ${results.length}, Passed: ${passCount}, Failed: ${failCount}`);
    }
}
