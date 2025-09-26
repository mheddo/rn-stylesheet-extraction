import * as vscode from 'vscode';

/**
 * Interface for storing comment information
 */
export interface CommentInfo {
	type: 'SingleLine' | 'Block';
	text: string;
	line: number;
	column: number;
	endLine?: number;
	endColumn?: number;
}

/**
 * Interface for storing comments with their associated property
 */
export interface PropertyComment {
	propertyName?: string;
	comments: CommentInfo[];
	position: 'before' | 'after' | 'inline';
}

/**
 * Comment tracker for managing comments during style extraction
 */
export class CommentTracker {
	private originalText: string;
	private document: vscode.TextDocument;
	private styleStartOffset: number;
	private styleEndOffset: number;
	private commentMap: Map<number, PropertyComment[]> = new Map();

	constructor(
		originalText: string,
		document: vscode.TextDocument,
		styleStartOffset: number,
		styleEndOffset: number
	) {
		this.originalText = originalText;
		this.document = document;
		this.styleStartOffset = styleStartOffset;
		this.styleEndOffset = styleEndOffset;
	}

	/**
	 * Extract comments from the style object text
	 */
	public extractComments(styleBody: string): {
		cleanedStyleBody: string;
		comments: PropertyComment[];
	} {
		const comments: PropertyComment[] = [];

		// Split the style body into lines for analysis
		const lines = styleBody.split('\n');
		const processedLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmedLine = line.trim();

			// Skip empty lines
			if (!trimmedLine) {
				processedLines.push(line);
				continue;
			}

			// Handle single line block comments FIRST (/* ... */ all on one line)
			const inlineBlockCommentMatch = line.match(
				/^(\s*)(.*)\/\*(.*?)\*\/(.*)$/
			);
			if (inlineBlockCommentMatch) {
				const [, indent, beforeComment, commentText, afterComment] =
					inlineBlockCommentMatch;

				// Check if there are more block comments in the afterComment part
				const additionalBlockMatch = afterComment.match(/\/\*(.*?)\*\//);
				if (additionalBlockMatch) {
					// Handle multiple block comments on the same line recursively
					// For now, extract the first one and let the next iteration handle the rest
					const reconstructedLine = indent + beforeComment + afterComment;
					processedLines.push(reconstructedLine);

					// Process this comment
					let associatedProperty: string | undefined;
					let position: 'before' | 'after' | 'inline' = 'before';

					const propertyMatch = beforeComment.trim().match(/^(\w+)\s*:/);
					if (propertyMatch) {
						associatedProperty = propertyMatch[1];
						position = 'inline';
					} else {
						// Look for the next property after this comment
						for (let j = i + 1; j < lines.length; j++) {
							const nextLine = lines[j].trim();
							const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
							if (nextPropertyMatch) {
								associatedProperty = nextPropertyMatch[1];
								position = 'before';
								break;
							}
							if (
								nextLine &&
								!nextLine.startsWith('//') &&
								!nextLine.startsWith('/*')
							) {
								break;
							}
						}
					}

					comments.push({
						propertyName: associatedProperty,
						comments: [
							{
								type: 'Block',
								text: commentText, // Don't trim to preserve spacing
								line: i + 1,
								column: line.indexOf('/*'),
							},
						],
						position,
					});

					// Remove this block comment from the line and continue processing
					const lineWithoutThisComment = (
						indent +
						beforeComment +
						afterComment.replace(/\/\*.*?\*\//, '')
					).trimRight();

					// Update lines array to process remaining comments
					lines[i] = lineWithoutThisComment;
					i--; // Reprocess this line
					continue;
				}

				// Single block comment processing
				let associatedProperty: string | undefined;
				let position: 'before' | 'after' | 'inline' = 'before';

				const propertyMatch = beforeComment.trim().match(/^(\w+)\s*:/);
				if (propertyMatch) {
					associatedProperty = propertyMatch[1];
					position = 'inline';
				} else {
					// Look for the next property after this comment
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
						if (nextPropertyMatch) {
							associatedProperty = nextPropertyMatch[1];
							position = 'before';
							break;
						}
						if (
							nextLine &&
							!nextLine.startsWith('//') &&
							!nextLine.startsWith('/*')
						) {
							break;
						}
					}
				}

				comments.push({
					propertyName: associatedProperty,
					comments: [
						{
							type: 'Block',
							text: commentText.trim(),
							line: i + 1,
							column: line.indexOf('/*'),
						},
					],
					position,
				});

				// Reconstruct line without comment
				const cleanedLine = (indent + beforeComment + afterComment).trimRight();
				if (cleanedLine.trim()) {
					processedLines.push(cleanedLine);
				}
				continue;
			}

			// Handle single line comments
			const singleLineCommentMatch = line.match(/^(\s*)(.*)\/\/(.*)$/);
			if (singleLineCommentMatch) {
				const [, indent, beforeComment, commentText] = singleLineCommentMatch;

				// Check if there's also a block comment before the single-line comment
				const blockCommentInBeforeMatch = beforeComment.match(
					/^(.*)\/\*(.*?)\*\/(.*)$/
				);
				if (blockCommentInBeforeMatch) {
					const [, beforeBlock, blockText, afterBlock] =
						blockCommentInBeforeMatch;

					// Process the block comment first
					let blockAssociatedProperty: string | undefined;
					let blockPosition: 'before' | 'after' | 'inline' = 'before';

					const blockPropertyMatch = beforeBlock.trim().match(/^(\w+)\s*:/);
					if (blockPropertyMatch) {
						blockAssociatedProperty = blockPropertyMatch[1];
						blockPosition = 'inline';
					} else {
						// Look for next property
						for (let j = i + 1; j < lines.length; j++) {
							const nextLine = lines[j].trim();
							const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
							if (nextPropertyMatch) {
								blockAssociatedProperty = nextPropertyMatch[1];
								blockPosition = 'before';
								break;
							}
							if (
								nextLine &&
								!nextLine.startsWith('//') &&
								!nextLine.startsWith('/*')
							) {
								break;
							}
						}
					}

					comments.push({
						propertyName: blockAssociatedProperty,
						comments: [
							{
								type: 'Block',
								text: blockText, // Don't trim to preserve spacing
								line: i + 1,
								column: beforeComment.indexOf('/*'),
							},
						],
						position: blockPosition,
					});

					// Now process the single-line comment
					const combinedBefore = beforeBlock + afterBlock;
					let singleAssociatedProperty: string | undefined;
					let singlePosition: 'before' | 'after' | 'inline' = 'before';

					const singlePropertyMatch = combinedBefore.trim().match(/^(\w+)\s*:/);
					if (singlePropertyMatch) {
						singleAssociatedProperty = singlePropertyMatch[1];
						singlePosition = 'inline';
					} else {
						// Look for next property
						for (let j = i + 1; j < lines.length; j++) {
							const nextLine = lines[j].trim();
							const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
							if (nextPropertyMatch) {
								singleAssociatedProperty = nextPropertyMatch[1];
								singlePosition = 'before';
								break;
							}
							if (
								nextLine &&
								!nextLine.startsWith('//') &&
								!nextLine.startsWith('/*')
							) {
								break;
							}
						}
					}

					comments.push({
						propertyName: singleAssociatedProperty,
						comments: [
							{
								type: 'SingleLine',
								text: commentText.trim(),
								line: i + 1,
								column: line.indexOf('//'),
							},
						],
						position: singlePosition,
					});

					// Clean the line by removing both comments
					const cleanedLine = (indent + combinedBefore).trimRight();
					if (cleanedLine.trim()) {
						processedLines.push(cleanedLine);
					}
					continue;
				}

				// Regular single-line comment processing
				const cleanedLine = (indent + beforeComment).trimRight();

				// Check if there's a property on this line
				const propertyMatch = beforeComment.trim().match(/^(\w+)\s*:/);

				// Determine position and associated property
				let associatedProperty: string | undefined;
				let position: 'before' | 'after' | 'inline' = 'before';

				if (propertyMatch) {
					associatedProperty = propertyMatch[1];
					position = 'inline';
				} else {
					// Look for the next property after this comment
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
						if (nextPropertyMatch) {
							associatedProperty = nextPropertyMatch[1];
							position = 'before';
							break;
						}
						// Stop if we hit another comment or significant content
						if (
							nextLine &&
							!nextLine.startsWith('//') &&
							!nextLine.startsWith('/*')
						) {
							break;
						}
					}
				}

				comments.push({
					propertyName: associatedProperty,
					comments: [
						{
							type: 'SingleLine',
							text: commentText.trim(),
							line: i + 1,
							column: line.indexOf('//'),
						},
					],
					position,
				});

				// Only keep the line if there's content before the comment
				if (cleanedLine.trim()) {
					processedLines.push(cleanedLine);
				}
				continue;
			}

			// Handle multi-line comments start
			const blockCommentStartMatch = line.match(/^(\s*)(.*)\/\*(.*)/);
			if (blockCommentStartMatch && !line.includes('*/')) {
				const [, indent, beforeComment, commentStart] = blockCommentStartMatch;
				let commentText = commentStart;
				let endLine = i;

				// Find the end of the block comment
				let afterCommentContent = '';
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j];
					const blockCommentEndMatch = nextLine.match(/(.*?)\*\/(.*)/);
					if (blockCommentEndMatch) {
						const [, commentEnd, afterComment] = blockCommentEndMatch;
						commentText += '\n' + commentEnd;
						endLine = j;
						afterCommentContent = afterComment;

						// Skip the processed lines
						i = j;
						break;
					} else {
						commentText += '\n' + nextLine;
					}
				}

				// Determine position and associated property
				let associatedProperty: string | undefined;
				let position: 'before' | 'after' | 'inline' = 'before';

				// Check if there's a property before the comment
				const propertyMatch = beforeComment.trim().match(/^(\w+)\s*:/);
				if (propertyMatch) {
					associatedProperty = propertyMatch[1];
					position = 'inline';
				} else {
					// Look for the next property after this comment
					for (let j = endLine + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						const nextPropertyMatch = nextLine.match(/^(\w+)\s*:/);
						if (nextPropertyMatch) {
							associatedProperty = nextPropertyMatch[1];
							position = 'before';
							break;
						}
						// Stop if we hit another comment or significant content
						if (
							nextLine &&
							!nextLine.startsWith('//') &&
							!nextLine.startsWith('/*')
						) {
							break;
						}
					}

					// If no next property found, look for previous property
					if (!associatedProperty) {
						for (let j = i - 1; j >= 0; j--) {
							const prevLine = lines[j].trim();
							const prevPropertyMatch = prevLine.match(/^(\w+)\s*:/);
							if (prevPropertyMatch) {
								associatedProperty = prevPropertyMatch[1];
								position = 'after';
								break;
							}
							// Stop if we hit another comment or significant content
							if (
								prevLine &&
								!prevLine.startsWith('//') &&
								!prevLine.startsWith('/*') &&
								prevLine !== ''
							) {
								break;
							}
						}
					}
				}

				comments.push({
					propertyName: associatedProperty,
					comments: [
						{
							type: 'Block',
							text: commentText, // Don't trim to preserve formatting
							line: i + 1,
							column: line.indexOf('/*'),
							endLine: endLine + 1,
							endColumn: lines[endLine]?.indexOf('*/') || 0,
						},
					],
					position,
				});

				// Only keep the line if there's content before or after the comment
				const combinedContent = beforeComment + afterCommentContent;
				if (combinedContent.trim()) {
					processedLines.push((indent + combinedContent).trimRight());
				}
				continue;
			}

			// Regular line without comments
			processedLines.push(line);
		}

		// Join the processed lines and clean up
		const cleanedStyleBody = processedLines
			.filter((line, index, arr) => {
				// Remove empty lines at start and end
				const trimmed = line.trim();
				if (!trimmed) {
					if (index === 0 || index === arr.length - 1) {
						return false;
					}
					// Remove consecutive empty lines
					const prevEmpty = index > 0 && !arr[index - 1].trim();
					if (prevEmpty) {
						return false;
					}
				}
				return true;
			})
			.join('\n');

		return { cleanedStyleBody, comments };
	}

	/**
	 * Restore comments to the style object in the StyleSheet
	 */
	public restoreCommentsToStyleSheet(
		styleObjectText: string,
		comments: PropertyComment[]
	): string {
		if (comments.length === 0) {
			return styleObjectText;
		}

		const lines = styleObjectText.split('\n');
		const restoredLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmedLine = line.trim();

			// Check if this line contains a property
			const propertyMatch = trimmedLine.match(/^(\w+)\s*:/);

			if (propertyMatch) {
				const propertyName = propertyMatch[1];
				const baseIndent = line.match(/^(\s*)/)?.[1] || '';

				// Find comments for this property
				const beforeComments = comments.filter(
					(c) => c.propertyName === propertyName && c.position === 'before'
				);
				const inlineComments = comments.filter(
					(c) => c.propertyName === propertyName && c.position === 'inline'
				);
				const afterComments = comments.filter(
					(c) => c.propertyName === propertyName && c.position === 'after'
				);

				// Add before comments
				beforeComments.forEach((commentGroup) => {
					commentGroup.comments.forEach((comment) => {
						if (comment.type === 'SingleLine') {
							restoredLines.push(`${baseIndent}// ${comment.text}`);
						} else {
							// For multi-line comments, normalize indentation
							if (comment.text.includes('\n')) {
								const commentLines = comment.text.split('\n');
								// Add the opening line with base indentation
								restoredLines.push(`${baseIndent}/*${commentLines[0]}`);
								// For middle lines, normalize indentation to avoid double-indenting
								for (let i = 1; i < commentLines.length - 1; i++) {
									// Remove any existing leading tabs/spaces and apply consistent indentation
									const cleanLine = commentLines[i].replace(/^\s*/, '');
									restoredLines.push(`${baseIndent} ${cleanLine}`);
								}
								// Add the closing line with base indentation
								restoredLines.push(
									`${baseIndent}${commentLines[commentLines.length - 1]}*/`
								);
							} else {
								restoredLines.push(`${baseIndent}/* ${comment.text.trim()} */`);
							}
						}
					});
				});

				// Add the property line with inline comments
				if (inlineComments.length > 0) {
					const inlineComment = inlineComments[0].comments[0];
					if (inlineComment.type === 'SingleLine') {
						const commentText = ` // ${inlineComment.text}`;
						restoredLines.push(line + commentText);
					} else {
						// For inline block comments, normalize indentation
						if (inlineComment.text.includes('\n')) {
							const commentLines = inlineComment.text.split('\n');
							restoredLines.push(line + ` /*${commentLines[0]}`);
							// For middle lines, normalize indentation to avoid double-indenting
							for (let i = 1; i < commentLines.length - 1; i++) {
								// Remove any existing leading tabs/spaces and apply consistent indentation
								const cleanLine = commentLines[i].replace(/^\s*/, '');
								restoredLines.push(`${baseIndent} ${cleanLine}`);
							}
							restoredLines.push(
								`${baseIndent}${commentLines[commentLines.length - 1]}*/`
							);
						} else {
							const commentText = ` /* ${inlineComment.text.trim()} */`;
							restoredLines.push(line + commentText);
						}
					}
				} else {
					restoredLines.push(line);
				}

				// Add after comments
				afterComments.forEach((commentGroup) => {
					commentGroup.comments.forEach((comment) => {
						if (comment.type === 'SingleLine') {
							restoredLines.push(`${baseIndent}// ${comment.text}`);
						} else {
							// For multi-line comments, normalize indentation
							if (comment.text.includes('\n')) {
								const commentLines = comment.text.split('\n');
								// Add the opening line with base indentation
								restoredLines.push(`${baseIndent}/*${commentLines[0]}`);
								// For middle lines, normalize indentation to avoid double-indenting
								for (let i = 1; i < commentLines.length - 1; i++) {
									// Remove any existing leading tabs/spaces and apply consistent indentation
									const cleanLine = commentLines[i].replace(/^\s*/, '');
									restoredLines.push(`${baseIndent} ${cleanLine}`);
								}
								// Add the closing line with base indentation
								restoredLines.push(
									`${baseIndent}${commentLines[commentLines.length - 1]}*/`
								);
							} else {
								restoredLines.push(`${baseIndent}/* ${comment.text.trim()} */`);
							}
						}
					});
				});
			} else {
				// Non-property line, keep as is
				restoredLines.push(line);
			}
		}

		// Handle orphaned comments (not associated with any property)
		const orphanedComments = comments.filter((c) => !c.propertyName);
		if (orphanedComments.length > 0) {
			// Add orphaned comments at the beginning
			const baseIndent = '\t\t'; // Default indentation for style object properties
			orphanedComments.forEach((commentGroup) => {
				commentGroup.comments.forEach((comment) => {
					if (comment.type === 'SingleLine') {
						restoredLines.unshift(`${baseIndent}// ${comment.text}`);
					} else {
						// For multi-line comments, normalize indentation
						if (comment.text.includes('\n')) {
							const commentLines = comment.text.split('\n');
							const multiLineComment: string[] = [];
							multiLineComment.push(`${baseIndent}/*${commentLines[0]}`);
							// For middle lines, normalize indentation to avoid double-indenting
							for (let i = 1; i < commentLines.length - 1; i++) {
								// Remove any existing leading tabs/spaces and apply consistent indentation
								const cleanLine = commentLines[i].replace(/^\s*/, '');
								multiLineComment.push(`${baseIndent} ${cleanLine}`);
							}
							multiLineComment.push(
								`${baseIndent}${commentLines[commentLines.length - 1]}*/`
							);
							// Insert all lines of the multi-line comment
							for (let i = multiLineComment.length - 1; i >= 0; i--) {
								restoredLines.unshift(multiLineComment[i]);
							}
						} else {
							restoredLines.unshift(
								`${baseIndent}/* ${comment.text.trim()} */`
							);
						}
					}
				});
			});
		}

		return restoredLines.join('\n');
	}

	/**
	 * Restore comments to dynamic properties that remain inline
	 */
	public restoreCommentsToInlineProperties(
		dynamicProps: string[],
		comments: PropertyComment[]
	): string[] {
		if (comments.length === 0) {
			return dynamicProps;
		}

		const result: string[] = [];

		for (const prop of dynamicProps) {
			// Extract property name from the dynamic property string
			const propertyMatch = prop.trim().match(/^(\w+)\s*:/);

			if (propertyMatch) {
				const propertyName = propertyMatch[1];

				// Find comments for this property
				const beforeComments = comments.filter(
					(c) => c.propertyName === propertyName && c.position === 'before'
				);
				const inlineComments = comments.filter(
					(c) => c.propertyName === propertyName && c.position === 'inline'
				);

				// Add before comments
				beforeComments.forEach((commentGroup) => {
					commentGroup.comments.forEach((comment) => {
						if (comment.type === 'SingleLine') {
							result.push(`// ${comment.text.trim()}`);
						} else {
							result.push(`/* ${comment.text.trim()} */`);
						}
					});
				});

				// Process the property itself and add inline comments
				if (inlineComments.length > 0) {
					let propWithComments = prop;
					inlineComments.forEach((commentGroup) => {
						commentGroup.comments.forEach((comment) => {
							if (comment.type === 'SingleLine') {
								propWithComments += ` // ${comment.text.trim()}`;
							} else {
								propWithComments += ` /* ${comment.text.trim()} */`;
							}
						});
					});
					result.push(propWithComments);
				} else {
					result.push(prop);
				}
			} else {
				// Property without recognizable name, just add as-is
				result.push(prop);
			}
		}

		return result;
	}
}
