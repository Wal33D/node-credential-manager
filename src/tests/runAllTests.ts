import { versionTests } from './versionTests';
import { secretTests } from './secretTests';
import { projectTests } from './projectTests';
import { serviceTests } from './serviceTests';
import { TestResult, AllTestResults, TestSuiteResults } from './testsTypes';

export async function runAllTests(): Promise<AllTestResults> {
    let finalResults: Partial<AllTestResults> = {};
    let errorMessage: string | null = null; 
let completeResult;
    try {
        finalResults.versionTests = await getTestSuiteResults(versionTests, "Version Tests");
        finalResults.projectTests = await getTestSuiteResults(projectTests, "Project Tests");
        finalResults.serviceTests = await getTestSuiteResults(serviceTests, "Service Tests");
        finalResults.secretTests = await getTestSuiteResults(secretTests, "Secret Tests");
        completeResult =  displayNumericTestResults(finalResults) as any;
    } catch (error: any) {
        console.error("An error occurred while running tests:", error);
        errorMessage = `Test Failure: ${error.message}`; 
    }

    return { ...finalResults, completeResult, error: errorMessage } as any;
}

async function getTestSuiteResults(testFunction: () => Promise<TestResult[]>, suiteName: string): Promise<TestSuiteResults> {
    const results = await testFunction();
    const passCount = results.filter(result => result.passed).length;
    const failCount = results.length - passCount;

    const detailedResults = results;
    const simplifiedResults = JSON.stringify({ suiteName, results: { passed: passCount, failed: failCount } });
    const numericResults = { passed: passCount, failed: failCount };

    return { detailedResults, simplifiedResults, numericResults };
}

// Function to display numeric test results
function displayNumericTestResults(testResults:any) {
    const suites = ['versionTests', 'projectTests', 'serviceTests', 'secretTests'];
    suites.forEach(suiteName => {
        const suiteResult = testResults[suiteName];
        if (suiteResult && suiteResult.numericResults) {
            const { passed, failed } = suiteResult.numericResults;
            console.log(`${suiteName}: Passed: ${passed}, Failed: ${failed}`);
        }
    });
    if (testResults.error) {
        console.log('Error during tests:', testResults.error);
    }
}
