import { Client } from "@elastic/elasticsearch";

class Elastic {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTIC_NODE,
      auth: {
        username: process.env.ELASTIC_USER,
        password: process.env.ELASTIC_PASSWORD,
      },
    });
  }

  async getById(index, id) {
    try {
      const result = await this.client.get({ index, id });
      if (result && result.statusCode) {
        // Get document data
        const data = result.body._source;
        // Add nested id
        data["id"] = result.body._id;
        return data;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

export default new Elastic();
