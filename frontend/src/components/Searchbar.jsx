import { useState } from "react";
import { semanticSearch } from "../services/api";
import SearchResults from "./SearchResults";

const Searchbar = () => {
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await semanticSearch(query);
      setSearchData(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        position: "relative",   // ✅ critical
        zIndex: 20,             // ✅ sits above vinyl & bg
      }}
    >
      {/* Search Input */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by mood, vibe, situation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(10,10,10,0.9)",
            color: "#fff",
            fontSize: "1rem",
            outline: "none",
            backdropFilter: "blur(6px)",
          }}
        />
      </form>

      {/* Loading */}
      {loading && (
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.9rem",
            opacity: 0.7,
          }}
        >
          Searching…
        </p>
      )}

      {/* Results */}
      {searchData && <SearchResults data={searchData} />}
    </div>
  );
};

export default Searchbar;
