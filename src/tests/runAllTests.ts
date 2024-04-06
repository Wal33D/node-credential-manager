import { versionTests } from './versionTests';
import { secretTests } from './secretTests';
import { projectTests } from './projectTests';
import { serviceTests } from './serviceTests';
import { TestResult, AllTestResults } from './testsTypes';

export async function runAllTests(simplified: boolean = false): Promise<AllTestResults> {
    let allTestResults: AllTestResults = {
        versionTests: [],
        projectTests: [],
        serviceTests: [],
        secretTests: [],
        error: null,
    } as any;

    try {
        //    console.log("\n=== Version Tests ===");
        const versionResults: TestResult[] = await versionTests();
        allTestResults.versionTests = versionResults;
        checkTestResults(versionResults, "Version Tests", simplified);

        //      console.log("\n=== Project Tests ===");
        const projectResults: TestResult[] = await projectTests();
        allTestResults.projectTests = projectResults;
        checkTestResults(projectResults, "Project Tests", simplified);

        //   console.log("\n=== Service Tests ===");
        const serviceResults: TestResult[] = await serviceTests();
        allTestResults.serviceTests = serviceResults;
        checkTestResults(serviceResults, "Service Tests", simplified);

        //   console.log("\n=== Secret Tests ===");
        const secretResults: TestResult[] = await secretTests();
        allTestResults.secretTests = secretResults;
        checkTestResults(secretResults, "Secret Tests", simplified);

    } catch (error: any) {
        console.error("An error occurred while running tests:", error);
        allTestResults.error = `Test Failure: ${error.message}`;
    }

    console.log("All tests completed.");
    return allTestResults;
}

function checkTestResults(results: TestResult[], suiteName: string, simplified: boolean): void {
    const passCount = results.filter(result => result.passed).length;
    const failCount = results.length - passCount;
    if (simplified) {
        //   console.log(`${suiteName}: ${failCount === 0 ? 'TRUE' : 'FALSE'} - Total: ${results.length}, Passed: ${passCount}, Failed: ${failCount}`);
    } else {
        results.forEach(result => {
            //       console.log(`${result.test}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.message}`);
        });
    }
    if (failCount > 0) {
        throw new Error(`${suiteName} had failures. Total: ${results.length}, Passed: ${passCount}, Failed: ${failCount}`);
    }
}
