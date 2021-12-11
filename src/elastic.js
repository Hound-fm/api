import { Client } from "@elastic/elasticsearch";
import { POPULAR_SCORE } from "./scores.js";

const AUTOCOMPLETE_CATEGORIES = [
  "artist",
  "music_recording",
  "podcast_series",
  "podcast_episode",
];

const SEARCH_INDICES = [...AUTOCOMPLETE_CATEGORIES, "genre"];

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

const AUTOCOMPLETE_FILTER_PATH = [
  "-**_shards",
  "-**_index",
  "-responses.**._shards",
  "-responses.hits.**._index",
  "-responses.hits.**._type",
  "-responses.hits.**.took",
  "-responses.hits.**.score",
];

const EXPLORE_FILTER_PATH = [
  "-**_shards",
  "-**_index",
  "-responses._shards",
  "-responses.hits.**._index",
  "-responses.hits.**._type",
  "-responses.hits.**.took",
  "-responses.hits.**.score",
  "-responses.hits.**.sort",
];

const EXPLORE_SORTED_FILTER_PATH = [
  "-**_shards",
  "-**_index",
  "-hits.**._index",
  "-hits.**._type",
  "-hits.**.took",
  "-hits.**.score",
  "-hits.**.sort",
];

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

const SUBGENRES = {
  jazz: ["free jazz", "contemporary jazz", "swing"],
  pop: ["pop rock", "futurepop"],
  reagge: ["reggae", "dub"],
  edm: [
    "dubstep",
    "future bass, hardstyle",
    "rave",
    "club",
    "dance",
    "garage",
    "jungle",
  ],
  ebm: ["futurepop"],
  electronic: [
    "synthwave",
    "vaporwave",
    "drum and bass",
    "downtempo",
    "ebm",
    "idm",
    "futurepop",
    "gabber",
    "hardcore",
    "breakbeat",
    "breaks",
    "chiptune",
  ],
  experimental: ["progressive"],
  progressive: ["experimental"],
  instrumental: ["klezmer"],
  dance: ["garage", "jungle"],
  hardcore: ["gabber"],
  gabber: ["hardcore"],
  trance: ["vocal trance", "melodic trance", "psytrance"],
  rock: ["post-rock", "hard rock", "pop rock", "funk rock", "gothic"],
  metal: ["heavy metal", "black metal"],
  techno: ["minimal techno", "acid techno"],
  house: ["deep house", "tech house", "garage"],
  soul: ["funk soul"],
  funk: ["funk rock", "funk soul"],
  "heavy metal": ["black metal"],
  "hip hop": ["horrorcore"],
};


// Merge complex subgenres
SUBGENRES.edm = [...SUBGENRES.edm, ...SUBGENRES.trance]
SUBGENRES.electronic = [...SUBGENRES.electronic, ...SUBGENRES.trance]

// Sort by ids order
function getResolveSortOrder(ids) {
  const params = {};

  // Override sort order score
  ids.forEach((id, index) => {
    params[id] = index;
  });

  const sort = {
    _script: {
      type: "number",
      script: {
        params,
        lang: "painless",
        source: "params.get(doc._id.value);",
      },
      order: "asc",
    },
  };

  return sort;
}

function getExploreQuery(stream_type, sortBy, genre, channel_id, size) {
  const filter = [];
  const elasticQuery = {};
  const defaultQuery = { match_all: {} };

  // Filter by streamType
  if (stream_type) {
    filter.push({
      term: { stream_type },
    });
  }

  if (genre) {
    // Filter by genre

    if (SUBGENRES[genre]) {
      filter.push({
        terms: { genres: [genre, ...SUBGENRES[genre]] },
      });
    } else {
      filter.push({
        term: { genres: genre },
      });
    }
  }

  if (channel_id) {
    // Filter by channel_id
    filter.push({
      term: { channel_id },
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

  async explore({ stream_type, sortBy, genre, channel_id, size = 100 }) {
    let query = {};

    if (sortBy) {
      // Single query
      let mainQuery = getExploreQuery(stream_type, sortBy, genre, channel_id);

      if (channel_id) {
        query = [];
        query.push({ index: "stream" });
        query.push({ size, ...mainQuery });
        query.push({ index: "channel" });
        query.push({ query: { ids: { values: [channel_id] } } });

        const { body } = await this.client.msearch({
          body: query,
          filter_path: EXPLORE_FILTER_PATH,
        });
        return body;
      }

      // Run query
      const { body } = await this.client.search({
        size: size,
        index: "stream",
        body: mainQuery,
        filter_path: EXPLORE_SORTED_FILTER_PATH,
      });

      return body;
    } else {
      // Multi query
      query = [];
      query.push({ index: "stream" });
      query.push({
        size,
        ...getExploreQuery(stream_type, "latest", genre, channel_id),
      });
      query.push({ index: "stream" });
      query.push({
        size,
        ...getExploreQuery(stream_type, "popular", genre, channel_id),
      });
      // Channel data
      if (channel_id) {
        query.push({ index: "channel" });
        query.push({ query: { ids: { values: [channel_id] } } });
      }

      const { body } = await this.client.msearch({
        body: query,
        filter_path: EXPLORE_FILTER_PATH,
      });
      return body;
    }
  }

  async searchType(category, query) {
    let categoryQuery;
    let elasticQuery;

    // Multisearch query
    if (category === "genre") {
      categoryQuery = AUTOCOMPLETE_GENRE_QUERY;
      categoryQuery["multi_match"]["query"] = query;
      elasticQuery = categoryQuery;
    } else {
      const categoryTerm = CATEGORY_MAPPINGS[category]
        ? CATEGORY_MAPPINGS[category].term
        : null;
      if (!categoryTerm) {
        return false;
      }
      categoryQuery = AUTOCOMPLETE_STREAM_QUERY;
      categoryQuery["multi_match"]["query"] = query;
      // Filter by category
      const filter = { term: {} };
      filter.term[categoryTerm] = category;
      // Full query
      elasticQuery = {
        bool: {
          filter,
          must: {
            multi_match: categoryQuery["multi_match"],
          },
        },
      };
    }
    const { body } = await this.client.search({
      size: 500,
      index: CATEGORY_MAPPINGS[category].index,
      body: { query: elasticQuery },
    });
    return body;
  }

  async autocomplete(query, size = 8, fuzziness = 2) {
    const search_queries = [];

    AUTOCOMPLETE_CATEGORIES.forEach((category, i) => {
      let autocompleteQuery = AUTOCOMPLETE_STREAM_QUERY;
      if (category == "artist" || category == "podcast_series") {
        autocompleteQuery = AUTOCOMPLETE_CHANNEL_QUERY;
      }
      autocompleteQuery["multi_match"]["query"] = query;

      const elasticQuery = {
        bool: {
          must: {
            multi_match: autocompleteQuery["multi_match"],
          },
        },
      };

      // Filter by category
      if (category !== "genre") {
        const filter = { term: {} };
        const categoryTerm = CATEGORY_MAPPINGS[category].term;
        filter.term[categoryTerm] = category;
        elasticQuery["bool"]["filter"] = filter;
      }

      search_queries.push({ index: CATEGORY_MAPPINGS[category].index });
      search_queries.push({ size, query: elasticQuery });
    });

    const genreQuery = AUTOCOMPLETE_GENRE_QUERY;
    genreQuery["multi_match"]["query"] = query;
    search_queries.push({ index: "genre" });
    search_queries.push({ size, query: genreQuery });

    const results = {};
    const { body } = await this.client.msearch({
      body: search_queries,
      filter_path: AUTOCOMPLETE_FILTER_PATH,
    });

    body.responses.forEach((response, i) => {
      const category = SEARCH_INDICES[i];
      results[category] = response.hits;
    });

    return results;
  }

  async resolve(resolveData) {
    try {
      const queries = [];
      const results = {};
      const entries = Object.entries(resolveData);

      entries.forEach(([key, ids]) => {
        const filter = [];
        const filterId = { terms: { _id: ids } };
        const filterType = { term: {} };
        filterType.term[CATEGORY_MAPPINGS[key].term] = key;
        filter.push(filterId);
        filter.push(filterType);
        queries.push({ index: CATEGORY_MAPPINGS[key].index });
        queries.push({
          query: { bool: { filter } },
          sort: getResolveSortOrder(ids),
        });
      });

      const { body } = await this.client.msearch({
        body: queries,
        filter_path: AUTOCOMPLETE_FILTER_PATH,
      });

      body.responses.forEach((response, i) => {
        const category = entries[i][0];
        if (category) {
          results[category] = response.hits;
        }
      });

      return results;
    } catch (error) {
      console.info(error);
      return false;
    }
  }
}

export default new Elastic();
