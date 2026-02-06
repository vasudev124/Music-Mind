const SearchResults = ({ data }) => {
  if (!data) return null;

  const { featured, results } = data;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 3fr",
        gap: "2rem",
        marginTop: "2rem"
      }}
    >
      {/* LEFT — FEATURED */}
      <div
        style={{
          padding: "20px",
          borderRadius: "16px",
          background: "#111",
          border: "1px solid #222",
          minHeight: "200px"
        }}
      >
        <h3 style={{ opacity: 0.7 }}>Top Result</h3>
        <h2>{featured.title}</h2>
        <p>{featured.artist}</p>

        <a
          href={featured.spotifyUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1db954", fontWeight: 600 }}
        >
          ▶ Play on Spotify
        </a>
      </div>

      {/* RIGHT — OTHER SONGS */}
      <div>
        <h3 style={{ marginBottom: "1rem" }}>Related Songs</h3>

        {results.map((song, i) => (
          <div
            key={i}
            style={{
              padding: "12px",
              marginBottom: "10px",
              background: "#0d0d0d",
              borderRadius: "10px",
              border: "1px solid #222",
              cursor: "pointer"
            }}
            onClick={() => window.open(song.spotifyUrl, "_blank")}
          >
            <strong>{song.title}</strong>
            <p style={{ margin: 0, opacity: 0.7 }}>{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
