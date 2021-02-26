import { Router, Request, Response } from 'express';
import fetch, { FetchError } from 'node-fetch';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';
import { config } from '../../../../config/config';

const router: Router = Router();

// Get all feed items
router.get('/', 
async (req: Request, res: Response) => {
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    items.rows.map((item) => {
            if(item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

//@TODO
//Add an endpoint to GET a specific resource by Primary Key
router.get('/:id', async (req: Request, res: Response) => {
    
    let {id} = req.params;
    const item = await FeedItem.findByPk(id);

    if(item)
    {
        res.send(item);
    }
    else
    {
        res.status(404).send("item not found");
    }
    
}); 

// update a specific resource
router.patch('/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {
        let{id}= req.params;
        let{caption, url} =req.body;
        if (!id){
            return res.status(400).send(`Numeric ID is required`);
        }
        
        const item= await FeedItem.findByPk(id);
        if (item === null){
            return res.status(404).send(`This ID is not found`);
        }
        if (!caption) {
            return res.status(400).send({ message: 'Caption is required or malformed' });
        }
    
        // check Filename is valid
        if (!url) {
            return res.status(400).send({ message: 'File url is required' });
        }
        item.caption=caption;
        item.url=url; 
        item.save();
        res.send(item);
});


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    const caption = req.body.caption;
    const fileName = req.body.url;

    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }

    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }

    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });

    const saved_item = await item.save();

    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

router.patch('/filter/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {
        
    let{id}= req.params;
    if (!id){
        return res.status(400).send(`Numeric ID is required`);
    }

    //Look for the feed in the dabase
    const item= await FeedItem.findByPk(id);
    if (item === null){
        return res.status(404).send(`This ID is not found`);
    }

    //get signed url for read and put the message
    const get_signed_url = AWS.getGetSignedUrl(item.url);
    const put_signed_url = AWS.getPutSignedUrl(item.url);

    //build the URL
    const url = config.dev.image_filter_service_host + 
                "/filteredimage?" + 
                new URLSearchParams({
                    image_url: get_signed_url,
                    image_name: item.url,
                    signed_url: put_signed_url
                });

    //Send the resquest to the Filter Image Service
    const resp = await fetch(url, {
        method: 'PATCH',
        timeout: 500,
    }).catch( err => {
        //console.log(err.Type);
        return err;
    });    
    
    //Check the answer
    if(!resp || (resp.status !== 200) || (resp instanceof FetchError))
    {
      console.log(`Filter image service response: ${resp.status}: ${resp.statusText} : ${resp.message}`)
      return res.status(500).send('Problem with image filter service');
    }

    return res.status(200).send(get_signed_url);

});

export const FeedRouter: Router = router;