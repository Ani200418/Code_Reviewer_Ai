#!/bin/bash
# Test All Languages with Docker Sandbox Execution

set -e

API_URL="http://localhost:5001/api"
TOKEN="${JWT_TOKEN:=your_jwt_token_here}"

echo "🧪 Testing Multi-Language Docker Execution"
echo "==========================================="
echo ""

# Test JavaScript
echo "▶️  Testing JavaScript..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "console.log(\"Hello JavaScript\");",
    "language": "javascript"
  }' || echo "JavaScript test failed"
echo -e "\n"

# Test Python
echo "▶️  Testing Python..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "print(\"Hello Python\")",
    "language": "python"
  }' || echo "Python test failed"
echo -e "\n"

# Test Java
echo "▶️  Testing Java..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello Java\"); } }",
    "language": "java"
  }' || echo "Java test failed"
echo -e "\n"

# Test C++
echo "▶️  Testing C++..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "#include <iostream>\nusing namespace std;\nint main() { cout << \"Hello C++\"; return 0; }",
    "language": "cpp"
  }' || echo "C++ test failed"
echo -e "\n"

# Test Go
echo "▶️  Testing Go..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "package main\nimport \"fmt\"\nfunc main() { fmt.Println(\"Hello Go\") }",
    "language": "go"
  }' || echo "Go test failed"
echo -e "\n"

# Test Rust
echo "▶️  Testing Rust..."
curl -X POST "$API_URL/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "fn main() { println!(\"Hello Rust\"); }",
    "language": "rust"
  }' || echo "Rust test failed"
echo -e "\n"

echo "✅ All language tests completed!"
echo ""
echo "To test with a real JWT token:"
echo "  export JWT_TOKEN=your_token_here"
echo "  bash test_languages.sh"
