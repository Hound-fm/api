import home from "./home";
import FeedRoute from "./feed";
import ExploreRoute from "./explore";
import SearchRoute from "./search";
import ResolveRoute from "./resolve";

import {
  validateId,
  validateSearchQuery,
  validateSearchType,
} from "../middlewares/validation";

const routes = {
  get: [
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
    {
      path: "/feed",
      route: FeedRoute,
      validators: [],
    },
  ],
  post: [
    {
      path: "/resolve",
      route: ResolveRoute,
      validators: [],
    },
  ],
};

export default routes;
