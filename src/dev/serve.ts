import * as express from 'express'
import * as expressGraphql from 'express-graphql'

import { DerpibooruGraphql } from '../main'

let derpibooruGraphql = new DerpibooruGraphql({ fetch })
let PORT = process.env.PORT || 4000

let run = async () => {
   let schema = await derpibooruGraphql.executableSchema

   var app = express()
   app.use(
      '/graphql',
      expressGraphql({
         schema,
         graphiql: true,
      }),
   )
   app.listen(4000)
   console.log(`Serving the GraphQL API on http://localhost:${PORT}/graphql`)
}

run()
