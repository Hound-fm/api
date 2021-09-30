import { Client } from "@elastic/elasticsearch";

const AUTOCOMPLETE_INDICES = [
  "artist",
  "music_recording",
  "podcast_episode",
  "podcast_series",
];

const SEARCH_INDICES = [...AUTOCOMPLETE_INDICES, "genre"];

const AUTOCOMPLETE_STREAM_QUERY = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 3,
    operator: "or",
    fields: [
      "title^1.50",
      "title._2gram^0.5",
      "title._3gram^0.75",
      "title._index_prefix^0.25",
      "name^0.25",
      "channel_title^0.5",
      "genres^0.25",
      "genres._2gram^0.15",
      "genres._3gram^0.10",
    ],
  },
};

const AUTOCOMPLETE_CHANNEL_QUERY = {
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
      "genres^0.25",
      "genres._2gram^0.15",
      "genres._3gram^0.10",
    ],
  },
};

const AUTOCOMPLETE_GENRE_QUERY = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 2,
    operator: "or",
    fields: [
      "label^1.50",
      "label._2gram^0.5",
      "label._3gram^0.75",
      "label._index_prefix^0.25",
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

  async autocomplete(query, size = 5, fuzziness = 2) {
    const search_queries = [];

    AUTOCOMPLETE_INDICES.forEach((index, i) => {
      let autocompleteQuery = AUTOCOMPLETE_STREAM_QUERY;
      if (index == "artist" || index == "podcast_series") {
        autocompleteQuery = AUTOCOMPLETE_CHANNEL_QUERY;
      }
      autocompleteQuery["multi_match"]["query"] = query;
      search_queries.push({ index: `${index}_autocomplete` });
      search_queries.push({ size, query: autocompleteQuery });
    });

    const genreQuery = AUTOCOMPLETE_GENRE_QUERY;
    genreQuery["multi_match"]["query"] = query;
    search_queries.push({ index: "genre" });
    search_queries.push({ size, query: genreQuery });

    const results = {};
    const { body } = await this.client.msearch({ body: search_queries });

    body.responses.forEach((response, i) => {
      const category = SEARCH_INDICES[i];
      results[category] = response.hits;
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
