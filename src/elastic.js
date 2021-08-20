import { Client } from "@elastic/elasticsearch";

const AutocompleteIndices = [
  "artist",
  "music_recording",
  "podcast_episode",
  "podcast_series",
];

const AutocompleteStreamQuery = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 2,
    operator: "or",
    fields: [
      "title^1.50",
      "title._2gram^0.5",
      "title._3gram^0.75",
      "title._index_prefix^0.25",
      "name^0.25",
      "channel_title^0.5",
      "genres^1.25",
      "genres._2gram^1.15",
      "genres._3gram^1.10",
    ],
  },
};

const AutocompleteChannelQuery = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 2,
    operator: "or",
    fields: [
      "channel_title^1.50",
      "channel_title._2gram^0.5",
      "channel_title._3gram^0.75",
      "channel_title._index_prefix^0.25",
      "channel_name^0.5",
      "genres^1.25",
      "genres._2gram^1.15",
      "genres._3gram^1.10",
    ],
  },
};

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

  async search(index, query, size = 5) {
    const { body } = await this.client.search({ index, body: { size, query } });
    return body;
  }

  async autocomplete(query, size = 5, fuzziness = 0.25) {
    const search_queries = [];

    AutocompleteIndices.forEach((index, i) => {
      let autocompleteQuery = AutocompleteStreamQuery;
      if (index == "artist" || index == "podcast_series") {
        autocompleteQuery = AutocompleteChannelQuery;
      }
      autocompleteQuery["multi_match"]["query"] = query;
      search_queries.push({ index: `${index}_autocomplete` });
      search_queries.push({ size, query: autocompleteQuery });
    });

    const results = {};
    const { body } = await this.client.msearch({ body: search_queries });
    body.responses.forEach((response, i) => {
      results[AutocompleteIndices[i]] = response.hits;
    });

    return results;
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
