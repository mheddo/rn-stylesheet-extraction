import assert from 'assert';
import * as vscode from 'vscode';
import { CommentTracker } from '../commentTracker';
import {
	styleBodyWithSingleLineComments,
	styleBodyWithBlockComments,
	styleBodyWithMixedComments,
	styleBodyWithComplexMultilineComment,
	styleBodyWithNestedComments,
	styleObjectTextBasic,
	createMockDocument,
	styleBodyWithFooterComments,
	styleBodyWithNestedBlockComments,
	styleBodyWithEmptyComments,
	styleBodyWithMixedInlineComments,
	styleBodyWithUrlComments,
	styleBodyWithSpanningBlockComment,
} from './testConstants';
import { mockMessages, restoreMessages, closeAllEditors } from './testHelpers';

suite('CommentTracker Tests', function () {
	vscode.window.showInformationMessage('Start comment tracker tests.');

	setup(function () {
		mockMessages();
	});
	teardown(async function () {
		restoreMessages();
		await closeAllEditors();
	});

	test('Extract single line comments', async () => {
		const mockDocument = createMockDocument();

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithSingleLineComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.strictEqual(comments.length, 3);

		const beforeBgComment = comments.find(
			(c) => c.propertyName === 'backgroundColor' && c.position === 'before'
		);
		const inlinePaddingComment = comments.find(
			(c) => c.propertyName === 'padding' && c.position === 'inline'
		);
		const beforeMarginComment = comments.find(
			(c) => c.propertyName === 'margin' && c.position === 'before'
		);

		assert.ok(beforeBgComment);
		assert.ok(inlinePaddingComment);
		assert.ok(beforeMarginComment);

		assert.ok(!cleanedStyleBody.includes('//'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
		assert.ok(cleanedStyleBody.includes('margin: 5'));
	});

	test('Extract block comments', async () => {
		const mockDocument = createMockDocument();

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithBlockComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.strictEqual(comments.length, 3);

		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(!cleanedStyleBody.includes('*/'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
		assert.ok(cleanedStyleBody.includes('margin: 5'));
	});

	test('Restore comments to StyleSheet', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const comments = [
			{
				propertyName: 'backgroundColor',
				comments: [
					{
						type: 'SingleLine' as const,
						text: 'Primary color',
						line: 1,
						column: 0,
					},
				],
				position: 'before' as const,
			},
			{
				propertyName: 'padding',
				comments: [
					{
						type: 'SingleLine' as const,
						text: 'Standard padding',
						line: 2,
						column: 20,
					},
				],
				position: 'inline' as const,
			},
		];

		const styleObjectText = styleObjectTextBasic;

		const restoredText = commentTracker.restoreCommentsToStyleSheet(
			styleObjectText,
			comments
		);

		assert.ok(restoredText.includes('// Primary color'));
		assert.ok(restoredText.includes('// Standard padding'));
		assert.ok(restoredText.includes("backgroundColor: 'red'"));
		assert.ok(restoredText.includes('padding: 10'));
	});

	test('Handle comments at start of style block', async () => {
		const mockDocument = createMockDocument();

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithNestedComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(comments.length >= 2);

		const orphanedComments = comments.filter((c) => !c.propertyName);
		assert.ok(
			orphanedComments.length > 0,
			'Should have orphaned comments at start'
		);

		assert.ok(!cleanedStyleBody.includes('//'));
		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
	});

	test('Handle comments at end of style block', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithFooterComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(comments.length >= 2);

		assert.ok(!cleanedStyleBody.includes('//'));
		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
	});

	test('Handle nested block comments', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithNestedBlockComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(comments.length >= 1);
		const nestedComment = comments.find((c) =>
			c.comments[0].text.includes('This is a complex comment')
		);
		assert.ok(nestedComment, 'Should extract nested comment');

		assert.ok(
			nestedComment?.comments[0].text.includes('Still part of the comment'),
			'Should preserve nested content'
		);

		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'blue'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));

		const blueMatches = (
			cleanedStyleBody.match(/backgroundColor: 'blue'/g) || []
		).length;
		const redMatches = (cleanedStyleBody.match(/backgroundColor: 'red'/g) || [])
			.length;
		assert.strictEqual(
			blueMatches,
			1,
			'Should have exactly one backgroundColor: blue'
		);
		assert.strictEqual(
			redMatches,
			0,
			'Should not have backgroundColor: red in cleaned body'
		);
	});

	test('Handle multiple inline comments on same line', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithMixedInlineComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(comments.length >= 2);

		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));

		const commentTexts = comments.map((c) => c.comments[0].text).join(' ');
		assert.ok(
			commentTexts.includes('Primary') ||
				commentTexts.includes('Brand') ||
				commentTexts.includes('Standard') ||
				commentTexts.includes('More'),
			'Should extract some comment text'
		);
	});

	test('Handle comments with special characters', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithUrlComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(comments.length >= 2);

		const todoComment = comments.find((c) =>
			c.comments[0].text.includes('TODO')
		);
		const urlComment = comments.find(
			(c) =>
				c.comments[0].text.includes('https://') ||
				c.comments[0].text.includes('URL')
		);
		const warningComment = comments.find((c) =>
			c.comments[0].text.includes('WARNING')
		);

		assert.ok(todoComment, 'Should extract TODO comment');
		if (urlComment) {
			assert.ok(
				urlComment.comments[0].text.includes('https://') ||
					urlComment.comments[0].text.includes('example.com'),
				'Should preserve URL if extracted'
			);
		}
		assert.ok(warningComment, 'Should extract warning comment');

		if (todoComment) {
			assert.ok(
				todoComment.comments[0].text.includes('@author') ||
					todoComment.comments[0].text.includes('#123'),
				'Should preserve @ and # characters'
			);
		}
		if (warningComment) {
			assert.ok(
				warningComment.comments[0].text.includes('!!!'),
				'Should preserve exclamation marks'
			);
		}

		assert.ok(!cleanedStyleBody.includes('//'));
		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
		assert.ok(cleanedStyleBody.includes('margin: 5'));
	});

	test('Handle empty and whitespace-only comments', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);
		const styleBody = styleBodyWithEmptyComments;

		const { cleanedStyleBody, comments } =
			commentTracker.extractComments(styleBody);

		assert.ok(Array.isArray(comments), 'Should return comments array');

		assert.ok(!cleanedStyleBody.includes('//'));
		assert.ok(!cleanedStyleBody.includes('/*'));
		assert.ok(cleanedStyleBody.includes("backgroundColor: 'red'"));
		assert.ok(cleanedStyleBody.includes('padding: 10'));
		assert.ok(cleanedStyleBody.includes('margin: 5'));
		assert.ok(cleanedStyleBody.includes('borderRadius: 8'));
	});

	test('Restore complex comment arrangements', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const comments = [
			{
				propertyName: undefined,
				comments: [
					{
						type: 'SingleLine' as const,
						text: 'Header comment',
						line: 1,
						column: 0,
					},
				],
				position: 'before' as const,
			},
			{
				propertyName: 'backgroundColor',
				comments: [
					{ type: 'Block' as const, text: 'Color comment', line: 2, column: 0 },
				],
				position: 'before' as const,
			},
			{
				propertyName: 'padding',
				comments: [
					{
						type: 'SingleLine' as const,
						text: 'Inline padding comment',
						line: 3,
						column: 20,
					},
				],
				position: 'inline' as const,
			},
			{
				propertyName: undefined,
				comments: [
					{
						type: 'Block' as const,
						text: 'Footer comment',
						line: 4,
						column: 0,
					},
				],
				position: 'before' as const,
			},
		];

		const styleObjectText = `\tmyStyle: {
\t\tbackgroundColor: 'red',
\t\tpadding: 10,
\t\tmargin: 5,
\t},`;

		const restoredText = commentTracker.restoreCommentsToStyleSheet(
			styleObjectText,
			comments
		);

		assert.ok(
			restoredText.includes('// Header comment'),
			'Should include header comment'
		);
		assert.ok(
			restoredText.includes('/* Color comment */'),
			'Should include color comment'
		);
		assert.ok(
			restoredText.includes('// Inline padding comment'),
			'Should include inline comment'
		);
		assert.ok(
			restoredText.includes('/* Footer comment */'),
			'Should include footer comment'
		);

		assert.ok(
			restoredText.includes("backgroundColor: 'red'"),
			'Should include backgroundColor'
		);
		assert.ok(restoredText.includes('padding: 10'), 'Should include padding');
		assert.ok(restoredText.includes('margin: 5'), 'Should include margin');
	});

	test('Preserve multi-line comment formatting with indentation', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const { cleanedStyleBody, comments } = commentTracker.extractComments(
			styleBodyWithMixedComments
		);

		assert.ok(comments.length >= 4);

		const multiLineComment = comments.find(
			(c) =>
				c.comments[0].type === 'Block' &&
				c.comments[0].text.includes('paddingBottom')
		);

		assert.ok(multiLineComment, 'Should extract the multi-line comment');

		assert.ok(
			multiLineComment.comments[0].text.includes('\n'),
			'Should preserve newlines in multi-line comment'
		);
		assert.ok(
			multiLineComment.comments[0].text.includes(
				'paddingBottom: insets.bottom'
			),
			'Should preserve comment content'
		);

		const restoredStyleSheet = commentTracker.restoreCommentsToStyleSheet(
			"\t\tbackgroundColor: 'beige',\n\t\tflex: 1,\n\t\tpaddingBottom: 0,",
			comments
		);

		assert.ok(
			restoredStyleSheet.includes('/*bolo'),
			'Should have opening comment marker'
		);
		assert.ok(
			restoredStyleSheet.includes('paddingBottom: insets.bottom'),
			'Should preserve content indentation'
		);
		assert.ok(
			restoredStyleSheet.includes('*/'),
			'Should have closing comment marker'
		);

		const lines = restoredStyleSheet.split('\n');
		const commentStartLine = lines.findIndex((line) => line.includes('/*bolo'));
		const commentEndLine = lines.findIndex((line) => line.includes('*/'));
		assert.ok(
			commentStartLine !== commentEndLine,
			'Multi-line comment should span multiple lines'
		);
	});

	test('Fix indentation issue with multi-line comments', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const { comments } = commentTracker.extractComments(
			styleBodyWithComplexMultilineComment
		);

		const styleSheetContent = `\tmyStyle1: {
\t\t// holo
\t\tbackgroundColor: 'beige', // bye
\t\t// yolo
\t\tflex: 1, /* todo: hi */
\t},`;

		const restored = commentTracker.restoreCommentsToStyleSheet(
			styleSheetContent,
			comments
		);

		const multiLineComment = comments.find(
			(c) =>
				c.comments[0].type === 'Block' &&
				c.comments[0].text.includes('paddingBottom')
		);

		const lines = restored.split('\n');
		const paddingBottomLine = lines.find((line) =>
			line.includes('paddingBottom')
		);
		if (paddingBottomLine) {
			const leadingTabs = paddingBottomLine.match(/^\t*/)?.[0].length || 0;
			assert.ok(
				leadingTabs <= 3,
				`paddingBottom line has ${leadingTabs} tabs, should be 3 or fewer. Line: "${paddingBottomLine}"`
			);
		}

		assert.ok(
			multiLineComment?.propertyName,
			'Multi-line comment should be associated with a property, not orphaned'
		);
	});

	test('Correctly associate multi-line comments with following properties', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const { cleanedStyleBody, comments } = commentTracker.extractComments(
			styleBodyWithComplexMultilineComment
		);

		const multiLineComment = comments.find(
			(c) =>
				c.comments[0].type === 'Block' &&
				c.comments[0].text.includes('paddingBottom')
		);

		assert.ok(multiLineComment, 'Should extract the multi-line comment');
	});

	test('Handle multi-line block comments that span property values', async () => {
		const mockDocument = {
			offsetAt: () => 0,
		} as any as vscode.TextDocument;

		const commentTracker = new CommentTracker('', mockDocument, 0, 0);

		const { cleanedStyleBody, comments } = commentTracker.extractComments(
			styleBodyWithSpanningBlockComment
		);

		assert.ok(
			cleanedStyleBody.includes('flex: 1'),
			'Should contain flex property'
		);
		assert.ok(
			cleanedStyleBody.includes("backgroundColor: 'beige'"),
			'Should contain backgroundColor property'
		);

		assert.ok(
			!cleanedStyleBody.includes(',,'),
			'Should not have consecutive commas'
		);

		assert.strictEqual(comments.length, 4, 'Should extract all 4 comments');

		const problematicComment = comments.find(
			(c) =>
				c.comments[0].text.includes('bolo') &&
				c.comments[0].text.includes('paddingBottom')
		);
		assert.ok(
			problematicComment,
			'Should find the problematic multi-line comment'
		);

		const testCode = `({${cleanedStyleBody}})`;
		assert.doesNotThrow(() => {
			Function('"use strict"; return ' + testCode);
		}, 'Cleaned style body should produce valid JavaScript syntax');
	});
});
