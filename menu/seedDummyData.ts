import { MongoClient } from "mongodb";

export async function seedDummyData(dbClient: MongoClient) {
    // Dummy data definitions
    const projectNames = ["DemoProject1", "DemoProject2"];
    const serviceNames = ["DemoService1", "DemoService2"];
    const secretNames = ["DemoSecret1", "DemoSecret2"];
    const versionData = [
        { versionName: "v1.0", value: "DemoValue1.0" },
        { versionName: "v1.1", value: "DemoValue1.1" }
    ];

    // Insert dummy data
    for (let projectName of projectNames) {
        for (let serviceName of serviceNames) {
            // Ensure the project and service exist
            await projects.create({ dbClient, projectName, serviceName });

            for (let secretName of secretNames) {
                // Add each secret with its initial version
                await secrets.add({
                    dbClient,
                    projectName,
                    serviceName,
                    secretName,
                    envName: "DEMO_ENV",
                    envType: "test",
                    versions: [versionData[0]] // Initialize with the first version
                });

                // Add subsequent versions for each secret
                for (let i = 1; i < versionData.length; i++) {
                    let { versionName, value } = versionData[i];
                    await versions.add({
                        dbClient,
                        projectName,
                        serviceName,
                        secretName,
                        versionName,
                        value
                    });
                }
            }
        }
    }

    console.log("Dummy data insertion complete.");
}
