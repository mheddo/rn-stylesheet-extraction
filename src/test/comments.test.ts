import assert from 'assert';
import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import {
	extractSingleStyleAndGetText,
	extractAllStylesAndGetText,
	closeAllEditors,
	mockMessages,
	restoreMessages,
} from './testHelpers';
import {
	sourceCodeWithInlineComments,
	sourceCodeWithSimpleBlockComments,
	sourceCodeWithMixedCommentTypesSimple,
	sourceCodeWithCommentsInComplexExpressions,
	sourceCodeWithCommentsAtStart,
	sourceCodeWithCommentsAtEnd,
	sourceCodeWithCommentsBetweenProperties,
	sourceCodeWithMultipleInlineComments,
	sourceCodeWithNestedBlockComments,
	sourceCodeWithCommentsWithSpecialChars,
	sourceCodeWithVariousCommentPlacements,
	sourceCodeWithEmptyCommentsAndWhitespace,
} from './testConstants';

suite('Comment Handling Tests', function () {
	vscode.window.showInformationMessage('Start comment handling tests.');

	suiteSetup(async function () {
		await ConfigManager.updateConfig('preserveComments', true);
	});

	suiteTeardown(async function () {
		await ConfigManager.updateConfig('preserveComments', true);
	});

	setup(function () {
		mockMessages();
	});

	teardown(async function () {
		restoreMessages();
		await closeAllEditors();
	});

	test('Extract single style with inline comments', async () => {
		const sourceCode = sourceCodeWithInlineComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'Should reference the extracted style'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'Should create the style in StyleSheet'
		);

		assert.ok(
			newText.includes('// This is a comment before backgroundColor'),
			'Should preserve comment before backgroundColor'
		);
		assert.ok(
			newText.includes('// Inline comment'),
			'Should preserve inline comment'
		);
		assert.ok(
			newText.includes('// Comment before margin'),
			'Should preserve comment before margin'
		);

		const inlineStyleMatch = newText.match(/style=\{[^}]+\}/);
		if (inlineStyleMatch) {
			assert.ok(
				!inlineStyleMatch[0].includes('//'),
				'Inline style should not contain comments'
			);
		}
	});

	test('Extract single style with block comments', async () => {
		const sourceCode = sourceCodeWithSimpleBlockComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'Should reference the extracted style'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'Should create the style in StyleSheet'
		);

		assert.ok(
			newText.includes('/* This is a block comment */'),
			'Should preserve block comment'
		);
		assert.ok(
			newText.includes('/* Multi-line'),
			'Should preserve multi-line block comment start'
		);
		assert.ok(
			newText.includes('block comment */'),
			'Should preserve multi-line block comment end'
		);
		assert.ok(
			newText.includes('/* inline block comment */'),
			'Should preserve inline block comment'
		);
	});

	test('Extract all styles with mixed comment types', async () => {
		const sourceCode = sourceCodeWithMixedCommentTypesSimple;

		const newText = await extractAllStylesAndGetText(sourceCode);

		assert.ok(newText.includes('myStyle1: {'), 'Should create first style');
		assert.ok(newText.includes('myStyle2: {'), 'Should create second style');

		assert.ok(
			newText.includes('// Comment for first style'),
			'Should preserve first style comment'
		);
		assert.ok(
			newText.includes('// Inline comment'),
			'Should preserve inline comment'
		);
		assert.ok(
			newText.includes('/* Block comment for second style */'),
			'Should preserve block comment'
		);

		assert.ok(
			!newText.includes('style={{') ||
				(!newText.match(/style=\{[^}]*\/\//g) &&
					!newText.match(/style=\{[^}]*\/\*/g)),
			'Inline styles should not contain comments'
		);
	});

	test('Extract styles with comments in complex expressions', async () => {
		const sourceCode = sourceCodeWithCommentsInComplexExpressions;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract static property'
		);

		assert.ok(
			newText.includes('/* Static background */'),
			'Should preserve comment for static property'
		);

		assert.ok(
			newText.includes('padding: 10 + 5'),
			'Should keep dynamic property inline'
		);
		assert.ok(
			newText.includes('width: Math.max(100, 200)'),
			'Should keep complex expression inline'
		);
	});

	test('Extract styles with comments at the start of style block', async () => {
		const sourceCode = sourceCodeWithCommentsAtStart;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should preserve comments at the start
		assert.ok(
			newText.includes('// Header comment for the entire style block'),
			'Should preserve single-line comment at start'
		);
		assert.ok(
			newText.includes('/* Multi-line comment at the very beginning'),
			'Should preserve multi-line comment at start'
		);
		assert.ok(
			newText.includes('describing this style object */'),
			'Should preserve end of multi-line comment'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
	});

	test('Extract styles with comments at the end of style block', async () => {
		const sourceCode = sourceCodeWithCommentsAtEnd;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should preserve comments at the end
		assert.ok(
			newText.includes('// Footer comment at the end'),
			'Should preserve single-line comment at end'
		);
		assert.ok(
			newText.includes('/* Multi-line footer comment'),
			'Should preserve multi-line comment at end'
		);
		assert.ok(
			newText.includes('at the very end of the style block */'),
			'Should preserve end of multi-line comment'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
	});

	test('Extract styles with comments between properties', async () => {
		const sourceCode = sourceCodeWithCommentsBetweenProperties;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should preserve all comments
		assert.ok(
			newText.includes('// Comment between properties'),
			'Should preserve single-line comment between properties'
		);
		assert.ok(
			newText.includes('/* Block comment between properties'),
			'Should preserve block comment between properties'
		);
		assert.ok(
			newText.includes('with multiple lines */'),
			'Should preserve end of block comment'
		);
		assert.ok(
			newText.includes('// Another comment'),
			'Should preserve another comment'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
		assert.ok(
			newText.includes('borderRadius: 8'),
			'Should extract borderRadius'
		);
	});

	test('Extract styles with multiple inline comments on same property', async () => {
		const sourceCode = sourceCodeWithMultipleInlineComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should preserve inline comments (at least one per property)
		assert.ok(
			newText.includes('// Primary color') ||
				newText.includes('/* Brand color */'),
			'Should preserve backgroundColor comment'
		);
		assert.ok(
			newText.includes('// Standard padding'),
			'Should preserve padding comment'
		);
		assert.ok(
			newText.includes('/* Margin value */'),
			'Should preserve margin comment'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
	});

	test('Extract styles with nested block comments', async () => {
		const sourceCode = sourceCodeWithNestedBlockComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'blue'",
			'myStyle1'
		);

		// Should preserve the complex block comments
		assert.ok(
			newText.includes('/* Outer comment start'),
			'Should preserve start of nested comment'
		);
		assert.ok(
			newText.includes('This is still part of the comment'),
			'Should preserve middle of nested comment'
		);
		assert.ok(
			newText.includes('/* Another block comment'),
			'Should preserve another block comment'
		);
		assert.ok(
			newText.includes('describing the padding */'),
			'Should preserve end of block comment'
		);

		// Should extract the correct properties (not the commented out ones)
		assert.ok(
			newText.includes("backgroundColor: 'blue'"),
			'Should extract the correct backgroundColor'
		);
		assert.ok(
			!newText.includes("backgroundColor: 'red'") ||
				newText.indexOf("backgroundColor: 'red'") > newText.indexOf('/*'),
			'Should not extract commented out backgroundColor as property'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
	});

	test('Extract styles with comments containing special characters', async () => {
		const sourceCode = sourceCodeWithCommentsWithSpecialChars;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should preserve comments with special characters
		assert.ok(
			newText.includes('// TODO: Fix this @author John Doe #123'),
			'Should preserve comment with special characters'
		);
		assert.ok(
			newText.includes('/* NOTE: This value is calculated as:'),
			'Should preserve complex block comment'
		);
		assert.ok(
			newText.includes('See: https://example.com/docs */'),
			'Should preserve URL in comment'
		);
		assert.ok(
			newText.includes("// WARNING! Don't change this value!!!"),
			'Should preserve comment with exclamation marks'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
	});

	test('Extract all styles with various comment placements', async () => {
		const sourceCode = sourceCodeWithVariousCommentPlacements;

		const newText = await extractAllStylesAndGetText(sourceCode);

		// Should create all three styles
		assert.ok(newText.includes('myStyle1: {'), 'Should create first style');
		assert.ok(newText.includes('myStyle2: {'), 'Should create second style');
		assert.ok(newText.includes('myStyle3: {'), 'Should create third style');

		// Should preserve comments from all style blocks
		assert.ok(
			newText.includes('// First style block comment'),
			'Should preserve first block comment'
		);
		assert.ok(
			newText.includes('// Inline comment 1'),
			'Should preserve first inline comment'
		);
		assert.ok(
			newText.includes('/* Second style block comment */'),
			'Should preserve second block comment'
		);
		assert.ok(
			newText.includes('// End comment for second block'),
			'Should preserve end comment'
		);
		assert.ok(
			newText.includes('/* Inline block comment */'),
			'Should preserve inline block comment'
		);
		assert.ok(
			newText.includes('// Comment before last property'),
			'Should preserve last comment'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes("color: 'blue'"), 'Should extract color');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
		assert.ok(
			newText.includes('borderRadius: 8'),
			'Should extract borderRadius'
		);
		assert.ok(newText.includes('fontSize: 16'), 'Should extract fontSize');
	});

	test('Extract styles with empty comments and whitespace', async () => {
		const sourceCode = sourceCodeWithEmptyCommentsAndWhitespace;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		assert.ok(
			newText.includes('myStyle1: {'),
			'Should create the style despite empty comments'
		);

		// Should extract all static properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
		assert.ok(
			newText.includes('borderRadius: 8'),
			'Should extract borderRadius'
		);
	});
});
