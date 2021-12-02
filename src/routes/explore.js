import url from "url";
import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";

export default async function ExploreRoute(req, res, next) {
  try {
    // const validation = validationResult(req).throw();
    let channel;
    let dataBody = {}
    // Return response
    const { type, sortBy, genre, size, channel_id } = req.query;
    // Handle search query
    if (type || sortBy || genre || channel_id) {
      const results = await elastic.explore({
        size,
        genre,
        sortBy,
        channel_id,
        stream_type: type,
      });

      let data = results.responses || results.hits;

      if (results.hits && sortBy) {
        dataBody = results.hits
      }

      else if (results && results.responses) {

        if (results.responses.length === 2 && sortBy && channel_id) {
          const channelData = results.responses[1].hits.hits;
          if (channelData) {
            channel = channelData[0]._source;
            channel.id = channelData[0]._id;
            data = data[0].hits;
          }
        }

        if (results.responses.length === 3) {
          const channelData = results.responses[2].hits.hits;
          if (channelData) {
            channel = channelData[0]._source;
            channel.id = channelData[0]._id;
            data.pop();
          }
        }

        if (channel) {
          dataBody.channel = channel
        }

        if (data && data.length) {
          data = data.map((response) => response.hits);

          dataBody.latest = data[0]
          dataBody.popular = data[1]
        } else {
          dataBody[sortBy || 'latest'] = data
        }

      }


      res.json({ data: dataBody });
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
