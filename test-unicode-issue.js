// This file demonstrates the issue with Unicode characters in identifiers
// The following code runs without error in JavaScript

varあ = 5;
sum = 0;
console.log('varあ:', varあ);
console.log('sum:', sum);

// This might be intended as: var あ = 0;
// But it's actually creating a variable named "varあ"
