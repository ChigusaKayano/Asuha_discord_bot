const fetch = require("node-fetch");

class Giphy {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    fetchRandomOffset(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    searchGif(wordKey) {
        let url = `https://api.giphy.com/v1/gifs/search?api_key=${this.apiKey}&q=${wordKey}&limit=25&offset=${this.fetchRandomOffset(50)}&rating=G`;
        return new Promise((resolve, reject) => {
            const result = fetch(url)
                .then(response => response.json()
                    .then(content => {
                        content ? resolve(content) : reject();
                    })
                )
        })
    }
}

module.exports = {
    Giphy
}
