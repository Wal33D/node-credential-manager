import { versionTests } from './versionTests';
import { secretTests } from './secretTests';
import { projectTests } from './projectTests';
import { serviceTests } from './serviceTests';
import { TestResult, TestSuiteResults, AllTestResults } from './testsTypes';

export async function runAllTests(): Promise<AllTestResults> {
    let finalResults: any | Partial<AllTestResults> = {};
    let errorMessage: string | null = null;

    try {
        const suites = {
            versionTests: versionTests,
            projectTests: projectTests,
            serviceTests: serviceTests,
            secretTests: secretTests
        };

        for (const [key, testFunction]  of Object.entries(suites)) {
            finalResults[key] = await getTestSuiteResults(testFunction, key);
        }
    } catch (error: any) {
        console.error("An error occurred while running tests:", error);
        errorMessage = `Test Failure: ${error.message}`;
    }

    const completeResult = displayNumericTestResults(finalResults);
    return { ...finalResults, completeResult, error: errorMessage };
}

async function getTestSuiteResults(testFunction: () => Promise<TestResult[]>, suiteName: string): Promise<TestSuiteResults> {
    const results = await testFunction();
    const passCount = results.filter(result => result.passed).length;
    const failCount = results.length - passCount;

    return {
        detailedResults: results,
        simplifiedResults: JSON.stringify({ suiteName, results: { passed: passCount, failed: failCount } }),
        numericResults: { passed: passCount, failed: failCount }
    };
}

function displayNumericTestResults(testResults: Partial<AllTestResults|any>): string[] {
    return Object.entries(testResults).reduce((acc, [suiteName, suiteResult]) => {
        if (suiteResult && suiteResult.numericResults) {
            const { passed, failed } = suiteResult.numericResults;
            acc.push(`${suiteName}: Passed: ${passed}, Failed: ${failed}`);
        }
        return acc;
    }, [] as string[]).concat(testResults.error ? [`Error during tests: ${testResults.error}`] : []);
}
