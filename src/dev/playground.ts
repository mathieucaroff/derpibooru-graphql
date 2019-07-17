import { ApolloServer } from 'apollo-server'
import * as fetch from 'node-fetch'

import { DerpibooruGraphql } from '../main'

let derpibooruGraphql = new DerpibooruGraphql({ fetch })
let PORT = process.env.PORT || 4000

let run = async () => {
   let schema = await derpibooruGraphql.executableSchema
   let server = new ApolloServer({
      schema,
   })

   let { url } = await server.listen({ port: PORT })

   console.log(
      `Serving the GraphQL Playground on? http://localhost:${PORT}/playground`,
      `url: ${url}`,
   )
}

run()
