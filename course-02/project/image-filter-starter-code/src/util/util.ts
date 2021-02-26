import fs from 'fs';
import Jimp = require('jimp');

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string): Promise<string>{
    return new Promise( async (resolve, reject) => {
        try
        {
            const photo = await Jimp.read(inputURL);
            const outpath = '/tmp/filtered.'+Math.floor(Math.random() * 2000)+'.jpg';
            await photo
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            .greyscale() // set greyscale
            .write(__dirname+outpath, (img)=>{
                resolve(__dirname+outpath);
            });
        }
        catch(err)
        {
            reject(err);
        }

    });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files:Array<string>){
    for( let file of files) {
        fs.unlinkSync(file);
    }
}

// Get a S3 signed URL and encode the the parameter to read correctly
export function URLS3Fix(url:string):string
{
    let fixUrl = new URL(url);

    let X_Amz_Credential = fixUrl.searchParams.get('X-Amz-Credential');
    if(X_Amz_Credential){
        X_Amz_Credential = encodeURIComponent(X_Amz_Credential);
        fixUrl.searchParams.set('X-Amz-Credential', X_Amz_Credential);
    }

    let X_Amz_Security_Token = fixUrl.searchParams.get('X-Amz-Security-Token');
    if(X_Amz_Security_Token){
        X_Amz_Security_Token = encodeURIComponent(X_Amz_Security_Token);
        fixUrl.searchParams.set('X-Amz-Security-Token', X_Amz_Security_Token );
    }

    return unescape(fixUrl.toString()).replace(/%20/g, "%2B");

}
