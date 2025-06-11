import React from "react";

const cards = [
  {
    title: "爆款美妆种草文案",
    badge: "美妆",
    badgeClass: "text-yellow-600 bg-yellow-50",
    content:
      "通过AI生成的美妆产品推荐文案，专业分析产品成分和使用效果，结合个人体验分享，打造真实可信的种草内容。从产品选择到使用心得，每一个细节都经过精心打磨，让读者能够真切感受到产品的魅力。无论是日常妆容还是特殊场合，都能找到最适合的美妆方案。",
  },
  {
    title: "科技产品评测",
    badge: "科技",
    badgeClass: "text-blue-600 bg-blue-50",
    content:
      "深度AI生成的手机评测内容，从外观设计到性能测试，从拍照效果到续航表现，全方位解析最新科技产品。采用专业的测试方法和客观的评价标准，为消费者提供最有价值的购买参考。不仅关注产品本身，更从用户实际使用场景出发，给出最贴心的建议。",
  },
  {
    title: "旅行攻略分享",
    badge: "旅行",
    badgeClass: "text-green-600 bg-green-50",
    content:
      "AI助力创作的三亚旅行攻略，从行程规划到住宿推荐，从美食探索到景点打卡，每一个环节都经过精心安排。结合当地文化特色和季节变化，为游客提供最实用的旅行指南。不仅有详细的路线规划，更有贴心的旅行小贴士，让每一次旅行都成为难忘的回忆。",
  },
  {
    title: "职场干货分享",
    badge: "职场",
    badgeClass: "text-purple-600 bg-purple-50",
    content:
      "AI生成的职场成长建议，涵盖求职技巧、工作方法、人际关系、职业规划等多个方面。从新人入职到资深员工晋升，每个职场阶段都有对应的成长策略。结合真实案例和实用工具，帮助职场人士提升工作效率，实现职业目标，在竞争激烈的职场中脱颖而出。",
  },
];

export const ChineseFeatureCards: React.FC<{ onCardClick?: (title: string) => void }> = ({ onCardClick }) => (
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 px-4">
    {cards.map((card, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
        onClick={() => onCardClick?.(card.title)}
      >
        <div className="flex items-center mb-4">
          <span className="text-lg font-bold text-gray-900 flex-1">{card.title}</span>
          <span className={`px-3 py-1 text-sm font-medium rounded ${card.badgeClass}`}>{card.badge}</span>
        </div>
        <p className="text-gray-600 leading-relaxed">{card.content}</p>
      </div>
    ))}
  </div>
); 