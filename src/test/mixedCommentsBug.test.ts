import assert from 'assert';
import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import {
	extractSingleStyleAndGetText,
	closeAllEditors,
	mockMessages,
	restoreMessages,
} from './testHelpers';

// Test case for mixed comment types with dynamic functions
const sourceCodeWithMixedCommentsAndDynamics = `
import React from 'react';
import { View } from 'react-native';

function TestComponent({ theme, screenWidth }) {
  const getPadding = () => 16;

  return (
    <View
      style={{
        // Container styling
        backgroundColor: theme.primary,
        padding: getPadding() /* dynamic function call */,
        borderRadius: 8,
        // Responsive width
        width: screenWidth > 600 ? 400 : '100%',
      }}
    />
  );
}

export default TestComponent;
`;

suite('Mixed Comments and Dynamics Bug Test', function () {
	vscode.window.showInformationMessage(
		'Start mixed comments and dynamics bug test.'
	);

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

	test('Extract style with mixed comments and dynamic expressions', async () => {
		const sourceCode = sourceCodeWithMixedCommentsAndDynamics;

		const newText = await extractSingleStyleAndGetText(
			sourceCode,
			'backgroundColor', // cursor at this text
			'container' // style name
		);

		// Check that comments are preserved without trailing commas
		assert(
			newText.includes('// Container styling') &&
				!newText.includes('// Container styling,'),
			'Should preserve single-line comment before backgroundColor without comma'
		);
		assert(
			newText.includes('/* dynamic function call */'),
			'Should preserve inline block comment'
		);
		assert(
			newText.includes('// Responsive width') &&
				!newText.includes('// Responsive width,'),
			'Should preserve single-line comment before width without comma'
		);

		// Check that StyleSheet is created with static properties only
		assert(
			newText.includes('const styles = StyleSheet.create({'),
			'Should create StyleSheet'
		);
		assert(
			newText.includes('borderRadius: 8'),
			'Should include static borderRadius property'
		);

		// Dynamic properties should remain inline
		assert(
			newText.includes('backgroundColor: theme.primary'),
			'Dynamic backgroundColor should remain inline'
		);
		assert(
			newText.includes('padding: getPadding()'),
			'Dynamic padding should remain inline'
		);
		assert(
			newText.includes("width: screenWidth > 600 ? 400 : '100%'"),
			'Dynamic width should remain inline'
		);
	});
});
