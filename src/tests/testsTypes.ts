export interface TestResult {
    test: string;
    passed: boolean;
    message: string;
}

export interface AllTestResults {
    versionTests: TestResult[];
    projectTests: TestResult[];
    serviceTests: TestResult[];
    secretTests: TestResult[];
    error: string | null; 
}