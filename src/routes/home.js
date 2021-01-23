import { name, version, description } from "../../package.json";

function home(req, res) {
  res.send({ name, version, description });
}

export default home;
