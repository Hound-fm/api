import url from "url";
import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";

function processResults(results) {
  let maxScore = 0;
  let tracksMaxScore = 0;
  let topResult = null;
  let topTracks = [];
  let finalResults = {};

  for (let key in results) {
    const result = results[key];

    // Next
    if (!result) break;

    if (result.hits && result.hits.length) {
      finalResults[key] = result;
    }

    if (key === "music_recording") {
      if (result.total.value > 0) {
        topTracks = {};
        topTracks.total = result.total;
        if (result && result.hits && result.hits.length) {
          topTracks.hits = result.hits.slice(0, 4);
        }
        tracksMaxScore = result.max_score;
      }
    }

    if (key === "podcast_episode") {
      if (
        topTracks.length === 0 ||
        (tracksMaxScore < result.max_score && result.total.value > 0)
      ) {
        topTracks = {};
        topTracks.total = result.total;
        if (result && result.hits && result.hits.length) {
          topTracks.hits = result.hits.slice(0, 4);
        }
        delete finalResults.podcast_episode;
      } else {
        delete finalResults.music_recording;
      }
    }
    if (result.max_score > 0 && result.max_score > maxScore) {
      maxScore = result.max_score;
      topResult = result.hits[0];
    }
  }
  return {
    topResult,
    topTracks,
    results: finalResults,
  };
}

export default async function SearchRoute(req, res, next) {
  try {
    // const validation = validationResult(req).throw();
    // Return response
    const { q, type } = req.query;
    // Handle search query
    if (q && q.length) {
      if (type) {
        const results = await elastic.searchType(type, q);
        if (results) {
          res.json({ data: results });
        } else {
          next();
        }
      } else {
        const results = await elastic.autocomplete(q);
        res.json({ data: processResults(results) });
      }
    } else {
      // Handle empty search query
      next();
    }
  } catch (err) {
    console.error(err);
    const error = new ValidationError(err, 404);
    next(error);
  }
}
