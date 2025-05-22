# TinyUrl POC
To run this app locally, you need to run client and server separately.
<img width="772" alt="Screenshot 2025-05-21 at 6 05 36 PM" src="https://github.com/user-attachments/assets/e546579a-d859-4129-a985-21f1c2ccc364" />

**This app support:**
1. Create short urls from the long url with optional custom code.
2. Look up all created short urls, with informations like clicks, its long urls. (One long url can have multiple short urls)
3. Delete existing short url.
4. Retrieve long url from short url. (Clicking on the app or paste it in browser)
## Run client
Go to tinyurl-client folder, and run
`npm install`
then `npm run dev`
## Run server
Go to tinyurl-server/WebApplication1 folder, and run
`dotnet run`
