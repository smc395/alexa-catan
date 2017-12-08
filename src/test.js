const catan = require("./test.index.js");

test('rollDice returns a number between 2 and 12', () => {
	var roll = catan.rollDice();
	expect(roll).toBeLessThanOrEqual(12);
	expect(roll).toBeGreaterThanOrEqual(2);
});

test('incrementTurn returns a number +1', () => {
	expect(catan.incrementTurn(99)).toBe(100);
	expect(catan.incrementTurn(undefined)).toBeNaN();
});

test('decrementTurn returns a number -1', () => {
	expect(catan.decrementTurn(100)).toBe(99);
	expect(catan.decrementTurn(undefined)).toBeNaN();
});

test('findMinIndex returns the index of smallest value in the array', () => {
	var a1 = [2,4,4,9,10,2];
	var a2 = [11];
	var a3 = [6,8,4,5,12,6,3];

	expect(catan.findMinIndex(a1)).toBe(4); // when there are duplicate min value, should be the first found instance
	expect(catan.findMinIndex(a2)).toBe(0);	// index should be the first index
	expect(catan.findMinIndex(a3)).toBe(6); // index should be have the value length-1
});