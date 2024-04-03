import { Db, ObjectId } from 'mongodb';

export class ServiceManager {
  private dbConnection: Db;
  private cabinetName: string;

  constructor(dbConnection: Db, cabinetName: string) {
    this.dbConnection = dbConnection;
    this.cabinetName = cabinetName;
  }

  // Add a new credential to the cabinet
  public async addCredential(name: string, value: any): Promise<{ status: boolean; message: string; credentialId?: string }> {
    try {
      const result = await this.dbConnection.collection(this.cabinetName).insertOne({ name, value });
      return {
        status: true,
        message: "Credential added successfully.",
        credentialId: result.insertedId.toString(),
      };
    } catch (error:any) {
      return { status: false, message: `Failed to add credential: ${error.message}` };
    }
  }

  // Update an existing credential in the cabinet
  public async updateCredential(credentialId: string, value: any): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.dbConnection.collection(this.cabinetName).updateOne(
        { _id: new ObjectId(credentialId) },
        { $set: { value } }
      );

      if (result.modifiedCount === 0) {
        return { status: false, message: "No credential found with the provided ID or no changes made." };
      }

      return { status: true, message: "Credential updated successfully." };
    } catch (error:any) {
      return { status: false, message: `Failed to update credential: ${error.message}` };
    }
  }

  // Delete a credential from the cabinet
  public async deleteCredential(credentialId: string): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.dbConnection.collection(this.cabinetName).deleteOne({ _id: new ObjectId(credentialId) });

      if (result.deletedCount === 0) {
        return { status: false, message: "No credential found with the provided ID." };
      }

      return { status: true, message: "Credential deleted successfully." };
    } catch (error:any) {
      return { status: false, message: `Failed to delete credential: ${error.message}` };
    }
  }

  // Optionally, list all credentials in the cabinet
  public async listCredentials(): Promise<{ status: boolean; message: string; credentials?: any[] }> {
    try {
      const credentials = await this.dbConnection.collection(this.cabinetName).find({}).toArray();
      return {
        status: true,
        message: "Credentials retrieved successfully.",
        credentials,
      };
    } catch (error:any) {
      return { status: false, message: `Failed to list credentials: ${error.message}` };
    }
  }
}