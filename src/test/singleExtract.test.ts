import * as vscode from 'vscode';
import assert from 'assert';
import {
	alreadyExtractedCode,
	deeplyNestedJSX,
	existingStyleSheetWithDefaultName,
	existingStyleSheetWithNonDefaultName,
	extractSingleStyleSheetCode,
	myStyle2AlreadyExtracted,
	noReactNativeImportWithExistingStyleSheet,
	noStyleSheetImportWithExistingStyleSheet,
	noStyleSheetMultipleProps,
	noStyleSheetNoImport,
	noStyleSheetSingleProp,
	threeExistingStyleSheetWithIncludingDefaultNameV1,
	threeExistingStyleSheetWithIncludingDefaultNameV2,
	threeExistingStyleSheetWithIncludingDefaultNameV3,
	threeExistingStyleSheetWithoutDefaultName,
} from './testConstants';
import {
	closeAllEditors,
	errorMessage,
	extractSingleStyleAndGetText,
	infoMessage,
	mockMessages,
	restoreMessages,
	singleExtractDefaultInputBoxText,
} from './testHelpers';
import { ExtractStrings } from '../constants';

suite('Extract Individual Style Command', function () {
	vscode.window.showInformationMessage('Start extract individual style tests.');

	setup(function () {
		mockMessages();
	});
	teardown(async function () {
		restoreMessages();
		await closeAllEditors();
	});

	test('Check StyleSheet properly created', async () => {
		// Check that StyleSheet.create doesn't exist yet
		assert.ok(
			!noStyleSheetMultipleProps.includes('StyleSheet.create'),
			'Test code should not have StyleSheet'
		);

		// Check that we currently aren't using 'style={styles.' anywhere yet -> This should appear after extraction
		assert.ok(
			!noStyleSheetMultipleProps.includes('style={styles.'),
			'Test code should not use styles.myStyle1'
		);

		// Check that there's 3 style props that exist
		const stylePropMatches =
			noStyleSheetMultipleProps.match(/style=\{\{[^}]*\}\}/g);
		assert.ok(
			stylePropMatches && stylePropMatches.length === 3,
			'Test code should have 3 inline style props'
		);

		const newText = await extractSingleStyleAndGetText(
			noStyleSheetMultipleProps,
			"backgroundColor: 'red', width: 100",
			'myStyle1'
		);

		// Check that styles.myStyle1 was created and used
		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'First extracted style should be used'
		);
		assert.ok(
			newText.includes(extractSingleStyleSheetCode),
			'Check that StyleSheet was created properly'
		);
	});

	test('An existing react-native import updates when extracting style', async () => {
		// Check that the import for StyleSheet doesn't exist yet, but the import for View does
		assert.ok(
			noStyleSheetMultipleProps.includes('import { View'),
			'Test code should import View'
		);

		assert.ok(
			!noStyleSheetMultipleProps.includes('import { View, StyleSheet'),
			'Test code should not import StyleSheet yet'
		);

		const newText = await extractSingleStyleAndGetText(
			noStyleSheetMultipleProps,
			"backgroundColor: 'red', width: 100",
			'myStyle1'
		);

		// Check that the import has been updated to include StyleSheet
		assert.ok(
			newText.includes("import { View, StyleSheet } from 'react-native';"),
			'StyleSheet import should be added'
		);
		// Check that StyleSheet is only imported once and not individually
		assert.ok(
			!newText.includes('import { StyleSheet };'),
			'StyleSheet should not be imported separately'
		);
	});

	test('A new react-native import is created when extracting a style and no existing import is present', async () => {
		// Check that the import for StyleSheet doesn't exist yet, but the import for View does
		assert.ok(
			!noStyleSheetNoImport.includes("from 'react-native';"),
			'Test code should not have any react-native import'
		);

		const newText = await extractSingleStyleAndGetText(
			noStyleSheetNoImport,
			"backgroundColor: 'red', width: 100",
			'myStyle1'
		);

		// Check that the import has been updated to include StyleSheet
		assert.ok(
			newText.includes("import { StyleSheet } from 'react-native';"),
			'StyleSheet import should be added'
		);
	});

	test(`The react-native import isn't added if a StyleSheet is already present`, async () => {
		// Check that the import for StyleSheet doesn't exist yet, but the import for View does
		assert.ok(
			!noReactNativeImportWithExistingStyleSheet.includes(
				"from 'react-native';"
			),
			'Test code should not already have any react-native import'
		);

		const newText = await extractSingleStyleAndGetText(
			noReactNativeImportWithExistingStyleSheet,
			"color: 'green', height: 100",
			'myStyle2'
		);

		// Check that the import has been updated to include StyleSheet
		assert.ok(
			!newText.includes(" from 'react-native';"),
			'StyleSheet import should not be added'
		);
	});

	test(`The react-native import remains unchanged if a StyleSheet is already present`, async () => {
		// Check that the import for StyleSheet doesn't exist yet, but the import for View does
		assert.ok(
			noStyleSheetImportWithExistingStyleSheet.includes("from 'react-native';"),
			'Test code should have any react-native import'
		);

		const newText = await extractSingleStyleAndGetText(
			noStyleSheetImportWithExistingStyleSheet,
			"color: 'green', height: 100",
			'myStyle2'
		);

		// Find the line with the react-native import from the previous code
		const oldImportLine = noStyleSheetImportWithExistingStyleSheet
			.split('\n')
			.find((line) => line.includes("from 'react-native';"));
		const newImportLine = newText
			.split('\n')
			.find((line) => line.includes("from 'react-native';"));

		assert.ok(
			oldImportLine !== undefined && newImportLine !== undefined,
			'Both import lines should be found'
		);
		assert.ok(
			oldImportLine === newImportLine,
			'The react-native import line should remain unchanged'
		);
	});

	test('Extraction still works when theres only a single prop to extract', async () => {
		// Check that StyleSheet.create doesn't exist yet
		assert.ok(
			!noStyleSheetSingleProp.includes('StyleSheet.create'),
			'Test code should not have StyleSheet'
		);

		// Check that we currently aren't using 'style={styles.' anywhere yet -> This should appear after extraction
		assert.ok(
			!noStyleSheetSingleProp.includes('style={styles.'),
			'Test code should not use styles.myStyle1'
		);

		// Check that only 1 style prop exist
		const stylePropMatches =
			noStyleSheetSingleProp.match(/style=\{\{[^}]*\}\}/g);
		assert.ok(
			stylePropMatches && stylePropMatches.length === 1,
			'Test code should have exactly 1 inline style prop'
		);

		const newText = await extractSingleStyleAndGetText(
			noStyleSheetSingleProp,
			"backgroundColor: 'red', width: 100",
			'myStyle2'
		);

		// Check that styles.myStyle2 was created and used
		assert.ok(
			newText.includes('style={styles.myStyle2}'),
			'First extracted style should be used'
		);
		assert.ok(
			newText.includes('myStyle2: {'),
			'First extracted style definition should be present'
		);

		// Check that content of the first style block is the same as initially -> Just check that all it's props are there
		assert.ok(
			newText.includes("backgroundColor: 'red',"),
			'Check that background color prop of first style was extracted correctly'
		);
		assert.ok(
			newText.includes('width: 100'),
			'Check that width prop of first style was extracted correctly'
		);
	});

	test('Extraction properly functions with existing default named StyleSheet', async () => {
		// Check that StyleSheet.create exists already, and that it has the name 'styles'
		assert.ok(
			existingStyleSheetWithDefaultName.includes(
				'const styles = StyleSheet.create({'
			),
			'Test code should have default named StyleSheet'
		);
		const newText = await extractSingleStyleAndGetText(
			existingStyleSheetWithDefaultName,
			"color: 'green', height: 100",
			'myStyle2'
		);

		// Check that there's a single StyleSheet.create and it's still the default 'styles'
		assert.ok(
			(newText.match(/StyleSheet\.create\(/g) || []).length === 1,
			'Updated code should have exactly 1 StyleSheet.create'
		);
		assert.ok(
			newText.includes('const styles = StyleSheet.create({'),
			'Updated code should have default named StyleSheet'
		);

		// Check that styles.myStyle1 exists
		assert.ok(
			newText.includes('style={styles.myStyle1}'),
			'First extracted style should be used'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'First extracted style definition should be present'
		);

		// Check that styles.myStyle2 was created and used
		assert.ok(
			newText.includes('style={styles.myStyle2}'),
			'Second extracted style should be used'
		);
		assert.ok(
			newText.includes('myStyle2: {'),
			'Second extracted style definition should be present'
		);
	});

	test('Extraction properly functions with existing non-default named StyleSheet', async () => {
		// Check that StyleSheet.create exists already, and that it doesn't have the name 'styles'
		assert.ok(
			existingStyleSheetWithNonDefaultName.includes('StyleSheet.create({'),
			'Test code should have a StyleSheet'
		);

		assert.ok(
			!existingStyleSheetWithNonDefaultName.includes(
				'const styles = StyleSheet.create({'
			),
			'Test code should not have default named StyleSheet'
		);

		const newText = await extractSingleStyleAndGetText(
			existingStyleSheetWithNonDefaultName,
			"color: 'green', height: 100",
			'myStyle2'
		);

		// Check that there's a single StyleSheet.create and it's still the custom named style
		assert.ok(
			!newText.includes('const styles = StyleSheet.create({'),
			'Updated code should not have default named StyleSheet'
		);

		assert.ok(
			(newText.match(/StyleSheet\.create\(/g) || []).length === 1,
			'Updated code should have exactly 1 StyleSheet.create'
		);
		assert.ok(
			newText.includes('const customStylesName = StyleSheet.create({'),
			'Updated code should have custom named StyleSheet'
		);

		// Check that customName.myStyle1 exists
		assert.ok(
			newText.includes('style={customStylesName.myStyle1}'),
			'First extracted style should be used'
		);
		assert.ok(
			newText.includes('myStyle1: {'),
			'First extracted style definition should be present'
		);

		// Check that customName.myStyle2 was created and used
		assert.ok(
			newText.includes('style={customStylesName.myStyle2}'),
			'Second extracted style should be used'
		);
		assert.ok(
			newText.includes('myStyle2: {'),
			'Second extracted style definition should be present'
		);
	});

	[
		{
			name: 'default style is first',
			code: threeExistingStyleSheetWithIncludingDefaultNameV1,
		},
		{
			name: 'default style is in the middle',
			code: threeExistingStyleSheetWithIncludingDefaultNameV2,
		},
		{
			name: 'default style is last',
			code: threeExistingStyleSheetWithIncludingDefaultNameV3,
		},
	].forEach(({ name, code }) => {
		test(`Check that extraction properly functions with three existing StyleSheets where ${name}`, async () => {
			// Check that 3 StyleSheet.create exists already, and that one has the name 'styles'
			assert.ok(
				(code.match(/StyleSheet\.create\(/g) || []).length === 3,
				'Test code should have exactly 3 StyleSheet.create'
			);
			assert.ok(
				code.includes('const styles = StyleSheet.create({'),
				'Test code should have default named StyleSheet'
			);

			const newText = await extractSingleStyleAndGetText(
				code,
				"color: 'green', height: 100",
				'myStyle2'
			);

			// Check that there's still 3 instances of StyleSheet.create and that one is the default 'styles'
			assert.ok(
				(code.match(/StyleSheet\.create\(/g) || []).length === 3,
				'Updated code should have exactly 3 StyleSheet.create'
			);
			assert.ok(
				code.includes('const styles = StyleSheet.create({'),
				'Updated code should have default named StyleSheet'
			);

			// Check that the inline styles were added to the default named StyleSheet
			assert.ok(
				newText.includes('style={styles.myStyle2}'),
				'Extracted style should be called in-line'
			);
			assert.ok(
				newText.includes('myStyle2: {'),
				'Extracted style definition should be present within the default named StyleSheet'
			);

			// Find line of default StyleSheet and check that new style was added to it
			const lines = newText.split('\n');
			const defaultStyleSheetCreateLine = lines.findIndex((line) =>
				line.includes('const styles = StyleSheet.create({')
			);
			const customStyleSheetCreateLine1 = lines.findIndex((line) =>
				line.includes('const customStylesName1 = StyleSheet.create({')
			);
			const customStyleSheetCreateLine2 = lines.findIndex((line) =>
				line.includes('const customStylesName2 = StyleSheet.create({')
			);
			const styleSheetLine = lines.findIndex((line) =>
				line.includes('myStyle2: {')
			);

			// Check that the style was added after the default StyleSheet.create line
			assert.ok(
				styleSheetLine > defaultStyleSheetCreateLine,
				'Extracted style definition should be added under the default named StyleSheet'
			);

			if (
				defaultStyleSheetCreateLine < customStyleSheetCreateLine1 &&
				defaultStyleSheetCreateLine < customStyleSheetCreateLine2
			) {
				// Default StyleSheet is first, so make sure the new style is before the other two
				assert.ok(
					styleSheetLine < customStyleSheetCreateLine1 &&
						styleSheetLine < customStyleSheetCreateLine2,
					'Verify that the new style is before the other stylesheets'
				);
			} else if (
				defaultStyleSheetCreateLine > customStyleSheetCreateLine1 &&
				defaultStyleSheetCreateLine > customStyleSheetCreateLine2
			) {
				// Default StyleSheet is last, so make sure the new style is after the other two
				assert.ok(
					styleSheetLine > customStyleSheetCreateLine1 &&
						styleSheetLine > customStyleSheetCreateLine2,
					'Verify that the new style is after the other stylesheets'
				);
			} else {
				// Default StyleSheet is in the middle
				if (customStyleSheetCreateLine1 < customStyleSheetCreateLine2) {
					// customStyleSheetCreateLine1 is first, customStyleSheetCreateLine2 is last, so make sure the new style is after the first but before the last
					assert.ok(
						styleSheetLine > customStyleSheetCreateLine1 &&
							styleSheetLine < customStyleSheetCreateLine2,
						'Verify that the new style is added between the other stylesheets 1'
					);
				} else {
					// customStyleSheetCreateLine2 is first, customStyleSheetCreateLine1 is last, so make sure the new style is after the first but before the last
					assert.ok(
						styleSheetLine < customStyleSheetCreateLine1 &&
							styleSheetLine > customStyleSheetCreateLine2,
						'Verify that the new style is added between the other stylesheets 2'
					);
				}
			}
		});
	});

	test('Extraction properly functions with three existing non-default named StyleSheets', async () => {
		// Check that StyleSheet.create exists 3 times already, and that it doesn't have the name 'styles'
		assert.ok(
			(
				threeExistingStyleSheetWithoutDefaultName.match(
					/StyleSheet\.create\(/g
				) || []
			).length === 3,
			'Test code should have 3 StyleSheets'
		);

		assert.ok(
			!threeExistingStyleSheetWithoutDefaultName.includes(
				'const styles = StyleSheet.create({'
			),
			'Test code should not have default named StyleSheet'
		);

		const newText = await extractSingleStyleAndGetText(
			threeExistingStyleSheetWithoutDefaultName,
			"color: 'green', height: 100",
			'myStyle2'
		);

		// Check that there's now 4 StyleSheet.create's, the extra being a newly created 'styles'
		assert.ok(
			(newText.match(/StyleSheet\.create\(/g) || []).length === 4,
			'Updated code should have one more StyleSheet.create'
		);
		assert.ok(
			newText.includes('const styles = StyleSheet.create({'),
			'Updated code should not have default named StyleSheet'
		);

		// Check that the newly created StyleSheet is added at the end of the file
		const lines = newText.split('\n');
		const styleSheetCreateLines: number[] = [];
		let newlyAddedDefaultStyleSheetIndex: number | undefined;

		lines.forEach((line, idx) => {
			if (line.includes('const styles = StyleSheet.create({')) {
				newlyAddedDefaultStyleSheetIndex = idx;
			} else if (line.includes('StyleSheet.create({')) {
				styleSheetCreateLines.push(idx);
			}
		});

		// Make sure there's 3 other StyleSheet.create lines, and that the newly added default one is after all of them
		assert.ok(styleSheetCreateLines.length === 3);
		assert.ok(newlyAddedDefaultStyleSheetIndex !== undefined);
		styleSheetCreateLines.forEach((idx) => {
			if (newlyAddedDefaultStyleSheetIndex !== undefined) {
				assert.ok(
					newlyAddedDefaultStyleSheetIndex > idx,
					'Newly added default StyleSheet should be the last style sheet in the file'
				);
			}
		});
	});

	test('When all styles are already extracted, trying to extract again displays a message', async () => {
		// check that each style prop is an assignment of customStylesName.something
		const numberOfStyleProps = (
			alreadyExtractedCode.match(/style=\{[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\}/g) ||
			[]
		).length;

		const numberOfAssignedStyleBlocks = (
			alreadyExtractedCode.match(
				/style=\{customStylesName\d*\.[a-zA-Z0-9_]+\}/g
			) || []
		).length;

		assert.ok(
			numberOfStyleProps === numberOfAssignedStyleBlocks,
			'All styles should already be extracted'
		);

		const newText = await extractSingleStyleAndGetText(
			alreadyExtractedCode,
			'customStylesName1.myStyle1',
			'myStyle2'
		);

		// The new code should be identical to the old code
		assert.ok(newText === alreadyExtractedCode, 'Code should remain unchanged');

		// An info message should be shown indicating the style is already extracted
		assert.ok(
			infoMessage === ExtractStrings.memberExpressionDetected,
			'Info message should indicate the style is already extracted'
		);

		assert.ok(
			errorMessage === '',
			'No error message should be shown when all styles are already extracted'
		);
	});

	test('Check that the input box shows the correct default style name when no styles are extracted', async () => {
		assert.ok(
			!noStyleSheetMultipleProps.includes('myStyle1'),
			'No styles should be visible in the code yet'
		);

		const inputBoxText = await singleExtractDefaultInputBoxText(
			noStyleSheetMultipleProps,
			"backgroundColor: 'red', width: 100"
		);

		assert.ok(
			inputBoxText === 'myStyle1',
			'Input box should default to myStyle1 when no styles are present'
		);
	});

	test('Check that the input box shows the correct default style incremented name when a style is already extracted', async () => {
		assert.ok(
			existingStyleSheetWithDefaultName.includes('myStyle1'),
			'myStyle1 should be visible in the code yet'
		);
		assert.ok(
			!existingStyleSheetWithDefaultName.includes('myStyle2'),
			'Only myStyle1 should be visible in the code so far'
		);

		const inputBoxText = await singleExtractDefaultInputBoxText(
			existingStyleSheetWithDefaultName,
			"color: 'green', height: 100"
		);

		assert.ok(
			inputBoxText === 'myStyle2',
			'Input box should default to myStyle2 when myStyle1 is present already'
		);
	});

	// TODO also do this with a custom named sheet 'customSheet'
	test('Check that changing the input box to an existing style name, the user is notified', async () => {
		assert.ok(
			existingStyleSheetWithDefaultName.includes('myStyle1'),
			'myStyle1 should be visible in the code yet'
		);
		assert.ok(
			!existingStyleSheetWithDefaultName.includes('myStyle2'),
			'Only myStyle1 should be visible in the code so far'
		);

		const inputBoxText = await singleExtractDefaultInputBoxText(
			existingStyleSheetWithDefaultName,
			"color: 'green', height: 100"
		);

		assert.ok(
			inputBoxText === 'myStyle2',
			'Input box should default to myStyle2 when myStyle1 is present already'
		);
	});

	test('If one of the existing StyleSheet styles is a kind of default, the increment remains correct', async () => {
		assert.ok(
			myStyle2AlreadyExtracted.includes('myStyle2'),
			'myStyle2 should already be extracted'
		);
		assert.ok(
			!myStyle2AlreadyExtracted.includes('myStyle1'),
			'myStyle1 should not be extracted'
		);
		assert.ok(
			!myStyle2AlreadyExtracted.includes('myStyle3'),
			'myStyle3 should not be extracted'
		);

		const inputBoxText = await singleExtractDefaultInputBoxText(
			myStyle2AlreadyExtracted,
			"color: 'green', height: 100"
		);

		assert.ok(
			inputBoxText === 'myStyle1',
			"Input box should default to myStyle1 when myStyle1 isn't present, even if myStyle2 is already"
		);

		// TODO find that the input box already says 'myStyle1' and that we can change it to 'myStyle3' -> Not sure how to do this with the current mocking setup
	});

	[
		{
			cursorAtCode: '<AnimatedView',
		},
		{
			cursorAtCode: 'accessible={true}',
		},
		{
			cursorAtCode: 'testID="testID"',
		},
		{
			cursorAtCode: '/** End tag*/>',
		},
	].forEach(({ cursorAtCode }) => {
		test('If the cursor is at different parts of the jsx, single extraction still works', async () => {
			// check that myStyle1 doesn't exist yet
			assert.ok(
				!deeplyNestedJSX.includes('myStyle1'),
				'myStyle1 should not be visible in the code yet'
			);

			const newText = await extractSingleStyleAndGetText(
				deeplyNestedJSX,
				cursorAtCode,
				'myStyle1'
			);

			// check that the StyleSheet was created, and it features a prop from the correct style block
			const styleSheetCreatePosition = newText.indexOf('StyleSheet.create');
			const alignItemsPosition = newText.indexOf("alignItems: 'flex-end'");
			assert.ok(
				styleSheetCreatePosition !== -1,
				'StyleSheet.create should be present in the code'
			);
			assert.ok(
				alignItemsPosition !== -1,
				"alignItems: 'flex-end' should be present in the code"
			);
			assert.ok(
				alignItemsPosition > styleSheetCreatePosition,
				"alignItems: 'flex-end' should come after StyleSheet.create"
			);
		});
	});
});
