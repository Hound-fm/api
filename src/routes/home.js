import { name, version, description } from "../../package.json";

function home(req, res) {
  res.send({ data: { version, description } });
}

export default home;
