const axios = require('axios');
const _ = require('lodash');
const apiKey = process.env.BUILDER_API_KEY;

const template = ({ title, html }) => `<html lang="en">
<head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    ${html}
</body>
</html>
`;

module.exports = async (req, res) => {
    const pageSlug = _.get(req, 'query.path', 'home');
    const url = `https://cdn.builder.io/api/v1/html/page?url=/${encodeURIComponent(pageSlug)}&apiKey=${apiKey}`;
    try {
        const {data} = await axios(url);
        res.send(template(data.data));
    } catch (e) {
        res.status(500).send(e.message);
    }
}
