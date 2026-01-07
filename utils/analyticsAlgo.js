/**
 * Analytics Algorithm Utility
 * Processes raw Spotify data to return insights.
 */

// Helper to count occurrences
function getTopGenres(artists) {
    const genreCounts = {};
    artists.forEach(artist => {
        artist.genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });

    // Sort by count desc
    const sortedGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5) // Top 5
        .map(([genre, count]) => ({ genre, count }));

    return sortedGenres;
}

// Helper to calculate mood score from audio features
// Mood Score: 0 (Sad/Low Energy) -> 100 (Happy/High Energy)
// Using Valence (Positivity) and Energy
function calculateMoodScore(audioFeatures) {
    if (!audioFeatures || audioFeatures.length === 0) return 50; // Neutral default

    let totalValence = 0;
    let totalEnergy = 0;
    let count = 0;

    audioFeatures.forEach(feat => {
        if (feat) {
            totalValence += feat.valence;
            totalEnergy += feat.energy;
            count++;
        }
    });

    if (count === 0) return 50;

    const avgValence = totalValence / count;
    const avgEnergy = totalEnergy / count;

    // Simple formula: Average of Valence and Energy * 100
    // Valence is 0.0-1.0, Energy is 0.0-1.0
    return Math.round(((avgValence + avgEnergy) / 2) * 100);
}

module.exports = {
    getTopGenres,
    calculateMoodScore
};
