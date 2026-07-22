const fs = require('fs');
let content = fs.readFileSync('app/routers/portfolio.py', 'utf8');
const c = content.split('period_days_map').length - 1;
console.log('period_days_map count:', c);
const idx = content.indexOf('def _generate_synthetic');
console.log('_generate_synthetic position:', idx);
const handlerIdx = content.indexOf('@router.get("/{portfolio_id}/yield"');
console.log('handler position:', handlerIdx);
// Check if it's inside the handler
const postIdx = content.indexOf('@router.post');
console.log('next decorator position:', postIdx);
console.log('Inside handler:', idx > handlerIdx && idx < postIdx);
