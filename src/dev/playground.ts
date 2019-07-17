import { ApolloServer } from 'apollo-server'
import * as fetch from 'node-fetch'

import { DerpibooruGraphql } from '../main'

let run = async () => {
   let derpibooruGraphql = new DerpibooruGraphql({ fetch })
   let PORT = process.env.PORT || 4000

   let { schema } = derpibooruGraphql
   let server = new ApolloServer({
      schema,
   })

   await server.listen({ port: PORT })

   console.log(
      `Serving the GraphQL Playground on http://localhost:${PORT}/playground`,
   )
}

run()
