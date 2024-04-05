import { versionTests } from './versionTests';
import { secretTests } from './secretTests';
import { projectTests } from './projectTests';

interface TestResult {
    test: string;
    passed: boolean;
    message: string;
}

async function runAllTests(): Promise<void> {
    console.log("Starting all tests...");

    try {
        console.log("\n=== Version Tests ===");
    //    const versionResults: TestResult[] = await versionTests();
    //    checkTestResults(versionResults, "Version Tests");

        console.log("\n=== Project Tests ===");
        const projectResults: TestResult[] = await projectTests();
        checkTestResults(projectResults, "Project Tests");

        console.log("\n=== Secret Tests ===");
     //   const secretResults: TestResult[] = await secretTests();
     //   checkTestResults(secretResults, "Secret Tests");

    } catch (error: any) {
        console.error("An error occurred while running tests:", error);
        throw new Error(`Test Failure: ${error.message}`);
    }

    console.log("All tests completed.");
}

function checkTestResults(results: TestResult[], suiteName: string): void {
    const failedTests = results.filter(result => !result.passed);

    if (failedTests.length > 0) {
        const failedTestMessages = failedTests.map(test => `${test.test}: ${test.message}`).join(', ');
        throw new Error(`Failed tests in ${suiteName}: ${failedTestMessages}`);
    } else {
        results.forEach(result => {
            console.log(`${result.test}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.message}`);
        });
    }
}

runAllTests();
