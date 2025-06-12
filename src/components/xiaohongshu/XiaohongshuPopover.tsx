import React, { useState } from 'react';
import XiaohongshuCard from './XiaohongshuCard';

const XiaohongshuPopover: React.FC = () => {
  const [articles, setArticles] = useState([]);

  // Assuming articlesData is fetched from somewhere
  const articlesData = [];

  // Assuming you have a function to fetch articles
  const fetchArticles = async () => {
    // Fetch articles and set them in the state
    setArticles(Array.isArray(articlesData) ? articlesData : []);
  };

  return (
    <div>
      {Array.isArray(articles) && articles.length > 0 ? (
        articles.map((article, idx) => (
          <XiaohongshuCard key={article.id || idx} article={article} />
        ))
      ) : (
        <div className="text-gray-400 text-center py-8">暂无草稿</div>
      )}
    </div>
  );
};

export default XiaohongshuPopover; 