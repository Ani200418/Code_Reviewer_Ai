/**
 * Code Naming Utility
 * Generates meaningful titles for code reviews based on code content
 */

const CODE_PATTERNS = [
  // Pattern: [regex, name]
  [/function\s+factorial|factorial\s*\(|\bn\s*\*\s*\(n\s*-\s*1\)|fact\s*\(/gi, 'Factorial Program'],
  [/function\s+fibonacci|fib\s*\(|0,\s*1,\s*1,\s*2,\s*3,\s*5/gi, 'Fibonacci Sequence'],
  [/sort|bubble|merge|quick|heap|insertion|selection|comparator/gi, 'Sorting Algorithm'],
  [/binarySearch|binary\s+search|left\s*<\s*right|mid\s*=|bisect/gi, 'Binary Search'],
  [/findDuplicate|duplicate|hasDuplicate/gi, 'Duplicate Finder'],
  [/isPalindrome|palindrome|reverse|String.*reverse/gi, 'Palindrome Checker'],
  [/isPrime|prime\s+number|sieve|Sieve/gi, 'Prime Number Checker'],
  [/for\s*\(.*for\s*\(|\bO\s*\(\s*n\s*\^?\s*2/gi, 'Nested Loop Algorithm'],
  [/forEach|map\s*\(|filter\s*\(|reduce\s*\(/gi, 'Array Transformation'],
  [/while\s*\(|do\s*\{|loop|iteration/gi, 'Loop Example'],
  [/recursion|recursive|call.*itself|return.*\(|stack.*overflow/gi, 'Recursive Function'],
  [/class|constructor|this\.|prototype|extends|super/gi, 'Object-Oriented Program'],
  [/async|await|promise|then\s*\(|Promise\.all/gi, 'Async Operations'],
  [/try\s*\{|catch|finally|throw|Error/gi, 'Error Handling'],
  [/import|export|module|require|npm/gi, 'Module System'],
  [/useState|useEffect|useContext|React\./gi, 'React Component'],
  [/\.then\(|\.catch\(|callback|Promise/gi, 'Promise Handling'],
  [/for\s*\(.*in\s|Object\.keys|Object\.entries/gi, 'Object Iteration'],
  [/split\s*\(|join\s*\(|substring|indexOf|slice|trim/gi, 'String Manipulation'],
  [/api|fetch|http|request|response|status|endpoint/gi, 'API Handler'],
  [/database|sql|query|select|where|insert|update|delete/gi, 'Database Query'],
  [/class.*Exception|throw.*Error|try.*catch/gi, 'Exception Handling'],
  [/main\s*\(\)|public static void main|if __name__/gi, 'Main Program'],
];

/**
 * Generates a meaningful code title based on content
 * @param {string} code - The code content
 * @param {string} fileName - Optional file name
 * @returns {string} - Generated title
 */
const generateCodeName = (code, fileName = '') => {
  // If file name exists and is meaningful, use it
  if (fileName && fileName.length > 0) {
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '').trim();
    if (nameWithoutExt.length > 0 && nameWithoutExt.length < 100) {
      // Capitalize first letter
      return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
    }
  }

  // Try to match patterns in code
  for (const [pattern, name] of CODE_PATTERNS) {
    if (pattern.test(code)) {
      return name;
    }
  }

  // If no pattern matched, use generic name based on code characteristics
  const lines = code.split('\n').filter(l => l.trim().length > 0).length;
  const hasClasses = /class\s+\w+|interface\s+\w+/i.test(code);
  const hasFunctions = /function\s+\w+|def\s+\w+|fn\s+\w+/i.test(code);
  const hasAsync = /async|await|promise/i.test(code);

  if (hasClasses) return 'Class Definition';
  if (hasAsync) return 'Async Code';
  if (hasFunctions) return `Code ${lines} Lines`;
  
  return `Code Snippet (${lines} lines)`;
};

module.exports = { generateCodeName };
