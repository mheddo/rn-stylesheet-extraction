import * as vscode from 'vscode';
import assert from 'assert';
import { ConfigManager } from '../config';
import {
	simpleViewWithInlineStyle,
	multipleViewsWithInlineStyles,
	viewWithConflictingStyleNames,
	existingStyleSheetWithConfigurableName,
	complexConflictScenario,
	simpleViewNoStyleSheetImport,
} from './testConstants';
import {
	mockMessages,
	restoreMessages,
	closeAllEditors,
	extractSingleStyleAndGetText,
	extractAllStylesAndGetText,
	singleExtractDefaultInputBoxText,
} from './testHelpers';

suite('Configuration Tests', function () {
	vscode.window.showInformationMessage('Start configuration tests.');

	let originalConfig: any;

	setup(async function () {
		mockMessages();

		// Clear all configuration values to ensure we get true defaults
		const config = vscode.workspace.getConfiguration('rnStylesheetExtraction');
		await config.update(
			'defaultStyleName',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'preferredStyleSheetName',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'autoImportStyleSheet',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'showContextMenu',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'sortStyleProperties',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'preserveComments',
			undefined,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'extractionLocation',
			undefined,
			vscode.ConfigurationTarget.Global
		);

		originalConfig = {
			defaultStyleName: ConfigManager.defaultStyleName,
			preferredStyleSheetName: ConfigManager.preferredStyleSheetName,
			autoImportStyleSheet: ConfigManager.autoImportStyleSheet,
			showContextMenu: ConfigManager.showContextMenu,
			sortStyleProperties: ConfigManager.sortStyleProperties,
			preserveComments: ConfigManager.preserveComments,
			extractionLocation: ConfigManager.extractionLocation,
		};
	});

	teardown(async function () {
		restoreMessages();
		await closeAllEditors();
		const config = vscode.workspace.getConfiguration('rnStylesheetExtraction');
		await config.update(
			'defaultStyleName',
			originalConfig.defaultStyleName,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'preferredStyleSheetName',
			originalConfig.preferredStyleSheetName,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'autoImportStyleSheet',
			originalConfig.autoImportStyleSheet,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'showContextMenu',
			originalConfig.showContextMenu,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'sortStyleProperties',
			originalConfig.sortStyleProperties,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'preserveComments',
			originalConfig.preserveComments,
			vscode.ConfigurationTarget.Global
		);
		await config.update(
			'extractionLocation',
			originalConfig.extractionLocation,
			vscode.ConfigurationTarget.Global
		);
	});

	suite('ConfigManager Basic Functionality', function () {
		test('Should return default values when no configuration is set', () => {
			// Test default values
			assert.strictEqual(ConfigManager.defaultStyleName, 'myStyle');
			assert.strictEqual(ConfigManager.preferredStyleSheetName, 'styles');
			assert.strictEqual(ConfigManager.autoImportStyleSheet, true);
			assert.strictEqual(ConfigManager.showContextMenu, true);
			assert.strictEqual(ConfigManager.sortStyleProperties, false);
			assert.strictEqual(ConfigManager.preserveComments, true);
			assert.strictEqual(ConfigManager.extractionLocation, 'Bottom');
		});

		test('Should update and read configuration values', async () => {
			// Update configuration
			await ConfigManager.updateConfig('defaultStyleName', 'customStyle');
			await ConfigManager.updateConfig(
				'preferredStyleSheetName',
				'customStyles'
			);
			await ConfigManager.updateConfig('autoImportStyleSheet', false);
			await ConfigManager.updateConfig('showContextMenu', false);
			await ConfigManager.updateConfig('sortStyleProperties', true);
			await ConfigManager.updateConfig('preserveComments', false);
			await ConfigManager.updateConfig('extractionLocation', 'Top');

			// Verify changes
			assert.strictEqual(ConfigManager.defaultStyleName, 'customStyle');
			assert.strictEqual(ConfigManager.preferredStyleSheetName, 'customStyles');
			assert.strictEqual(ConfigManager.autoImportStyleSheet, false);
			assert.strictEqual(ConfigManager.showContextMenu, false);
			assert.strictEqual(ConfigManager.sortStyleProperties, true);
			assert.strictEqual(ConfigManager.preserveComments, false);
			assert.strictEqual(ConfigManager.extractionLocation, 'Top');
		});

		test('Should return complete config object', () => {
			const config = ConfigManager.getConfig();
			assert.ok(config.hasOwnProperty('defaultStyleName'));
			assert.ok(config.hasOwnProperty('preferredStyleSheetName'));
			assert.ok(config.hasOwnProperty('autoImportStyleSheet'));
			assert.ok(config.hasOwnProperty('showContextMenu'));
			assert.ok(config.hasOwnProperty('sortStyleProperties'));
			assert.ok(config.hasOwnProperty('preserveComments'));
			assert.ok(config.hasOwnProperty('extractionLocation'));
		});
	});

	suite('Default Style Name Configuration', function () {
		test('Should use configured defaultStyleName in single extract input box', async () => {
			// Set custom default style name
			await ConfigManager.updateConfig('defaultStyleName', 'componentStyle');

			// Test what default value is offered in input box
			const defaultValue = await singleExtractDefaultInputBoxText(
				simpleViewWithInlineStyle,
				'backgroundColor'
			);
			assert.ok(
				defaultValue?.startsWith('componentStyle'),
				'Should offer configured defaultStyleName in input box'
			);
		});

		test('Should use configured defaultStyleName in extract all command', async () => {
			// Set custom default style name
			await ConfigManager.updateConfig('defaultStyleName', 'element');

			const result = await extractAllStylesAndGetText(
				multipleViewsWithInlineStyles
			);

			// Verify both styles use the configured prefix
			assert.ok(
				result.includes('element1:'),
				'Should use configured defaultStyleName for first style'
			);
			assert.ok(
				result.includes('element2:'),
				'Should use configured defaultStyleName for second style'
			);
			assert.ok(
				result.includes('styles.element1'),
				'Should reference first configured style name'
			);
			assert.ok(
				result.includes('styles.element2'),
				'Should reference second configured style name'
			);
		});

		test('Should increment style names when conflicts exist', async () => {
			await ConfigManager.updateConfig('defaultStyleName', 'btn');

			// Test what default value is offered when conflicts exist
			const defaultValue = await singleExtractDefaultInputBoxText(
				viewWithConflictingStyleNames,
				'backgroundColor'
			);
			assert.strictEqual(
				defaultValue,
				'btn2',
				'Should skip existing btn1 and suggest btn2'
			);
		});
	});

	suite('Preferred StyleSheet Name Configuration', function () {
		test('Should use configured preferredStyleSheetName when creating new StyleSheet', async () => {
			await ConfigManager.updateConfig('preferredStyleSheetName', 'appStyles');

			const result = await extractSingleStyleAndGetText(
				simpleViewWithInlineStyle,
				'backgroundColor',
				'myStyle1'
			);

			assert.ok(
				result.includes('const appStyles = StyleSheet.create'),
				'Should create StyleSheet with configured name'
			);
			assert.ok(
				result.includes('appStyles.myStyle1'),
				'Should reference configured StyleSheet name'
			);
		});

		test('Should find existing StyleSheet with configured name', async () => {
			await ConfigManager.updateConfig(
				'preferredStyleSheetName',
				'themeStyles'
			);

			const result = await extractSingleStyleAndGetText(
				existingStyleSheetWithConfigurableName,
				'backgroundColor',
				'newStyle'
			);

			// Should add to the themeStyles instead of creating new one
			assert.ok(
				result.includes('themeStyles.newStyle'),
				'Should add to existing configured StyleSheet'
			);

			// Count occurrences of the StyleSheet declaration - should only be one
			const styleSheetDeclarations = (
				result.match(/const themeStyles = StyleSheet\.create/g) || []
			).length;
			assert.strictEqual(
				styleSheetDeclarations,
				1,
				'Should have exactly one themeStyles StyleSheet (not create duplicate)'
			);

			// Verify the new style was added to the existing StyleSheet
			assert.ok(
				result.includes('existing2: { fontSize: 16 }'),
				'Should preserve existing styles'
			);
			assert.ok(
				result.includes('newStyle: {'),
				'Should add new style to existing StyleSheet'
			);
		});

		test('Should use configured preferredStyleSheetName in extract all command', async () => {
			await ConfigManager.updateConfig(
				'preferredStyleSheetName',
				'componentStyles'
			);

			const result = await extractAllStylesAndGetText(
				multipleViewsWithInlineStyles
			);

			assert.ok(
				result.includes('const componentStyles = StyleSheet.create'),
				'Should create StyleSheet with configured name'
			);
			assert.ok(
				result.includes('componentStyles.myStyle1'),
				'Should reference configured StyleSheet name'
			);
			assert.ok(
				result.includes('componentStyles.myStyle2'),
				'Should reference configured StyleSheet name'
			);
		});
	});

	suite('Auto Import StyleSheet Configuration', function () {
		test('Should respect autoImportStyleSheet setting when true', async () => {
			await ConfigManager.updateConfig('autoImportStyleSheet', true);

			const result = await extractSingleStyleAndGetText(
				simpleViewNoStyleSheetImport,
				'backgroundColor',
				'myStyle1'
			);

			assert.ok(
				result.includes("import { View, StyleSheet } from 'react-native'"),
				'Should auto-import StyleSheet'
			);
		});

		test('Should respect autoImportStyleSheet setting when false', async () => {
			await ConfigManager.updateConfig('autoImportStyleSheet', false);

			const result = await extractSingleStyleAndGetText(
				simpleViewNoStyleSheetImport,
				'backgroundColor',
				'myStyle1'
			);

			// Should not modify the import when autoImportStyleSheet is false
			assert.ok(
				result.includes("import { View } from 'react-native'"),
				'Should not auto-import StyleSheet'
			);
			assert.ok(
				!result.includes("import { View, StyleSheet } from 'react-native'"),
				'Should not modify import'
			);
		});
	});

	suite('Combined Configuration Tests', function () {
		test('Should use all configurations together correctly', async () => {
			// Set all custom configurations
			await ConfigManager.updateConfig('defaultStyleName', 'btn');
			await ConfigManager.updateConfig(
				'preferredStyleSheetName',
				'buttonStyles'
			);
			await ConfigManager.updateConfig('autoImportStyleSheet', true);

			const result = await extractAllStylesAndGetText(
				multipleViewsWithInlineStyles
			);

			// Verify all configurations are applied
			assert.ok(
				result.includes("import { View, StyleSheet } from 'react-native'"),
				'Should auto-import StyleSheet'
			);
			assert.ok(
				result.includes('const buttonStyles = StyleSheet.create'),
				'Should use configured StyleSheet name'
			);
			assert.ok(
				result.includes('btn1:'),
				'Should use configured default style name'
			);
			assert.ok(
				result.includes('btn2:'),
				'Should use configured default style name'
			);
			assert.ok(
				result.includes('buttonStyles.btn1'),
				'Should reference with both configured names'
			);
			assert.ok(
				result.includes('buttonStyles.btn2'),
				'Should reference with both configured names'
			);
		});

		test('Should handle complex existing StyleSheet scenarios with configurations', async () => {
			await ConfigManager.updateConfig('defaultStyleName', 'item');
			await ConfigManager.updateConfig('preferredStyleSheetName', 'listStyles');

			// Test that it suggests the correct next available name
			const defaultValue = await singleExtractDefaultInputBoxText(
				complexConflictScenario,
				'backgroundColor'
			);
			assert.strictEqual(
				defaultValue,
				'item3',
				'Should suggest item3 since item1, item2, item4 exist'
			);

			const result = await extractSingleStyleAndGetText(
				complexConflictScenario,
				'backgroundColor',
				'item3'
			);

			// Should add to existing listStyles and use correct naming
			assert.ok(
				result.includes('listStyles.item3'),
				'Should add to configured existing StyleSheet'
			);
			assert.ok(
				result.includes('item3:'),
				'Should use available name following configured pattern'
			);
		});
	});
});
