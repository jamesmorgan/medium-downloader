# Medium Blog Downloader

A simple Node.js tool to download blog posts from Medium using RSS feeds.

## Installation
```bash
npm install
```

## Usage

Download articles from a Medium user:
```bash
node blog-downloader.js @username
```

Download articles from a Medium publication:
```bash
node blog-downloader.js "" publication-name
```

Download both user and publication articles:
```bash
node blog-downloader.js @username publication-name
```

## Output

The tool creates a JSON file with the following naming pattern:
```
{username/publication}-medium-articles-{timestamp}.json
```

Each article contains:
- Title
- Content
- Author
- Categories
- Publication date
- URL
- Description

## Requirements

- Node.js
- npm
