with open('app/routers/portfolio.py', 'r', encoding='utf-8') as f:
    content = f.read()
c = content.count('period_days_map')
print(f"period_days_map occurrences: {c}")
# Check syntax by trying to compile
try:
    compile(content, 'portfolio.py', 'exec')
    print("Syntax OK")
except SyntaxError as e:
    print(f"SyntaxError: {e}")
