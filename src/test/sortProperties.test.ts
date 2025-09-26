import assert from 'assert';
import {
	openTempDocument,
	closeAllEditors,
	extractSingleStyleAndGetText,
	extractAllStylesAndGetText,
	mockMessages,
	restoreMessages,
} from './testHelpers';
import { ConfigManager } from '../config';
import {
	sortPropertiesSingleExtract,
	sortPropertiesExtractAll,
	sortPropertiesSingleProperty,
	sortPropertiesComplexNames,
	sortPropertiesMixedNaming,
	sortPropertiesDynamicMixed,
} from './testConstants';

suite('Sort Style Properties Configuration Tests', () => {
	setup(async () => {
		mockMessages();
		await closeAllEditors();
		await ConfigManager.updateConfig('sortStyleProperties', false);
	});

	teardown(async () => {
		restoreMessages();
		await closeAllEditors();
		await ConfigManager.updateConfig('sortStyleProperties', false);
		await new Promise((resolve) => setTimeout(resolve, 50));
	});

	test('Should NOT sort style properties when sortStyleProperties is disabled (single extract)', async function () {
		this.timeout(10000); // Increase timeout for CI environments

		// Ensure config is properly disabled
		await ConfigManager.updateConfig('sortStyleProperties', false);

		// Add a small delay to ensure config is applied
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Verify config state before proceeding
		assert.strictEqual(
			ConfigManager.sortStyleProperties,
			false,
			'Config should be disabled before test'
		);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesSingleExtract,
			'backgroundColor',
			'unsortedStyle'
		);

		assert.ok(
			result && typeof result === 'string',
			'Result should be a valid string'
		);
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(
			result.includes('unsortedStyle'),
			'Should include the style name'
		);

		// Extract the style object from the result
		const styleMatch = result.match(/unsortedStyle:\s*\{([^}]+)\}/s);
		assert.ok(
			styleMatch && styleMatch[1],
			'Should find the style object with content'
		);

		const styleContent = styleMatch[1];
		const lines = styleContent
			.split(/[,\n]/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && line.includes(':'));

		// Verify we have the expected number of properties
		assert.ok(
			lines.length >= 4,
			`Should have at least 4 properties, found: ${lines.length}`
		);

		// More flexible property order checking - should maintain original order
		const propertyOrder = lines
			.map((line) => {
				if (line.includes('zIndex')) {
					return 'zIndex';
				}
				if (line.includes('backgroundColor')) {
					return 'backgroundColor';
				}
				if (line.includes('fontSize')) {
					return 'fontSize';
				}
				if (line.includes('alignItems')) {
					return 'alignItems';
				}
				return null;
			})
			.filter(Boolean);

		// Should maintain original order: zIndex, backgroundColor, fontSize, alignItems
		assert.deepStrictEqual(
			propertyOrder,
			['zIndex', 'backgroundColor', 'fontSize', 'alignItems'],
			'Properties should maintain original order when sorting is disabled'
		);
	});

	test('Should sort style properties alphabetically when sortStyleProperties is enabled (single extract)', async function () {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesSingleExtract,
			'backgroundColor',
			'sortedStyle'
		);

		// Check that properties are sorted alphabetically: alignItems, backgroundColor, fontSize, zIndex
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');

		// Extract the style object from the result
		const styleMatch = result.match(/sortedStyle:\s*\{([^}]+)\}/);
		assert.ok(styleMatch, 'Should find the style object');

		const styleContent = styleMatch[1];
		const lines = styleContent
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Should be sorted: alignItems, backgroundColor, fontSize, zIndex
		assert.ok(
			lines[0].includes('alignItems:'),
			'First property should be alignItems'
		);

		assert.ok(
			lines[1].includes('backgroundColor:'),
			'Second property should be backgroundColor'
		);

		assert.ok(
			lines[2].includes('fontSize:'),
			'Third property should be fontSize'
		);

		assert.ok(lines[3].includes('zIndex:'), 'Fourth property should be zIndex');
	});

	test('Should sort style properties alphabetically when sortStyleProperties is enabled (extract all)', async () => {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractAllStylesAndGetText(sortPropertiesExtractAll);

		// Check that both style objects have sorted properties
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');

		// Extract the first style object (View) - it's myStyle1
		const viewStyleMatch = result.match(/myStyle1:\s*\{([^}]+)\}/);
		assert.ok(viewStyleMatch, 'Should find the view style object');

		const viewStyleContent = viewStyleMatch[1];
		const viewLines = viewStyleContent
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Should be sorted: backgroundColor, padding, zIndex
		assert.ok(
			viewLines[0].includes('backgroundColor:'),
			'First property should be backgroundColor'
		);
		assert.ok(
			viewLines[1].includes('padding:'),
			'Second property should be padding'
		);
		assert.ok(
			viewLines[2].includes('zIndex:'),
			'Third property should be zIndex'
		);

		// Extract the second style object (Text) - it's myStyle2
		const textStyleMatch = result.match(/myStyle2:\s*\{([^}]+)\}/);
		assert.ok(textStyleMatch, 'Should find the text style object');

		const textStyleContent = textStyleMatch[1];
		const textLines = textStyleContent
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Should be sorted: color, fontSize, fontWeight
		assert.ok(
			textLines[0].includes('color:'),
			'First property should be color'
		);
		assert.ok(
			textLines[1].includes('fontSize:'),
			'Second property should be fontSize'
		);
		assert.ok(
			textLines[2].includes('fontWeight:'),
			'Third property should be fontWeight'
		);
	});

	test('Should handle single property correctly with sorting enabled', async () => {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesSingleProperty,
			'backgroundColor',
			'singleProp'
		);

		// Should work correctly with single property
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(
			result.includes("backgroundColor: 'red'"),
			'Should include the property'
		);
	});

	test('Should handle complex property names with sorting enabled', async () => {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesComplexNames,
			'background-color',
			'complexProps'
		);

		// Check that complex property names are sorted correctly
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');

		// Extract the style object from the result
		const styleMatch = result.match(/complexProps:\s*\{([^}]+)\}/);
		assert.ok(styleMatch, 'Should find the style object');

		const styleContent = styleMatch[1];
		const lines = styleContent
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Should be sorted alphabetically by property name
		assert.ok(
			lines[0].includes('align-items') || lines[0].includes("'align-items'"),
			'First property should be align-items'
		);
		assert.ok(
			lines[1].includes('background-color') ||
				lines[1].includes("'background-color'"),
			'Second property should be background-color'
		);
	});

	test('Should handle camelCase and kebab-case mixed properties with sorting', async () => {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesMixedNaming,
			'background-color',
			'mixedProps'
		);

		// Should handle mixed property naming conventions
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(result.includes('mixedProps'), 'Should include the style name');
	});

	test('Should preserve dynamic properties correctly when sorting is enabled', async () => {
		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);

		const result = await extractSingleStyleAndGetText(
			sortPropertiesDynamicMixed,
			'backgroundColor',
			'mixedStatic'
		);

		// Should sort static properties and preserve dynamic ones
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(
			result.includes('opacity: isVisible'),
			'Should preserve dynamic property'
		);

		// Extract the style object from the result
		const styleMatch = result.match(/mixedStatic:\s*\{([^}]+)\}/);
		assert.ok(styleMatch, 'Should find the style object');

		const styleContent = styleMatch[1];
		const lines = styleContent
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Static properties should be sorted: backgroundColor, fontSize, zIndex
		const staticProps = lines.filter((line) => !line.includes('opacity'));
		assert.ok(
			staticProps.some((line) => line.includes('backgroundColor:')),
			'Should include backgroundColor'
		);
		assert.ok(
			staticProps.some((line) => line.includes('fontSize:')),
			'Should include fontSize'
		);
		assert.ok(
			staticProps.some((line) => line.includes('zIndex:')),
			'Should include zIndex'
		);
	});

	test('Should maintain configuration state correctly', async () => {
		// Test that configuration changes persist correctly

		// Start with sorting disabled
		await ConfigManager.updateConfig('sortStyleProperties', false);
		assert.strictEqual(
			ConfigManager.sortStyleProperties,
			false,
			'Should be disabled initially'
		);

		// Enable sorting
		await ConfigManager.updateConfig('sortStyleProperties', true);
		assert.strictEqual(
			ConfigManager.sortStyleProperties,
			true,
			'Should be enabled after update'
		);

		// Disable again
		await ConfigManager.updateConfig('sortStyleProperties', false);
		assert.strictEqual(
			ConfigManager.sortStyleProperties,
			false,
			'Should be disabled after second update'
		);
	});
});
