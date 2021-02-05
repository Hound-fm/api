import { Client } from "@elastic/elasticsearch";
import { config } from 'dotenv';

// Load config from env
config();

const client = new Client({ node: process.env.ELASTIC_NODE, auth: { username: process.env.ELASTIC_USER, password: process.env.ELASTIC_PASSWORD }});

export default client;
