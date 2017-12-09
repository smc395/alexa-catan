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
	var a3 = [6,8,3,5,12,6,4];

	a1 = a1.sort(function(a, b){return b - a;}); // sort list in descending order
	a3 = a3.sort(function(a, b){return b - a;});

	expect(catan.findMinIndex(a1)).toBe(4); // when there are duplicate min value, should be the first found instance
	expect(catan.findMinIndex(a2)).toBe(0);	// index should be the first index
	expect(catan.findMinIndex(a3)).toBe(6); // index should be have the value length-1
});

test('countRollListElements returns a map of roll frequencies', () => {
	var a1 = [6,7,5,2,5,3,6,6];
	var a2 = [];
	var a3 = [5];

	expect(catan.countRollListElements(a1)).toEqual({2:1,3:1,5:2,6:3,7:1});
	expect(catan.countRollListElements(a2)).toEqual({});
	expect(catan.countRollListElements(a3)).toEqual({5:1});
});

test('findMostRolledCount returns an int of the most rolled number', () => {
	var f1 = {};
	var f2 = {2:2};
	var f3 = {2:3,4:6,9:1};
	var f4 = {2:3,4:2,9:3};

	expect(catan.findMostRolledCount(f1)).toBe(0);
	expect(catan.findMostRolledCount(f2)).toBe(2);
	expect(catan.findMostRolledCount(f3)).toBe(6);
	expect(catan.findMostRolledCount(f4)).toBe(3);
});

test('findMostRolledList returns a list of the most rolled number', () => {
	var f1 = {};
	var f2 = {2:2};
	var f3 = {2:3,4:6,9:1};
	var f4 = {2:3,4:2,9:3};

	expect(catan.findMostRolledList(f1,5)).toEqual([]);
	expect(catan.findMostRolledList(f2,3)).toEqual([]);
	expect(catan.findMostRolledList(f2,2)).toEqual(["2"]);
	expect(catan.findMostRolledList(f3,1)).toEqual(["9"]);
	expect(catan.findMostRolledList(f3,6)).toEqual(["4"]);
	expect(catan.findMostRolledList(f4,3)).toEqual(["2","9"]);
});

test('findLeastRolledCount returns an int of the least rolled number', () => {
	var f1 = {};
	var f2 = {12:2};
	var f3 = {3:4,2:6,11:5};
	var f4 = {7:6,4:9,8:6};

	expect(catan.findLeastRolledCount(f1)).toBe(Infinity);
	expect(catan.findLeastRolledCount(f2)).toBe(2);
	expect(catan.findLeastRolledCount(f3)).toBe(4);
	expect(catan.findLeastRolledCount(f4)).toBe(6);
});

test('findLeastRolledList returns a list of the least rolled number', () => {
	var f1 = {};
	var f2 = {12:2};
	var f3 = {3:4,2:6,11:5};
	var f4 = {7:6,4:9,8:6};

	expect(catan.findLeastRolledList(f1,5)).toEqual([]);
	expect(catan.findLeastRolledList(f2,3)).toEqual([]);
	expect(catan.findLeastRolledList(f2,2)).toEqual(["12"]);
	expect(catan.findLeastRolledList(f3,6)).toEqual(["2"]);
	expect(catan.findLeastRolledList(f3,4)).toEqual(["3"]);
	expect(catan.findLeastRolledList(f4,6)).toEqual(["7","8"]);
});