(function () {
  const BLOG_URL = "https://beyondthesky0.blogspot.com";
  const FEED_URL = `${BLOG_URL}/feeds/posts/default?alt=json&max-results=20`;

  const styles = `
    .bts-react-wrap, .bts-react-wrap * {
      box-sizing: border-box;
    }
    .bts-react-wrap {
      max-width: 1240px;
      width: 100%;
      margin: 0 auto;
      padding: 24px 16px 60px;
      color: #ffffff;
      font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
    }
    .bts-react-topbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.18);
    }
    .bts-react-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-width: 100%;
    }
    .bts-react-tab {
      background: #111622;
      color: #ffffff;
      border: 1.5px solid rgba(255,255,255,0.35);
      padding: 8px 14px;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .bts-react-tab.active, .bts-react-tab:hover {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
    }
    .bts-react-search {
      background: #050811;
      color: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 6px;
      padding: 9px 14px;
      font-size: 14px;
      width: 250px;
      max-width: 100%;
      outline: none;
    }
    .bts-react-search:focus {
      border-color: #77e4ff;
    }
    .bts-react-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 24px;
      width: 100%;
    }
    .bts-react-card {
      border: 2.5px solid #ffffff;
      border-radius: 6px;
      background: #03050c;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
    }
    .bts-react-card:hover {
      border-color: #77e4ff;
    }
    .bts-react-thumb {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
    }
    .bts-react-title {
      margin: 0;
      font-size: 19px;
      line-height: 1.35;
      word-wrap: break-word;
    }
    .bts-react-title a {
      color: #ffffff;
      text-decoration: none;
    }
    .bts-react-title a:hover {
      color: #77e4ff;
    }
    .bts-react-snippet {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: rgba(255,255,255,0.8);
      word-wrap: break-word;
    }
    .bts-react-btn {
      display: inline-block;
      margin-top: 6px;
      padding: 8px 14px;
      border: 1.5px solid #77e4ff;
      color: #77e4ff;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      width: fit-content;
    }
    .bts-react-btn:hover {
      background: #77e4ff;
      color: #000000;
    }

    @media (max-width: 600px) {
      .bts-react-wrap {
        padding: 16px 12px 44px;
      }
      .bts-react-topbar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .bts-react-tabs {
        gap: 6px;
      }
      .bts-react-tab {
        padding: 7px 11px;
        font-size: 12px;
        flex: 1 1 auto;
        text-align: center;
      }
      .bts-react-search {
        width: 100%;
        font-size: 15px;
      }
      .bts-react-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .bts-react-card {
        padding: 14px;
      }
      .bts-react-thumb {
        height: 165px;
      }
      .bts-react-title {
        font-size: 17px;
      }
    }
  `;

  function loadScript(src, callback) {
    const s = document.createElement("script");
    s.src = src;
    s.onload = callback;
    document.head.appendChild(s);
  }

  function extractThumb(entry) {
    if (entry.media$thumbnail && entry.media$thumbnail.url) {
      return entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, "/w800/");
    }
    const content = (entry.content && entry.content.$t) || "";
    const match = content.match(/<img[^>]+src="([^">]+)"/i);
    return match ? match[1] : "";
  }

  function extractSnippet(entry, maxLen = 140) {
    const raw = (entry.summary && entry.summary.$t) || (entry.content && entry.content.$t) || "";
    const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  }

  function extractLink(entry) {
    if (!entry.link) return BLOG_URL;
    const alt = entry.link.find((l) => l.rel === "alternate");
    return alt ? alt.href : BLOG_URL;
  }

  function extractLabels(entry) {
    if (!entry.category) return [];
    return entry.category.map((c) => c.term).filter(Boolean);
  }

  function startApp() {
    const { useState, useEffect, useMemo } = React;

    function BeyondSkyApp() {
      const [posts, setPosts] = useState([]);
      const [loading, setLoading] = useState(true);
      const [query, setQuery] = useState("");
      const [activeLabel, setActiveLabel] = useState("All");

      useEffect(() => {
        fetch(FEED_URL)
          .then((res) => res.json())
          .then((data) => {
            const entries = (data.feed && data.feed.entry) || [];
            const formatted = entries.map((item, idx) => ({
              id: item.id?.$t || idx,
              title: item.title?.$t || "Untitled",
              url: extractLink(item),
              thumb: extractThumb(item),
              snippet: extractSnippet(item),
              labels: extractLabels(item),
              date: (item.published?.$t || "").slice(0, 10)
            }));
            setPosts(formatted);
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }, []);

      const allLabels = useMemo(() => {
        const set = new Set(["All"]);
        posts.forEach((p) => p.labels.forEach((l) => set.add(l)));
        return Array.from(set).slice(0, 6);
      }, [posts]);

      const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
          const matchesLabel = activeLabel === "All" || post.labels.includes(activeLabel);
          const matchesQuery =
            !query.trim() ||
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.snippet.toLowerCase().includes(query.toLowerCase());
          return matchesLabel && matchesQuery;
        });
      }, [posts, activeLabel, query]);

      return React.createElement(
        "div",
        { className: "bts-react-wrap" },
        React.createElement(
          "div",
          { className: "bts-react-topbar" },
          React.createElement(
            "div",
            { className: "bts-react-tabs" },
            allLabels.map((label) =>
              React.createElement(
                "button",
                {
                  key: label,
                  type: "button",
                  className: `bts-react-tab ${activeLabel === label ? "active" : ""}`,
                  onClick: () => setActiveLabel(label)
                },
                label
              )
            )
          ),
          React.createElement("input", {
            type: "text",
            className: "bts-react-search",
            placeholder: "Search sky events...",
            value: query,
            onChange: (e) => setQuery(e.target.value)
          })
        ),
        loading
          ? React.createElement("p", null, "Loading cosmic feed...")
          : filteredPosts.length === 0
          ? React.createElement("p", null, "No matching posts found.")
          : React.createElement(
              "div",
              { className: "bts-react-grid" },
              filteredPosts.map((post) =>
                React.createElement(
                  "article",
                  { key: post.id, className: "bts-react-card" },
                  React.createElement(
                    "div",
                    null,
                    post.thumb &&
                      React.createElement("img", {
                        src: post.thumb,
                        alt: post.title,
                        className: "bts-react-thumb"
                      }),
                    React.createElement(
                      "h3",
                      { className: "bts-react-title", style: { marginTop: post.thumb ? "12px" : "0" } },
                      React.createElement("a", { href: post.url }, post.title)
                    ),
                    post.date &&
                      React.createElement(
                        "div",
                        { style: { fontSize: "12px", opacity: 0.6, marginTop: "4px" } },
                        post.date
                      ),
                    React.createElement(
                      "p",
                      { className: "bts-react-snippet", style: { marginTop: "10px" } },
                      post.snippet
                    )
                  ),
                  React.createElement(
                    "a",
                    { href: post.url, className: "bts-react-btn" },
                    "Read More ->"
                  )
                )
              )
            )
      );
    }

    const mountNode = document.getElementById("beyond-react-root");
    if (mountNode) {
      ReactDOM.createRoot(mountNode).render(React.createElement(BeyondSkyApp));
    }
  }

  const styleTag = document.createElement("style");
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);

  loadScript("https://unpkg.com/react@18/umd/react.production.min.js", () => {
    loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", startApp);
  });
})();

