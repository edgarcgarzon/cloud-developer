import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import fs from 'fs';
import fetch from 'node-fetch';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */
  app.get( "/filteredimage?", async ( req, res ) => {
    let {image_url} = req.query;

    //check for the imge_url in the query
    if(!image_url)
    {
      return res.status(400).send("image_url is required");
    }

    const filteredimage =  await filterImageFromURL(image_url)
                                .catch((err)=> {return null;} );
    
    console.log(filteredimage);

    //check if the image is correclty processed
    if(filteredimage)
    {
      return res.status(200).sendFile(filteredimage, ()=>deleteLocalFiles([filteredimage]));
    }
    else
    {
      return res.status(400).send("image_url can not be processed");
    }
  });
  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.patch( "/filteredimage?", async ( req, res ) => {
    let {image_url} = req.query;
    let {image_name} = req.query;
    let {signed_url} = req.query;
      
    //Check for the image_url in the query
    if(!image_url){
      return res.status(400).send("image_url is required");
    }
    console.log(`image_url = ${image_url}`);

    //Check for the image_url in the query
    if(!image_name){
      return res.status(400).send("image_name is required");
    }
    console.log(`image_url = ${image_name}`);

    //Check for the image_url in the query
    if(!signed_url){
      return res.status(400).send("signed_url is required");
    }
    console.log(`image_url = ${signed_url}`);

    //Filer image
    const filteredimage =  await filterImageFromURL(image_url)
    .catch((err)=> {return null;} );

    //check filter image
    if(!filteredimage){
      console.log("Error filtering image");
      return res.status(500).send("Error filtering image");
    }

    //change the name of the image
    const image_path = __dirname + '/util/tmp/' + image_name;
    fs.renameSync(filteredimage, image_path);

    //Send the file to File-system
    console.log("Sending file to S3...");
    const resp = await fetch(signed_url, {
        method: 'PUT',
        body: fs.readFileSync(image_path),
        headers: {
          'Content-Type': 'image/jpeg',
      },
    }).catch( err => {
      console.log(err);
      return null;
    });

    // Check for the S3-response
    if(!resp || (resp.status != 200))
    {
      console.log(`S3-service answer: ${resp.status}: ${resp.statusText}`)
      return res.status(500).send('Problem with image update');
    }

    return res.status(200).send();
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();