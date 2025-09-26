import assert from 'assert';
import {
	openTempDocument,
	closeAllEditors,
	extractAllStylesAndGetText,
	mockMessages,
	restoreMessages,
} from './testHelpers';
import { sourceCodeForPerformanceTest } from './testConstants';

suite('Performance Tests', () => {
	setup(() => {
		mockMessages();
	});

	teardown(async () => {
		restoreMessages();
		await closeAllEditors();
	});

	test('Handles large files with many inline styles efficiently', async () => {
		const components = [];
		for (let i = 0; i < 50; i++) {
			components.push(`
			<View style={{ backgroundColor: 'color${i}', width: ${i * 10}, height: ${
				i * 5
			} }}>
				<Text style={{ fontSize: ${i + 12}, color: 'text${i}' }}>Item ${i}</Text>
			</View>`);
		}

		const largeFile = `
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
	return (
		<>
			${components.join('\n')}
		</>
	);
}
`;

		const startTime = Date.now();
		const result = await extractAllStylesAndGetText(largeFile);
		const endTime = Date.now();

		// Should complete within reasonable time (less than 5 seconds)
		assert.ok(
			endTime - startTime < 5000,
			`Processing took too long: ${endTime - startTime}ms`
		);

		// Should successfully extract styles
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(
			result.includes('styles.myStyle'),
			'Should reference extracted styles'
		);
	});

	test('Handles deeply nested JSX structures', async () => {
		const deeplyNested = sourceCodeForPerformanceTest;

		const result = await extractAllStylesAndGetText(deeplyNested);

		// Should handle deep nesting without issues
		assert.ok(result.includes('StyleSheet.create'), 'Should create StyleSheet');
		assert.ok(result.includes('myStyle'), 'Should extract styles');
	});
});
