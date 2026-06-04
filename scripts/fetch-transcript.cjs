const { YoutubeTranscript } = require('youtube-transcript');

const url = process.argv[2];

if (!url) {
  console.error("No URL provided");
  process.exit(1);
}

YoutubeTranscript.fetchTranscript(url)
  .then(transcript => {
    const text = transcript.map(t => t.text).join(' ');
    console.log(text);
  })
  .catch(err => {
    console.error("Error fetching transcript:", err.message);
    process.exit(1);
  });
