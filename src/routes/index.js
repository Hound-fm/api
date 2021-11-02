import home from "./home";
import ExploreRoute from "./explore";
import SearchRoute from "./search";
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
    path: "/explore",
    route: ExploreRoute,
    validators: [validateSearchType],
  },
  {
    path: "/search",
    route: SearchRoute,
    validators: [validateSearchQuery, validateSearchType],
  },
  { path: "/stream/:id", route: StreamRoute, validators: [validateId] },
  { path: "/channel/:id", route: ChannelRoute, validators: [validateId] },
];

export default routes;
