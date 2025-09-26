import assert from 'assert';
import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import {
	extractionLocationBasicComponent,
	extractionLocationWithImports,
	extractionLocationEmptyFile,
	extractionLocationComplexComponent,
	extractionLocationNoImportsCode,
	extractionLocationSingleImportCode,
	extractionLocationMultilineImportCode,
} from './testConstants';
import {
	closeAllEditors,
	mockMessages,
	restoreMessages,
	openTempDocument,
	setCursorTo,
	getDocumentText,
} from './testHelpers';

async function executeExtractionAndGetResult(
	documentText: string,
	cursorAtText: string
): Promise<string> {
	const { doc } = await openTempDocument(documentText, 'typescript');
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('No active editor');
	}
	await setCursorTo(doc, cursorAtText);
	vscode.window.showInputBox = () => Promise.resolve('myStyle');
	await vscode.commands.executeCommand('rn-stylesheet-extraction.extractStyle');

	return await getDocumentText(doc);
}

async function executeBulkExtractionAndGetResult(
	documentText: string
): Promise<string> {
	const { doc } = await openTempDocument(documentText, 'typescript');
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('No active editor');
	}
	await vscode.commands.executeCommand(
		'rn-stylesheet-extraction.extractAllStyles'
	);

	return await getDocumentText(doc);
}

suite('Extraction Location Configuration Tests', () => {
	let originalConfig: string;

	suiteSetup(() => {
		// Store original config
		originalConfig = ConfigManager.extractionLocation;
	});

	suiteTeardown(async () => {
		// Restore original config
		await vscode.workspace
			.getConfiguration('rnStylesheetExtraction')
			.update(
				'extractionLocation',
				originalConfig,
				vscode.ConfigurationTarget.Global
			);
	});

	setup(() => {
		mockMessages();
	});

	teardown(async () => {
		restoreMessages();
		await closeAllEditors();
	});

	suite('Single Style Extraction', () => {
		test('should place StyleSheet at bottom by default', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'Bottom',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationBasicComponent,
				'backgroundColor'
			);

			// StyleSheet should be at the end of the file
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			const componentEndIndex = lines.findIndex((line) => line.trim() === '}');

			// StyleSheet should be after the component definition
			assert.ok(
				styleSheetLineIndex > componentEndIndex,
				`StyleSheet should be after the component. StyleSheet at line ${styleSheetLineIndex}, component ends at ${componentEndIndex}`
			);
		}).timeout(5000);

		test('should place StyleSheet at top when configured', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update('extractionLocation', 'Top', vscode.ConfigurationTarget.Global);

			const result = await executeExtractionAndGetResult(
				extractionLocationBasicComponent,
				'backgroundColor'
			);

			// StyleSheet should be at the beginning of the file
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			assert.ok(
				styleSheetLineIndex <= 2,
				'StyleSheet should be at the top of the file'
			);
		}).timeout(5000);

		test('should place StyleSheet after imports when configured', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationWithImports,
				'backgroundColor'
			);

			// StyleSheet should be after imports but before component
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');

			// Find the last import line
			let lastImportIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].trim().startsWith('import')) {
					lastImportIndex = i;
				}
			}

			// Find the StyleSheet line
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);

			// Find the component definition
			const componentLineIndex = lines.findIndex((line) =>
				line.includes('export default function App()')
			);

			assert.ok(lastImportIndex >= 0, 'Should find import statements');
			assert.ok(
				styleSheetLineIndex > lastImportIndex,
				'StyleSheet should be after imports'
			);
			assert.ok(
				styleSheetLineIndex < componentLineIndex,
				'StyleSheet should be before component definition'
			);
		}).timeout(5000);

		test('should handle file with no imports for afterImports setting', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationEmptyFile,
				'backgroundColor'
			);

			// The extractionLocationEmptyFile actually HAS imports, so StyleSheet should be after them
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);

			// Find the last import line
			let lastImportIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].trim().startsWith('import')) {
					lastImportIndex = i;
				}
			}

			assert.ok(lastImportIndex >= 0, 'Should find import statements');
			assert.ok(
				styleSheetLineIndex > lastImportIndex,
				`StyleSheet should be after imports. StyleSheet at ${styleSheetLineIndex}, last import at ${lastImportIndex}`
			);
		}).timeout(5000);

		test('should handle file with truly no imports for afterImports setting', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationNoImportsCode,
				'backgroundColor'
			);

			// When no imports exist, should default to top
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);

			assert.ok(
				styleSheetLineIndex <= 3,
				`StyleSheet should be at the top when no imports exist. Found at line ${styleSheetLineIndex}`
			);
		}).timeout(5000);
	});

	suite('Bulk Style Extraction', () => {
		test('should place StyleSheet at bottom for bulk extraction', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'Bottom',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeBulkExtractionAndGetResult(
				extractionLocationComplexComponent
			);

			// StyleSheet should be at the end of the file
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			const helperFunctionIndex = lines.findIndex((line) =>
				line.includes('const helperFunction = () => {')
			);

			// StyleSheet should be after the helper function (at the end)
			assert.ok(
				styleSheetLineIndex > helperFunctionIndex,
				'StyleSheet should be after other content'
			);
		});

		test('should place StyleSheet at top for bulk extraction', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update('extractionLocation', 'Top', vscode.ConfigurationTarget.Global);

			const result = await executeBulkExtractionAndGetResult(
				extractionLocationComplexComponent
			);

			// StyleSheet should be at the beginning of the file
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			assert.ok(
				styleSheetLineIndex <= 2,
				'StyleSheet should be at the top of the file'
			);
		});

		test('should place StyleSheet after imports for bulk extraction', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeBulkExtractionAndGetResult(
				extractionLocationComplexComponent
			);

			// StyleSheet should be after imports but before constants and component
			assert.strictEqual(
				result.includes('const styles = StyleSheet.create({'),
				true,
				'StyleSheet should be created'
			);
			const lines = result.split('\n');

			// Find the last import line
			let lastImportIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].trim().startsWith('import')) {
					lastImportIndex = i;
				}
			}

			// Find the StyleSheet line
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);

			// Find the constants definition
			const constantsLineIndex = lines.findIndex((line) =>
				line.includes('const CONSTANTS = {')
			);

			assert.ok(lastImportIndex >= 0, 'Should find import statements');
			assert.ok(
				styleSheetLineIndex > lastImportIndex,
				'StyleSheet should be after imports'
			);
			assert.ok(
				styleSheetLineIndex < constantsLineIndex,
				'StyleSheet should be before constants definition'
			);
		});
	});

	suite('Edge Cases', () => {
		test('should handle single import line correctly', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationSingleImportCode,
				'backgroundColor'
			);

			const lines = result.split('\n');
			const importLineIndex = lines.findIndex((line) =>
				line.includes("import React from 'react';")
			);
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			const componentLineIndex = lines.findIndex((line) =>
				line.includes('export default function App()')
			);

			assert.ok(
				styleSheetLineIndex > importLineIndex,
				'StyleSheet should be after import'
			);
			assert.ok(
				styleSheetLineIndex < componentLineIndex,
				'StyleSheet should be before component'
			);
		}).timeout(5000);

		test('should handle multiline imports correctly', async () => {
			await vscode.workspace
				.getConfiguration('rnStylesheetExtraction')
				.update(
					'extractionLocation',
					'After imports',
					vscode.ConfigurationTarget.Global
				);

			const result = await executeExtractionAndGetResult(
				extractionLocationMultilineImportCode,
				'backgroundColor'
			);

			const lines = result.split('\n');
			const lastImportLineIndex = lines.findIndex((line) =>
				line.includes("} from 'react-native';")
			);
			const styleSheetLineIndex = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			const componentLineIndex = lines.findIndex((line) =>
				line.includes('export default function App()')
			);

			assert.ok(
				styleSheetLineIndex > lastImportLineIndex,
				'StyleSheet should be after last import line'
			);
			assert.ok(
				styleSheetLineIndex < componentLineIndex,
				'StyleSheet should be before component'
			);
		}).timeout(5000);
	});
});
