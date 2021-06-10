const axios = require('axios');
const _ = require('lodash');
const apiKey = process.env.BUILDER_API_KEY;
const aws = require('aws-sdk');

aws.config.update({
    'accessKeyId': process.env.BUILDER_AWS_ACCESS_KEY_ID,
    'secretAccessKey': process.env.BUILDER_AWS_SECRET_ACCESS_KEY,
    'region': 'eu-west-2',
});
const S3_BUCKET = 'kendraio-builder-website';

const template = ({ title, html }) => `<html lang="en">
<head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" 
          href="https://user.kendra.io/sites/default/files/kendra-favicon_2.ico"
          type="image/vnd.microsoft.icon" />
</head>
<body>
    ${html}
</body>
</html>
`;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        console.log('webhook should be a POST');
        res.status(400).send('webhook should be a POST');
        return;
    }
    const id = _.get(req, 'body.newValue.id');
    if (!id) {
        console.log('id not found in request');
        res.status(400).send();
        return;
    }
    const url = `https://cdn.builder.io/api/v1/html/page/${id}?apiKey=${apiKey}&cachebust=true`;
    try {
        const {data} = await axios(url);
        const pageUrl = _.get(data, 'data.url');
        const page = template(data.data);
        // save PAGE to storage
        const s3 = new aws.S3();

        s3.putObject({
            Bucket: S3_BUCKET,
            Key: pageUrl === '/home' ? 'index.html' : `${pageUrl.substring(1)}/index.html`,
            ContentType: 'text/html',
            ACL: 'public-read',
            Body: page,
        }, (err, data1) => {
            if(err){
                console.log(err.message);
                return res.status(500).send(err.message);
            }
            console.log('sent to s3', data1);

            if (pageUrl === '/home') {
                s3.putObject({
                    Bucket: S3_BUCKET,
                    Key: 'home/index.html',
                    ContentType: 'text/html',
                    ACL: 'public-read',
                    Body: page,
                }, (err1, data2) => {
                    if(err1){
                        console.log(err1.message);
                        return res.status(500).send(err.message);
                    }
                    console.log('sent to s3', data2);
                    res.status(200).send();
                });
            } else {
               res.status(200).send();
            }

        });
    } catch (e) {
        console.log(e.message);
        res.status(500).send(e.message);
    }
}
