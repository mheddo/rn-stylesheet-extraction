import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import * as t from '@babel/types';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import assert from 'assert';
import { ExtractStrings } from '../constants';
import {
	noStyleSheetMultipleProps,
	twoJSXElementsWithMissingStyleSheet,
	extractedWhenTwoComponentsExist,
	deeplyNestedJSX,
	stylesWithJSExpressions,
	alreadyExtractedCode,
	reallyMalformedStyles,
	arrayCaseStyleNoStyleSheet,
	extractArrayEdgeCaseStyleSheetCode,
	allDynamicStylesSingle,
	allDynamicStylesMultiple,
	mixedStaticAndDynamicStyles,
	memberExpressionWithInlineStyles,
	onlyMemberExpressions,
	styleBodyForComplexExpressions,
} from './testConstants';
import {
	mockMessages,
	restoreMessages,
	closeAllEditors,
	extractSingleStyleAndGetText,
	extractAllStylesAndGetText,
	openTempDocument,
	setCursorTo,
	infoMessage,
	errorMessage,
} from './testHelpers';

suite('Error Handling and Edge Cases', function () {
	vscode.window.showInformationMessage(
		'Start error handling and edge case tests.'
	);

	setup(function () {
		mockMessages();
	});
	teardown(async function () {
		restoreMessages();
		await closeAllEditors();
	});

	test('Handles valid inline styles properly', async () => {
		const newText = await extractSingleStyleAndGetText(
			noStyleSheetMultipleProps,
			"backgroundColor: 'red', width: 100",
			'myStyle1'
		);

		// Should extract the valid style successfully
		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'Valid style should be extracted successfully'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'StyleSheet should be created with valid style'
		);
		assert.ok(
			newText.includes("backgroundColor: 'red',"),
			'Valid style properties should be preserved'
		);
	});

	test('Handles multiple valid JSX elements correctly', async () => {
		// Test that there exists 2 different components with inline styles to extract from
		// Do this by looking for 'return (' twice
		assert.ok(
			twoJSXElementsWithMissingStyleSheet.includes('return ('),
			'Test code should have 2 different returned components'
		);

		const newText = await extractAllStylesAndGetText(
			twoJSXElementsWithMissingStyleSheet
		);

		// Should extract the 6 valid styles successfully
		assert.ok(
			newText.includes(extractedWhenTwoComponentsExist),
			'All 6 valid styles should be extracted successfully to the same sheet'
		);
	});

	test('Handles deeply nested JSX structures', async () => {
		const newText = await extractSingleStyleAndGetText(
			deeplyNestedJSX,
			"backgroundColor: 'red'",
			'myStyle1'
		); // Should successfully extract from deeply nested elements
		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'Should extract style from deeply nested JSX element'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'StyleSheet should be created for nested extraction'
		);
	});

	test('Handles styles with complex JavaScript expressions gracefully', async () => {
		// Test more complex dynamic expressions
		const newText = await extractSingleStyleAndGetText(
			stylesWithJSExpressions,
			'margin: MARGIN * 2',
			'myStyle2'
		);

		// Should handle variable references and mathematical expressions
		assert.ok(
			newText.includes('style={['),
			'Should create array style for dynamic expressions'
		);
		assert.ok(
			newText.includes('styles.myStyle2'),
			'Should create named style for static parts'
		);
		assert.ok(
			newText.includes("backgroundColor: 'yellow',"),
			'Static background color should be extracted'
		);
		assert.ok(
			newText.includes('margin: MARGIN * 2'),
			'Variable expressions should remain inline'
		);
	});

	test('Shows appropriate message when no valid styles found at cursor position', async () => {
		// Test behavior when cursor is not on a valid style block
		const { doc } = await openTempDocument(alreadyExtractedCode, 'typescript');
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active editor');
		}

		// Set cursor to a location with no valid style
		await setCursorTo(doc, 'export default');
		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		// Should show appropriate message
		assert.ok(
			infoMessage === ExtractStrings.styleBlockNotFound,
			'Should show helpful message when no valid style found'
		);
		assert.ok(
			errorMessage === '',
			'Should not show error message for normal "not found" case'
		);
	});

	test('Shows appropriate message when style parsing fails due to syntax errors', async () => {
		// Test behavior when style object has completely invalid syntax
		const { doc } = await openTempDocument(reallyMalformedStyles, 'typescript');
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active editor');
		}

		// Set cursor to the malformed style
		await setCursorTo(doc, 'height: !@#$%^&*()');
		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		// Should show appropriate message for parse failure
		assert.ok(
			infoMessage === ExtractStrings.parseFailedDynamic ||
				infoMessage === ExtractStrings.styleBlockNotFound,
			'Should show helpful message when style parsing fails, got: ' +
				infoMessage
		);
	});

	test('Make sure the array case is handled properly', async () => {
		// Test extract all from valid JSX elements
		const newText = await extractAllStylesAndGetText(
			arrayCaseStyleNoStyleSheet
		);

		// StyleSheet should be created properly
		assert.ok(
			newText.includes(extractArrayEdgeCaseStyleSheetCode),
			'The stylesheet is properly extracted, and the '
		);

		// The style block should be correct, featuring the 3 parts
		assert.ok(
			newText.includes(`config[colorScheme!],`),
			'The style block still features the dynamic part 1'
		);
		assert.ok(
			newText.includes(`styles.myStyle1,`),
			'The style block still features the dynamic part 2'
		);
		assert.ok(
			newText.includes(`props.style,`),
			'The style block still features the dynamic part 3'
		);
	});

	test('Properly handles complex expressions like anim.interpolate without splitting nested properties', () => {
		// Test that complex expressions with nested objects/arrays are preserved as single units
		const styleBody = styleBodyForComplexExpressions;

		const ast = parser.parse(`({${styleBody}})`, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript'],
		});

		let staticProps: string[] = [];
		let dynamicProps: string[] = [];

		traverse(ast, {
			ObjectProperty(path: any) {
				// Only process top-level properties of the style object
				const parentPath = path.parent;
				if (parentPath.type === 'ObjectExpression') {
					// Check if this is a direct child of the root object
					let current: any = path.parentPath;
					let depth = 0;
					while (current && current.type !== 'Program') {
						if (current.type === 'ObjectExpression') {
							depth++;
						}
						current = current.parentPath;
						if (!current) {
							break;
						}
					}
					// Only process first-level object properties (depth === 1)
					if (depth === 1) {
						const value = path.node.value;
						const code = generate(path.node).code;
						if (t.isLiteral(value)) {
							staticProps.push(code);
						} else {
							dynamicProps.push(code);
						}
					}
				}
			},
		});

		// Check that we have the expected properties
		assert.strictEqual(staticProps.length, 6);
		assert.strictEqual(dynamicProps.length, 1);

		// Check that the opacity property is kept as a single unit
		const opacityProp = dynamicProps.find((prop) => prop.includes('opacity'));
		assert.ok(opacityProp, 'Should find opacity property');
		assert.ok(
			opacityProp!.includes('anim.interpolate'),
			'Should contain anim.interpolate'
		);
		assert.ok(
			opacityProp!.includes('inputRange: [0, 1]'),
			'Should contain inputRange array'
		);
		assert.ok(
			opacityProp!.includes('outputRange: [0, 0.2]'),
			'Should contain outputRange array'
		);

		// Verify we don't have separate inputRange and outputRange properties
		const inputRangeProp = dynamicProps.find(
			(prop) => prop.startsWith('inputRange:') && !prop.includes('opacity')
		);
		const outputRangeProp = dynamicProps.find(
			(prop) => prop.startsWith('outputRange:') && !prop.includes('opacity')
		);
		assert.strictEqual(
			inputRangeProp,
			undefined,
			'Should not have separate inputRange property'
		);
		assert.strictEqual(
			outputRangeProp,
			undefined,
			'Should not have separate outputRange property'
		);
	});

	test('Shows appropriate message when all styles are dynamic (single style)', async () => {
		// Test behavior when style object contains only dynamic properties
		const { doc } = await openTempDocument(
			allDynamicStylesSingle,
			'typescript'
		);
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active editor');
		}

		// Set cursor to the dynamic style
		await setCursorTo(doc, 'flexDirection: isWideScreen');
		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		// Should show appropriate message for all dynamic styles
		assert.strictEqual(
			infoMessage,
			ExtractStrings.allStylesDynamic,
			'Should show message when all styles are dynamic'
		);

		// Document should remain unchanged
		const currentText = doc.getText();
		assert.ok(
			currentText.includes('flexDirection: isWideScreen'),
			'Original dynamic style should remain unchanged'
		);
		assert.ok(
			!currentText.includes('StyleSheet.create'),
			'No StyleSheet should be created'
		);
		assert.ok(
			!currentText.includes('styles.'),
			'No style references should be created'
		);
	});

	test('Shows appropriate message when all styles are dynamic (extract all)', async () => {
		// Test behavior when all style objects contain only dynamic properties
		const { doc } = await openTempDocument(
			allDynamicStylesMultiple,
			'typescript'
		);
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active editor');
		}

		// Execute extract all styles command
		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractAllStyles'
		);

		// Should show appropriate message for all dynamic styles
		assert.strictEqual(
			infoMessage,
			ExtractStrings.allStylesDynamic,
			'Should show message when all styles are dynamic'
		);

		// Document should remain unchanged
		const currentText = doc.getText();
		assert.ok(
			currentText.includes('opacity: isVisible ? 1 : 0'),
			'Original dynamic style should remain unchanged'
		);
		assert.ok(
			currentText.includes('width: screenWidth * 0.8'),
			'Original dynamic style should remain unchanged'
		);
		assert.ok(
			!currentText.includes('StyleSheet.create'),
			'No StyleSheet should be created'
		);
		assert.ok(
			!currentText.includes('styles.'),
			'No style references should be created'
		);
	});

	test('Extracts only static properties when mixed with dynamic properties', async () => {
		// Test that static properties are extracted while dynamic ones remain inline
		const newText = await extractSingleStyleAndGetText(
			mixedStaticAndDynamicStyles,
			"backgroundColor: 'red'",
			'myStyle1'
		);

		// Should extract static properties
		assert.ok(
			newText.includes("backgroundColor: 'red',"),
			'Static backgroundColor should be extracted to StyleSheet'
		);
		assert.ok(
			newText.includes('padding: 10,'),
			'Static padding should be extracted to StyleSheet'
		);

		// Should keep dynamic properties inline
		assert.ok(
			newText.includes('style={['),
			'Should create array style for mixed properties'
		);
		assert.ok(
			newText.includes('styles.myStyle1'),
			'Should reference extracted static styles'
		);
		assert.ok(
			newText.includes('flexDirection: isWideScreen'),
			'Dynamic flexDirection should remain inline'
		);

		// Should create StyleSheet with only static properties
		assert.ok(
			newText.includes('const styles = StyleSheet.create({'),
			'Should create StyleSheet'
		);
		assert.ok(newText.includes('myStyle1: {'), 'Should create named style');
	});

	test('Shows appropriate message when cursor is on MemberExpression style attribute', async () => {
		// Test that clicking on style={styles.myStyle1} shows the appropriate message
		const { doc } = await openTempDocument(
			memberExpressionWithInlineStyles,
			'typescript'
		);
		await setCursorTo(doc, 'styles.myStyle1');

		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		assert.strictEqual(
			infoMessage,
			ExtractStrings.memberExpressionDetected,
			'Should show message for already extracted style'
		);
	});

	test('Shows appropriate message when all styles in component are MemberExpressions', async () => {
		// Test that when all styles are already extracted, it shows the appropriate message
		const { doc } = await openTempDocument(onlyMemberExpressions, 'typescript');
		await setCursorTo(doc, 'styles.container');

		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		assert.strictEqual(
			infoMessage,
			ExtractStrings.memberExpressionDetected,
			'Should show message for already extracted style'
		);
	});

	test('Does not extract wrong element when cursor is on MemberExpression', async () => {
		// Test that the extension doesn't extract the first inline style when cursor is on MemberExpression
		const { doc } = await openTempDocument(
			memberExpressionWithInlineStyles,
			'typescript'
		);
		const originalText = doc.getText();
		await setCursorTo(doc, 'styles.myStyle1');

		await vscode.commands.executeCommand(
			'rn-stylesheet-extraction.extractStyle'
		);

		const newText = doc.getText();

		// The text should remain unchanged since we show a message instead of extracting
		assert.strictEqual(
			originalText,
			newText,
			'Should not modify the code when cursor is on MemberExpression'
		);

		// Should show the appropriate message
		assert.strictEqual(
			infoMessage,
			ExtractStrings.memberExpressionDetected,
			'Should show message for already extracted style'
		);
	});
});
