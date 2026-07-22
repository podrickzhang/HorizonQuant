const fs = require('fs');
let content = fs.readFileSync('src/components/YieldChart.jsx', 'utf8');

// 1. Add dataStale state
if (!content.includes('const [dataStale, setDataStale]')) {
  content = content.replace(
    'const [loading, setLoading] = useState(false)',
    'const [loading, setLoading] = useState(false)\n  const [dataStale, setDataStale] = useState(false)'
  );
}

// 2. Extract data_stale from response
content = content.replace(
  'setServerData({ data: res.data, dates: res.dates })\n        setServerTotal(res.total_return)',
  'setServerData({ data: res.data, dates: res.dates })\n        setServerTotal(res.total_return)\n        setDataStale(res.data_stale === true)'
);

// 3. Add stale warning before bottom summary
content = content.replace(
  '{/* 底部收益概览 */}',
  `{/* 数据过期提示 */}
      {dataStale && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
          数据截止 {dates.length > 0 ? dates[dates.length - 1].toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}，暂无最新净值
        </div>
      )}

      {/* 底部收益概览 */}`
);

fs.writeFileSync('src/components/YieldChart.jsx', content);
console.log('done');
