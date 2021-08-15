import home from "./home";
import TrackRoute from "./track";
import ArtistRoute from "./artist";
import PodcastRoute from "./podcast";
import EpisodeRoute from "./episode";
import { validateId } from "../middlewares/validation";

const routes = [
  { path: "/", route: home, validators: [] },
  { path: "/search", route: home, validators: [] },
  { path: "/artist/:id", route: ArtistRoute, validators: [validateId] },
  { path: "/track/:id", route: home, validators: [validateId] },
  { path: "/podcast/:id", route: PodcastRoute, validators: [validateId] },
  { path: "/episode/:id", route: EpisodeRoute, validators: [validateId] },
];

export default routes;
