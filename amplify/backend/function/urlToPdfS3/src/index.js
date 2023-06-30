/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_S3BUCKET_BUCKETNAME
Amplify Params - DO NOT EDIT */

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import crypto from 'crypto';

import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client();

const Bucket = process.env.STORAGE_S3BUCKET_BUCKETNAME

const pdfConfig = {
    format: 'A4',
    printBackground: true,
    margin: { // Word's default A4 margins
        top: '2.54cm',
        bottom: '2.54cm',
        left: '2.54cm',
        right: '2.54cm'
    }
};

const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
});

const getDownloadUrl = async (key) => {
    return getSignedUrl(
        s3Client, 
        new GetObjectCommand({
            Bucket, Key: key
        }), 
        {expiresIn: 7 * 24 * 3600}
    );
}

const buildResponse = (statusCode, responseObject) => {
    return {
        statusCode, 
        body: JSON.stringify(responseObject),
        headers: {
            "content-type": "application/json",
        }
    }
}

export const handler = async (
  event,
  context
) => {
    const url = event.queryStringParameters?.url || 'https://www.nmac.com.ar';
    const s3ObjectName = crypto.randomUUID() + '.pdf';
    const s3Key = 'public/' + s3ObjectName;
    const targetFile = '/tmp/' + s3ObjectName;
    try {
        console.log("Post-browser")
        const page = await browser.newPage();
        await page.goto(url);

        const uploader = new Upload({
            client: s3Client,
            params: {
                Bucket,
                Key: s3Key,
                Body: await page.pdf({
                    ...pdfConfig, 
                    path: targetFile
                })
            },
            tags: [], // optional tags
            queueSize: 4, // optional concurrency configuration
            partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
            leavePartsOnError: false, // optional manually handle dropped parts
        });
        await uploader.done();
        await page.close();

        const downloadUrl = await getDownloadUrl(s3Key);
        return buildResponse(200, {url, targetFile, downloadUrl})
    } catch(err) {
        console.log("Some error happended: ", err);
        return buildResponse(500, {err});
    }
}