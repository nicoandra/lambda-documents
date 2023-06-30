import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from 'fs';

const targetFile = "/tmp/screenshot.pdf";

const pdfConfig = {
    path: targetFile, // Saves pdf to disk. 
    format: 'A4',
    printBackground: true,
    margin: { // Word's default A4 margins
        top: '2.54cm',
        bottom: '2.54cm',
        left: '2.54cm',
        right: '2.54cm'
    }
};

export const handler = async (
  event,
  context
) => {
    const url = event.queryStringParameters?.url || 'https://www.nmac.com.ar';
    try {
        console.log("Pre-browser")
        const browser = await puppeteer.launch({
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
            defaultViewport: chromium.defaultViewport,
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        });
        console.log("Post-browser")
        const page = await browser.newPage();

        await page.goto(url);

        const pdf = await page.pdf(pdfConfig);

        const pages = await browser.pages();
        for (let i = 0; i < pages.length; i++) {
            await pages[i].close();
        }

        const asBase64 = await fs.readFileSync(targetFile, 'base64')
        return {statusCode: 200, body: JSON.stringify({asBase64})}
    } catch(err) {
        console.log("Some error happended: ", err);
        return {statusCode: 500, body: JSON.stringify({err})}
    }
}