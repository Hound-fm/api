import { Client } from "@elastic/elasticsearch";
import { POPULAR_SCORE } from "./scores.js";
const AUTOCOMPLETE_INDICES = [
  "artist",
  "music_recording",
  "podcast_series",
  "podcast_episode",
];

const SEARCH_INDICES = [...AUTOCOMPLETE_INDICES, "genre"];

const AUTOCOMPLETE_STREAM_QUERY = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 3,
    operator: "or",
    fields: [
      "title^1.25",
      "title._2gram^0.54",
      "title._3gram^0.25",
      "name^0.25",
      "channel_title^0.1",
      "genres^0.1",
    ],
  },
};

const AUTOCOMPLETE_CHANNEL_QUERY = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 3,
    operator: "or",
    fields: [
      "channel_title^1.75",
      "channel_title._2gram^0.80",
      "channel_title._3gram^0.75",
      "channel_name^0.5",
      "genres^0.1",
    ],
  },
};

const AUTOCOMPLETE_GENRE_QUERY = {
  multi_match: {
    query: "",
    type: "bool_prefix",
    fuzziness: 2,
    operator: "or",
    fields: ["label^2", "label._2gram^0.8", "label._3gram^0.75"],
  },
};

const CATEGORY_MAPPINGS = {
  genre: { term: "genre", index: "genre" },
  artist: { term: "channel_type", index: "channel" },
  podcast_series: { term: "channel_type", index: "channel" },
  podcast_episode: { term: "stream_type", index: "stream" },
  music_recording: { term: "stream_type", index: "stream" },
};

function getExploreQuery(streamType, sortBy, genre, size) {
  const filter = [];
  const elasticQuery = {};
  const defaultQuery = { match_all: {} };

  // Filter by streamType
  if (streamType) {
    filter.push({
      term: { stream_type: streamType },
    });
  }

  if (genre) {
    // Filter by genre
    filter.push({
      term: { genres: genre },
    });
  }

  if (sortBy) {
    if (sortBy == "latest") {
      elasticQuery.sort = [{ release_date: { order: "desc" } }];
      elasticQuery.query = defaultQuery;
      if (filter.length > 0) {
        elasticQuery.query = { bool: { filter } };
      }
    }
    if (sortBy == "popular") {
      elasticQuery.query = {
        function_score: {
          score_mode: "sum",
          boost_mode: "sum",
        },
      };

      elasticQuery.query.function_score.functions = POPULAR_SCORE;
      elasticQuery.query.function_score.query = defaultQuery;
      if (filter.length > 0) {
        elasticQuery.query.function_score.query = { bool: { filter } };
      }
    }
  }

  return elasticQuery;
}

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

  async explore(streamType, sortBy, genre, size = 25) {
    let query = {};

    if (sortBy) {
      // Single query
      query = getExploreQuery(streamType, sortBy, genre);
      // Run query
      const { body } = await this.client.search({
        size: size,
        index: "stream",
        body: query,
      });

      return body;
    } else {
      // Multi query
      query = [];
      query.push({ index: "stream" });
      query.push({
        size: 25,
        ...getExploreQuery(streamType, "latest", genre),
      });
      query.push({ index: "stream" });
      query.push({
        size: 25,
        ...getExploreQuery(streamType, "popular", genre),
      });

      const { body } = await this.client.msearch({ body: query });
      return body;
    }
  }

  async searchType(category, query) {
    // Multisearch query
    const categoryTerm = CATEGORY_MAPPINGS[category]
      ? CATEGORY_MAPPINGS[category].term
      : null;
    if (!categoryTerm) {
      return false;
    }
    const categoryQuery = AUTOCOMPLETE_STREAM_QUERY;
    categoryQuery["multi_match"]["query"] = query;
    // Filter by category
    const filter = { term: {} };
    filter.term[categoryTerm] = category;
    // Full query
    const elasticQuery = {
      bool: {
        filter,
        must: {
          multi_match: categoryQuery["multi_match"],
        },
      },
    };
    const { body } = await this.client.search({
      size: 500,
      index: CATEGORY_MAPPINGS[category].index,
      body: { query: elasticQuery },
    });
    return body;
  }

  async autocomplete(query, size = 8, fuzziness = 2) {
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
