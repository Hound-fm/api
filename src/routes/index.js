import home from "./home";
import { SearchRoute, AutocompleteRoute } from "./search";
import StreamRoute from "./stream";
import ChannelRoute from "./channel";
import {
  validateId,
  validateSearchQuery,
  validateSearchType,
} from "../middlewares/validation";

const routes = [
  { path: "/", route: home, validators: [] },
  {
    path: "/search",
    route: AutocompleteRoute,
    validators: [validateSearchQuery, validateSearchType],
  },
  { path: "/stream/:id", route: StreamRoute, validators: [validateId] },
  { path: "/channel/:id", route: ChannelRoute, validators: [validateId] },
];

export default routes;
