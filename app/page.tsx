"use client"

import React, { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, Sparkles, TrendingUp } from "lucide-react";

// Define types for the API response and result structure
interface SearchResult {
  id: number;
  content: string;
  similarity: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Default items to show
  const defaultItems = [
    { id: 1, content: "javascript", similarity: 1 },
    { id: 2, content: "python", similarity: 1 },
    { id: 3, content: "next.js", similarity: 1 },
    { id: 4, content: "apple", similarity: 1 },
    { id: 5, content: "mango", similarity: 1 },
    { id: 6, content: "grapes", similarity: 1 },
  ];

  // Function to fetch search results from the API
  const fetchResults = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(defaultItems);
      setHasSearched(false);
      setWarning("");
      return;
    }

    setLoading(true);
    setWarning("");
    setHasSearched(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/search?query=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data: SearchResponse = await response.json();

      // Filter results with similarity >= 0.4 (40%)
      const highSimilarityResults = data.results.filter(
        (result) => result.similarity >= 0.4
      );

      if (highSimilarityResults.length > 0) {
        setResults(highSimilarityResults);
        setWarning("");
      } else {
        // Show all results but with a warning
        setResults(data.results);
        setWarning(
          "⚠️ No results found with high similarity (>40%). Showing all available results, but they may not be relevant."
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setWarning("Error fetching search results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle the change in search query with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchResults(value);
    }, 500);
  };

  // Initialize with default items
  useEffect(() => {
    setResults(defaultItems);
  }, []);

  // Get similarity color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-green-600";
    if (similarity >= 0.6) return "text-blue-600";
    if (similarity >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  // Get similarity badge color
  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 0.8) return "bg-green-100 text-green-700 border-green-300";
    if (similarity >= 0.6) return "bg-blue-100 text-blue-700 border-blue-300";
    if (similarity >= 0.4) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-600 mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Semantic Search
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Search using natural language and find similar content
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Try searching: fruit, programming, framework..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        )}

        {/* Warning Message */}
        {warning && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800 text-sm">{warning}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
            {hasSearched ? `Search Results (${results.length})` : "Available Content"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {hasSearched
              ? "Results sorted by similarity"
              : "All available items in the database"}
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-purple-300 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {result.content}
                  </h3>
                  {hasSearched && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSimilarityBadge(
                        result.similarity
                      )}`}
                    >
                      {(result.similarity * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {hasSearched && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Similarity Score</span>
                      <span
                        className={`font-bold ${getSimilarityColor(
                          result.similarity
                        )}`}
                      >
                        {result.similarity.toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.similarity >= 0.8
                            ? "bg-green-500"
                            : result.similarity >= 0.6
                            ? "bg-blue-500"
                            : result.similarity >= 0.4
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${result.similarity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
              </div>
              <p className="text-gray-600 text-lg">No results found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try a different search term
              </p>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-xl shadow-sm px-6 py-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-purple-600">Tip:</span> This
              search uses AI embeddings to find semantically similar content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;