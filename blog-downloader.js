const axios = require('axios');
const fs = require('fs').promises;
const xml2js = require('xml2js');

async function fetchRssFeed(url) {
    try {
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return result.rss.channel[0].item || [];
    } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error.message);
        return [];
    }
}

async function fetchAllArticles(username, organizations = []) {
    const feeds = [];
    
    if (username) {
        feeds.push({
            url: `https://medium.com/feed/@${username}`,
            type: 'user'
        });
    }
    
    for (const org of organizations) {
        feeds.push({
            url: `https://medium.com/feed/${org}`,
            type: 'organization',
            name: org
        });
    }

    let allArticles = [];
    
    for (const feed of feeds) {
        console.log(`Fetching articles from ${feed.type}: ${feed.url}`);
        const articles = await fetchRssFeed(feed.url);
        allArticles = [...allArticles, ...articles];
    }

    return allArticles;
}

async function saveArticles(articles, username, organizations) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
        await fs.mkdir('content', { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Error creating content directory:', error.message);
            throw error;
        }
    }
    
    // Create filename with username and all organizations if available
    const prefix = [username, ...(organizations || [])]
        .filter(Boolean)
        .join('-');
    const fileName = `content/${prefix}-medium-articles-${timestamp}.json`;
    
    const formattedArticles = articles.map(article => ({
        title: article.title[0],
        content: article['content:encoded'] ? article['content:encoded'][0] : null,
        author: article['dc:creator'] ? article['dc:creator'][0] : null,
        categories: article.category || [],
        published_at: article.pubDate[0],
        url: article.link[0],
        description: article.description ? article.description[0] : null
    }));

    try {
        await fs.writeFile(fileName, JSON.stringify(formattedArticles, null, 2));
        console.log(`Articles saved to ${fileName}`);
        return formattedArticles.length;
    } catch (error) {
        console.error('Error saving articles:', error.message);
        return 0;
    }
}

async function main() {
    // Get username and organizations from command line arguments
    const [,, username, ...organizations] = process.argv;
    
    if (!username && organizations.length === 0) {
        console.error('Please provide at least a username or organization name as arguments');
        console.log('Usage: node blog-downloader.js <username> [organization1] [organization2] ...');
        console.log('Example: node blog-downloader.js johndoe my-publication another-publication');
        process.exit(1);
    }

    console.log('Fetching Medium articles...');
    
    const articles = await fetchAllArticles(username, organizations);
    
    if (articles.length === 0) {
        console.log('No articles found');
        process.exit(0);
    }

    const savedCount = await saveArticles(articles, username, organizations);
    
    console.log(`\nSummary:`);
    console.log(`Total articles found: ${savedCount}`);
    if (username) console.log(`User: @${username}`);
    if (organizations.length > 0) console.log(`Organizations: ${organizations.join(', ')}`);
}

main().catch(error => {
    console.error('An error occurred:', error.message);
    process.exit(1);
}); 