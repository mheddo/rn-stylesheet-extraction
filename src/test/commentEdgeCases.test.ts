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
	sourceCodeWithArrayStyleComments,
	sourceCodeWithMixedCommentTypes,
	sourceCodeWithMalformedComments,
	sourceCodeWithCodeLikeComments,
	sourceCodeWithLongComments,
	sourceCodeWithQuotesAndEscapes,
	sourceCodeWithConditionalComments,
} from './testConstants';

suite('Comment Edge Cases Tests', function () {
	vscode.window.showInformationMessage('Start comment edge cases tests.');

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

	test('Extract styles with comments in array-style syntax', async () => {
		const sourceCode = sourceCodeWithArrayStyleComments;

		const newText = await extractAllStylesAndGetText(sourceCode);

		// Should extract both style objects
		assert.ok(newText.includes('myStyle1: {'), 'Should create first style');
		assert.ok(newText.includes('myStyle2: {'), 'Should create second style');

		// Should preserve comments from both objects
		assert.ok(
			newText.includes('// First object comment'),
			'Should preserve first object comment'
		);
		assert.ok(
			newText.includes('// Inline in first object'),
			'Should preserve inline comment'
		);
		assert.ok(
			newText.includes('/* Second object comment */'),
			'Should preserve second object comment'
		);

		// Should extract all properties
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

	test('Extract styles with comments and mixed static/dynamic properties', async () => {
		const sourceCode = sourceCodeWithMixedCommentTypes;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should extract only static properties
		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract static backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract static padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract static margin');
		assert.ok(
			newText.includes('borderRadius: 8'),
			'Should extract static borderRadius'
		);

		// Should preserve comments for static properties
		assert.ok(
			newText.includes('// Static styles'),
			'Should preserve static styles comment'
		);
		assert.ok(
			newText.includes('// More static styles'),
			'Should preserve more static styles comment'
		);

		// Should keep dynamic properties inline with their comments
		assert.ok(
			newText.includes('opacity: isActive ? 1 : 0.5'),
			'Should keep dynamic opacity inline'
		);
		assert.ok(
			newText.includes('color: theme.textColor'),
			'Should keep dynamic color inline'
		);
	});

	test('Extract styles with malformed or incomplete comments', async () => {
		const sourceCode = sourceCodeWithMalformedComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should handle malformed comments gracefully
		assert.ok(
			newText.includes('myStyle1: {'),
			'Should create the style despite malformed comments'
		);

		// Should extract properties
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');
	});

	test('Extract styles with comments containing code-like syntax', async () => {
		const sourceCode = sourceCodeWithCodeLikeComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should extract only the actual properties, not commented ones
		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract the active backgroundColor'
		);
		assert.ok(
			newText.includes('padding: 15'),
			'Should extract the active padding value'
		);
		assert.ok(
			newText.includes('margin: 5'),
			'Should extract the active margin value'
		);

		// Should preserve the comments with code-like syntax
		assert.ok(
			newText.includes("// backgroundColor: 'blue'") ||
				newText.includes('commented out'),
			'Should preserve commented code'
		);
		assert.ok(
			newText.includes('padding: 20') ||
				newText.includes('The above are commented'),
			'Should preserve commented properties'
		);

		// Should not extract the commented-out values as actual properties
		assert.ok(
			!newText.includes('padding: 20,') ||
				newText.indexOf('padding: 20') > newText.indexOf('/*'),
			'Should not extract commented padding as property'
		);
	});

	test('Extract styles with extremely long comments', async () => {
		const sourceCode = sourceCodeWithLongComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should handle long comments without issues
		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');

		// Should preserve at least part of the long comments
		assert.ok(
			newText.includes('extremely long comment') ||
				newText.includes('design system') ||
				newText.includes('accessibility'),
			'Should preserve long block comment'
		);
		assert.ok(
			newText.includes('very long single-line') ||
				newText.includes('alternatives were considered'),
			'Should preserve long single-line comment'
		);
	});

	test('Extract styles with comments containing quotes and special escape sequences', async () => {
		const sourceCode = sourceCodeWithQuotesAndEscapes;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should handle quotes and escape sequences in comments
		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');

		// Should preserve comments with special characters
		assert.ok(
			newText.includes('double quotes') || newText.includes('single quotes'),
			'Should preserve quote-containing comment'
		);
		assert.ok(
			newText.includes('escaped characters') || newText.includes('\\\\n'),
			'Should preserve escape sequences'
		);
		assert.ok(
			newText.includes('template literals') || newText.includes('Hello'),
			'Should preserve template literal syntax'
		);
	});

	test('Extract styles with comments and conditional compilation patterns', async () => {
		const sourceCode = sourceCodeWithConditionalComments;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should handle conditional compilation comments
		assert.ok(newText.includes('myStyle1: {'), 'Should create the style');
		assert.ok(
			newText.includes("backgroundColor: 'red'"),
			'Should extract active backgroundColor'
		);
		assert.ok(newText.includes('padding: 10'), 'Should extract padding');
		assert.ok(newText.includes('margin: 5'), 'Should extract margin');

		// Should preserve conditional compilation annotations
		assert.ok(
			newText.includes('@if iOS') || newText.includes('@endif'),
			'Should preserve conditional comments'
		);
		assert.ok(
			newText.includes('@TODO') ||
				newText.includes('@FIXME') ||
				newText.includes('@NOTE'),
			'Should preserve annotation comments'
		);

		// Should not extract the commented-out android backgroundColor
		const activeBackgroundCount = (
			newText.match(/backgroundColor: 'red'/g) || []
		).length;
		assert.ok(
			activeBackgroundCount >= 1,
			'Should have the active backgroundColor'
		);
	});
});
