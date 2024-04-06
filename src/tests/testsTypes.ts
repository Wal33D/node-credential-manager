export interface TestResult {
    test: string;
    passed: boolean;
    message: string;
}

export interface TestSuiteResults {
    detailedResults: TestResult[];
    simplifiedResults: string; 
    numericResults: {
        passed: number;
        failed: number;
    };
}

export interface AllTestResults {
    versionTests?: TestSuiteResults;
    projectTests?: TestSuiteResults;
    serviceTests?: TestSuiteResults;
    secretTests?: TestSuiteResults;
    completeResult: string[]; 
    error: string | null;
}
