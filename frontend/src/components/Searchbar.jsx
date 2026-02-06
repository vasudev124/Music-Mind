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
      setSearchData(data); // store backend response
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      
      {/* Search Input */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by mood, vibe, situation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #333",
            background: "#0b0b0b",
            color: "white",
            fontSize: "1rem"
          }}
        />
      </form>

      {/* Loading */}
      {loading && (
        <p style={{ marginTop: "1rem", opacity: 0.7 }}>
          Searching...
        </p>
      )}

      {/* Results */}
      <SearchResults data={searchData} />
    </div>
  );
};

export default Searchbar;
