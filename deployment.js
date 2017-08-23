'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
import knexFactory from 'knex';
import bookshelfFactory from 'bookshelf';
const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  const dbUrl = req.webtaskContext.secrets.dbUrl;
  const knex = knexFactory({ client: 'pg', connection: dbUrl });
  const bookshelf = bookshelfFactory(knex);
  
  prepareDatabase(knex)
  .then(() => {
    const HTML = renderView({
      title: 'Deployment',
      schemaExists: Boolean(knex.schema),
    });

    res.set('Content-Type', 'text/html');
    res.status(200).send(HTML);  
  });
  
});

module.exports = fromExpress(app);

function prepareDatabase(knex) {
  return knex.schema
  .raw('create extension if not exists "uuid-ossp"')
  .createTableIfNotExists('deployment', (table) => {
    table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('name');
  });
}

function renderView(locals) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${locals.title}</title>
      <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.slim.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.js"></script>
    </head>
    <body>
      <br />
      <div class="ui container">
        <h3 class="ui header">Deployment</h4>
        <div>${locals.schemaExists}</div>
      </div>
    </body>
    </html>
  `;
}
