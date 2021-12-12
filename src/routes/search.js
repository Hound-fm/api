import url from "url";
import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";

function processResults(results) {
  let maxScore = 0;
  let tracksMaxScore = 0;
  let topResult = null;
  let topTracks = null;
  let finalResults = {};

  for (let key in results) {
    const result = results[key];

    // Next
    if (!result) {
      continue;
    }

    if (result.hits && result.hits.length) {
      finalResults[key] = result;
    }

    if (result.max_score > 0 && result.max_score > maxScore) {
      maxScore = result.max_score;
      topResult = result.hits[0];
    }
  }

  if (
    finalResults.music_recording &&
    finalResults.music_recording.total.value > 0
  ) {
    topTracks = {};
    topTracks.total = finalResults.music_recording.total;
    topTracks.hits = finalResults.music_recording.hits.slice(0, 4);
    tracksMaxScore = finalResults.music_recording.max_score;
  }

  if (
    finalResults.podcast_episode &&
    finalResults.podcast_episode.total.value > 0
  ) {
    if (!topTracks || tracksMaxScore < finalResults.podcast_episode) {
      topTracks = {};
      topTracks.total = finalResults.podcast_episode.total;
      topTracks.hits = finalResults.podcast_episode.hits.slice(0, 4);

      delete finalResults.podcast_episode;
    } else {
      delete finalResults.music_recording;
    }
  }

  if (topResult) {
    const { stream_type, channel_type, category_type } = topResult._source;
    const result_type =
      stream_type || channel_type || (category_type ? "genre" : "");
    // Remove single duplicate entry from results.
    if (
      finalResults[result_type] &&
      finalResults[result_type].hits.length === 1
    ) {
      delete finalResults[result_type];
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
