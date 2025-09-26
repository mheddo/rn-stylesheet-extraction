import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';
import { ConfigManager } from './config';
import { CommentTracker } from './commentTracker';

export interface StyleSheet {
	name: string;
	body: string;
	start: number;
	end: number;
}

export interface ParsedStyleProperties {
	staticProps: string[];
	dynamicProps: string[];
}

export interface StyleTarget {
	range: vscode.Range;
	styleBody: string;
	styleText: string;
	baseIndent: string;
	indentArray: string;
	indentObject: string;
}

export interface StyleAttributeMatch {
	range: vscode.Range;
	styleBody: string;
	found: boolean;
	memberExpressionDetected: boolean;
}

/**
 * Finds all existing StyleSheets in the document text
 */
export function findExistingStyleSheets(text: string): StyleSheet[] {
	const styleSheetRegex =
		/const\s+(\w+)\s*=\s*StyleSheet\.create\(\s*\{([\s\S]*?)\}\s*\)/g;
	const styleSheets: StyleSheet[] = [];
	let match;

	while ((match = styleSheetRegex.exec(text)) !== null) {
		const name = match[1];
		const body = match[2];
		const start = match.index;
		const end = styleSheetRegex.lastIndex;
		styleSheets.push({ name, body, start, end });
	}

	return styleSheets;
}

/**
 * Determines the target StyleSheet based on configuration and existing StyleSheets
 */
export function getTargetStyleSheet(
	styleSheets: StyleSheet[]
): StyleSheet | null {
	if (styleSheets.length > 1) {
		return (
			styleSheets.find(
				(s) => s.name === ConfigManager.preferredStyleSheetName
			) || null
		);
	} else if (styleSheets.length === 1) {
		return styleSheets[0];
	}
	return null;
}

/**
 * Collects all existing style names from all StyleSheets to avoid conflicts
 */
export function collectExistingStyleNames(styleSheets: StyleSheet[]): string[] {
	const existingStyleNames: string[] = [];
	const keyRegex = /(\w+)\s*:/g;

	for (const sheet of styleSheets) {
		let matchKey;
		while ((matchKey = keyRegex.exec(sheet.body)) !== null) {
			existingStyleNames.push(matchKey[1]);
		}
		// Reset regex lastIndex for next iteration
		keyRegex.lastIndex = 0;
	}

	return existingStyleNames;
}

/**
 * Formats static properties for StyleSheet creation
 */
export function formatPropsForStatic(arr: string[]): string {
	let processedProps = arr
		.map((l) => l.replace(/,$/, '').trim())
		.filter((l) => l);

	// Sort properties alphabetically if enabled
	if (ConfigManager.sortStyleProperties) {
		processedProps = processedProps.sort((a, b) => {
			const nameA = a.split(':')[0].trim();
			const nameB = b.split(':')[0].trim();
			return nameA.localeCompare(nameB);
		});
	}

	return processedProps.join(', ');
}

/**
 * Helper function to properly indent multi-line properties
 */
export function indentPropertyCode(code: string, indent: string): string {
	const lines = code.split('\n');
	if (lines.length === 1) {
		const trimmedCode = code.trim();
		if (trimmedCode.startsWith('//') || trimmedCode.startsWith('/*')) {
			return indent + code;
		}
		return indent + code + ',';
	}
	return lines
		.map((line, index) => {
			const trimmedLine = line.trim();
			if (index === 0) {
				return indent + line;
			} else if (index === lines.length - 1) {
				if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
					return indent + line;
				}
				return indent + line + ',';
			} else {
				return indent + line;
			}
		})
		.join('\n');
}

/**
 * Parses style body to separate static and dynamic properties
 */
export function parseStyleProperties(
	cleanedStyleBody: string
): ParsedStyleProperties {
	const staticProps: string[] = [];
	const dynamicProps: string[] = [];

	try {
		const ast = parser.parse(`({${cleanedStyleBody}})`, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript', 'decorators-legacy'],
		});

		traverse(ast, {
			ObjectProperty(path: NodePath<t.ObjectProperty>) {
				// Only process top-level properties of the style object
				// Skip nested properties from complex expressions
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
	} catch (err) {
		// Return empty arrays if parsing fails
		return { staticProps: [], dynamicProps: [] };
	}

	return { staticProps, dynamicProps };
}

/**
 * Auto-imports StyleSheet from react-native if missing
 */
export function addStyleSheetAutoImport(
	edit: vscode.WorkspaceEdit,
	document: vscode.TextDocument,
	text: string
): void {
	if (!/StyleSheet/.test(text)) {
		// Parse all import statements and look for one from 'react-native'
		const importRegex =
			/^[ \t]*import\s+([\s\S]+?)from\s+['"]([^'\"]+)['"];?/gm;
		let match: RegExpExecArray | null;
		let rnImport: RegExpExecArray | null = null;
		let lastImport: RegExpExecArray | null = null;

		while ((match = importRegex.exec(text)) !== null) {
			lastImport = match;
			if (match[2] === 'react-native') {
				rnImport = match;
			}
		}

		if (rnImport) {
			const importStart = rnImport.index!;
			const importEnd = importStart + rnImport[0].length;
			const importStatement = rnImport[0];
			const specifierMatch = importStatement.match(/\{([^}]*)\}/);

			if (specifierMatch) {
				let imports = specifierMatch[1]
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
				if (!imports.includes('StyleSheet')) {
					imports.push('StyleSheet');
					const newImport = importStatement.replace(
						/\{[^}]*\}/,
						`{ ${imports.join(', ')} }`
					);
					edit.replace(
						document.uri,
						new vscode.Range(
							document.positionAt(importStart),
							document.positionAt(importEnd)
						),
						newImport
					);
				}
			} else {
				const newImport = importStatement.replace(
					/import\s+([\w_]+)\s+from/,
					'import { $1, StyleSheet } from'
				);
				edit.replace(
					document.uri,
					new vscode.Range(
						document.positionAt(importStart),
						document.positionAt(importEnd)
					),
					newImport
				);
			}
		} else {
			// No import from react-native, insert a new one after the last import
			let insertPos;
			if (lastImport) {
				insertPos = document.positionAt(
					lastImport.index! + lastImport[0].length
				);
			} else {
				insertPos = new vscode.Position(0, 0);
			}
			edit.insert(
				document.uri,
				insertPos,
				`\nimport { StyleSheet } from 'react-native';`
			);
		}
	}
}

/**
 * Generates a unique style name that doesn't conflict with existing names
 */
export function generateUniqueStyleName(
	existingStyleNames: string[],
	additionalNames: string[] = []
): string {
	let counter = 1;
	const baseStyleName = ConfigManager.defaultStyleName;
	let styleName = `${baseStyleName}${counter}`;

	while (
		existingStyleNames.includes(styleName) ||
		additionalNames.includes(styleName)
	) {
		counter++;
		styleName = `${baseStyleName}${counter}`;
	}

	return styleName;
}

/**
 * Creates the replacement text for inline styles
 */
export function createStyleReplacement(
	styleVarName: string,
	styleName: string,
	dynamicPropsArray: string[],
	baseIndent: string,
	indentArray: string,
	indentObject: string
): string {
	if (dynamicPropsArray.length > 0) {
		const dynamicLines = dynamicPropsArray
			.map((l: string) => indentPropertyCode(l, indentObject))
			.join('\n');

		return `style={[\n${indentArray}${styleVarName}.${styleName},\n${indentArray}{\n${dynamicLines}\n${indentArray}},\n${baseIndent}]}`;
	} else {
		return `style={${styleVarName}.${styleName}}`;
	}
}

/**
 * Creates the style object text for StyleSheet
 */
export function createStyleObjectText(
	styleName: string,
	staticPropsFormatted: string
): string {
	const staticLines = staticPropsFormatted
		.split(', ')
		.map((l) => '\t\t' + l + ',')
		.join('\n');

	return `\t${styleName}: {\n${staticLines}\n\t},`;
}

/**
 * Handles the replacement logic for both array objects and complete style attributes
 */
export function handleStyleReplacement(
	edit: vscode.WorkspaceEdit,
	document: vscode.TextDocument,
	range: vscode.Range,
	originalStyleText: string,
	styleVarName: string,
	styleName: string,
	dynamicPropsArray: string[],
	baseIndent: string,
	indentArray: string,
	indentObject: string
): void {
	// Check if this is an object within an array or a standalone object
	if (originalStyleText.match(/^\s*\{[\s\S]*\}\s*$/)) {
		// This is an object within an array, replace just the object with the style reference
		const newReplacement =
			dynamicPropsArray.length > 0
				? `[\n${indentArray}${styleVarName}.${styleName},\n${indentArray}{\n${dynamicPropsArray
						.map((l: string) => {
							const lines = l.split('\n');
							if (lines.length === 1) {
								const trimmedLine = l.trim();
								if (
									trimmedLine.startsWith('//') ||
									trimmedLine.startsWith('/*')
								) {
									return indentObject + l;
								}
								return indentObject + l + ',';
							}
							return lines
								.map((line, index) => {
									const trimmedLine = line.trim();
									if (index === 0) {
										return indentObject + line;
									} else if (index === lines.length - 1) {
										if (
											trimmedLine.startsWith('//') ||
											trimmedLine.startsWith('/*')
										) {
											return indentObject + line;
										}
										return indentObject + line + ',';
									} else {
										return indentObject + line;
									}
								})
								.join('\n');
						})
						.join('\n')}\n${indentArray}},\n${baseIndent.slice(1)}]`
				: `${styleVarName}.${styleName}`;
		edit.replace(document.uri, range, newReplacement);
	} else {
		// This is a complete style attribute, use the original replacement logic
		const replacement = createStyleReplacement(
			styleVarName,
			styleName,
			dynamicPropsArray,
			baseIndent,
			indentArray,
			indentObject
		);
		edit.replace(
			document.uri,
			range,
			originalStyleText.replace(/style\s*=\s*\{\{[\s\S]*?\}\}/, replacement)
		);
	}
}

/**
 * Creates a vscode Range from Babel AST location
 */
export function createRangeFromLoc(loc: any): vscode.Range {
	const start = new vscode.Position(loc.start.line - 1, loc.start.column);
	const end = new vscode.Position(loc.end.line - 1, loc.end.column);
	return new vscode.Range(start, end);
}

/**
 * Calculates indentation based on a document line
 */
export function calculateIndentation(
	document: vscode.TextDocument,
	line: number
): {
	baseIndent: string;
	indentArray: string;
	indentObject: string;
} {
	const elementLineText = document.lineAt(line).text;
	const baseIndentMatch = elementLineText.match(/^(\s*)/);
	const baseIndent = baseIndentMatch ? baseIndentMatch[1] : '';
	const indentArray = baseIndent + '\t';
	const indentObject = indentArray + '\t';

	return { baseIndent, indentArray, indentObject };
}

/**
 * Finds style attribute at cursor position for single extraction
 */
export function findStyleAttributeAtCursor(
	text: string,
	document: vscode.TextDocument,
	cursorPos: vscode.Position,
	ast: any
): StyleAttributeMatch {
	let found = false;
	let styleBody = '';
	let range: vscode.Range | undefined = undefined;
	let memberExpressionDetected = false;

	// First, try to find if the cursor is directly within a style attribute
	traverse(ast, {
		JSXAttribute(path: any) {
			if (
				path.node.name.type === 'JSXIdentifier' &&
				path.node.name.name === 'style' &&
				path.node.value &&
				path.node.value.type === 'JSXExpressionContainer'
			) {
				const expression = path.node.value.expression;
				const loc = path.node.loc;
				if (!loc) {
					return;
				}

				const attrRange = createRangeFromLoc(loc);

				if (attrRange.contains(cursorPos)) {
					const raw = text.slice(
						document.offsetAt(attrRange.start),
						document.offsetAt(attrRange.end)
					);

					// MemberExpression, for example 'style={styles.myStyle}'
					if (expression.type === 'MemberExpression') {
						memberExpressionDetected = true;
						path.stop();
						return;
					}
					// Object expressions, for example style={{...}}
					else if (expression.type === 'ObjectExpression') {
						const match = raw.match(/style\s*=\s*\{\{([\s\S]*?)\}\}/);
						if (match) {
							styleBody = match[1].trim();
							range = attrRange;
							found = true;
							path.stop();
						}
					}
					// Array expressions, for example style={[...]}
					else if (expression.type === 'ArrayExpression') {
						// Find object expressions within the array that contain the cursor
						for (let i = 0; i < expression.elements.length; i++) {
							const element = expression.elements[i];
							if (
								element &&
								element.type === 'ObjectExpression' &&
								element.loc
							) {
								const elemRange = createRangeFromLoc(element.loc);

								if (elemRange.contains(cursorPos)) {
									const elemRaw = text.slice(
										document.offsetAt(elemRange.start),
										document.offsetAt(elemRange.end)
									);
									// Extract just the object content (without braces)
									const objMatch = elemRaw.match(/^\s*\{([\s\S]*?)\}\s*$/);
									if (objMatch) {
										styleBody = objMatch[1].trim();
										range = elemRange;
										found = true;
										path.stop();
										break;
									}
								}
							}
						}
					}
				}
			}
		},
	});

	return {
		range: range || new vscode.Range(0, 0, 0, 0),
		styleBody,
		found,
		memberExpressionDetected,
	};
}

/**
 * Finds all style attributes for bulk extraction
 */
export function findAllStyleAttributes(
	text: string,
	document: vscode.TextDocument,
	ast: any
): StyleTarget[] {
	const styleTargets: StyleTarget[] = [];

	traverse(ast, {
		JSXAttribute(path: any) {
			if (
				path.node.name.type === 'JSXIdentifier' &&
				path.node.name.name === 'style' &&
				path.node.value &&
				path.node.value.type === 'JSXExpressionContainer'
			) {
				const expression = path.node.value.expression;
				const loc = path.node.loc;
				if (!loc) {
					return;
				}

				if (expression.type === 'ObjectExpression') {
					const attrRange = createRangeFromLoc(loc);
					const raw = text.slice(
						document.offsetAt(attrRange.start),
						document.offsetAt(attrRange.end)
					);
					const match = raw.match(/style\s*=\s*\{\{([\s\S]*?)\}\}/);
					if (match) {
						const styleBody = match[1].trim();
						if (!styleBody || styleBody === '{}') {
							return;
						}
						const { baseIndent, indentArray, indentObject } =
							calculateIndentation(document, attrRange.start.line);

						styleTargets.push({
							range: attrRange,
							styleBody,
							styleText: raw,
							baseIndent,
							indentArray,
							indentObject,
						});
					}
				} else if (expression.type === 'ArrayExpression') {
					for (let i = 0; i < expression.elements.length; i++) {
						const element = expression.elements[i];
						if (element && element.type === 'ObjectExpression' && element.loc) {
							const elemRange = createRangeFromLoc(element.loc);

							const elemRaw = text.slice(
								document.offsetAt(elemRange.start),
								document.offsetAt(elemRange.end)
							);
							const objMatch = elemRaw.match(/^\s*\{([\s\S]*?)\}\s*$/);
							if (objMatch) {
								const styleBody = objMatch[1].trim();
								if (!styleBody || styleBody === '{}') {
									continue;
								}
								const { baseIndent, indentArray, indentObject } =
									calculateIndentation(document, elemRange.start.line);

								styleTargets.push({
									range: elemRange,
									styleBody,
									styleText: elemRaw,
									baseIndent,
									indentArray,
									indentObject,
								});
							}
						}
					}
				}
			}
		},
	});

	return styleTargets;
}

/**
 * Finds the most specific JSX element containing the cursor when direct style attribute isn't found
 */
export function findJSXElementWithStyleAtCursor(
	text: string,
	document: vscode.TextDocument,
	cursorPos: vscode.Position,
	ast: any
): StyleAttributeMatch {
	let found = false;
	let styleBody = '';
	let range: vscode.Range | undefined = undefined;

	let candidateElements: Array<{
		element: any;
		loc: any;
		depth: number;
	}> = [];

	// First pass: collect all JSX elements containing the cursor
	traverse(ast, {
		JSXElement(path: any) {
			const loc = path.node.loc;
			if (!loc) {
				return;
			}

			const elementRange = createRangeFromLoc(loc);

			if (elementRange.contains(cursorPos)) {
				// Calculate depth based on AST path
				const depth = path.getFunctionParent()
					? path.getAncestry().length
					: path.getAncestry().length;
				candidateElements.push({
					element: path.node,
					loc: loc,
					depth: depth,
				});
			}
		},
	});

	// Sort and position to get the most specific element
	candidateElements.sort((a, b) => {
		// First sort by depth (deeper elements first)
		if (b.depth !== a.depth) {
			return b.depth - a.depth;
		}
		// Then by start position (later in document first, meaning more specific)
		return (
			b.loc.start.line - a.loc.start.line ||
			b.loc.start.column - a.loc.start.column
		);
	});

	// Find the first candidate with a style attribute
	for (const candidate of candidateElements) {
		const openingElement = candidate.element.openingElement;
		if (openingElement && openingElement.attributes) {
			for (const attr of openingElement.attributes) {
				if (
					attr.type === 'JSXAttribute' &&
					attr.name.type === 'JSXIdentifier' &&
					attr.name.name === 'style' &&
					attr.value &&
					attr.value.type === 'JSXExpressionContainer'
				) {
					const expression = attr.value.expression;
					const attrLoc = attr.loc;
					if (!attrLoc) {
						continue;
					}
					const attrRange = createRangeFromLoc(attrLoc);
					const raw = text.slice(
						document.offsetAt(attrRange.start),
						document.offsetAt(attrRange.end)
					);

					if (expression.type === 'MemberExpression') {
						// Skip this element and continue looking for inline styles
						continue;
					} else if (expression.type === 'ObjectExpression') {
						const match = raw.match(/style\s*=\s*\{\{([\s\S]*?)\}\}/);
						if (match) {
							styleBody = match[1].trim();
							range = attrRange;
							found = true;
							break;
						}
					} else if (expression.type === 'ArrayExpression') {
						// Find the first object expression in the array
						for (let i = 0; i < expression.elements.length; i++) {
							const element = expression.elements[i];
							if (
								element &&
								element.type === 'ObjectExpression' &&
								element.loc
							) {
								const elemRange = createRangeFromLoc(element.loc);

								const elemRaw = text.slice(
									document.offsetAt(elemRange.start),
									document.offsetAt(elemRange.end)
								);
								// Extract just the object content (without braces)
								const objMatch = elemRaw.match(/^\s*\{([\s\S]*?)\}\s*$/);
								if (objMatch) {
									styleBody = objMatch[1].trim();
									range = elemRange;
									found = true;
									break;
								}
							}
						}
						if (found) {
							break;
						}
					}
				}
			}
			if (found) {
				break;
			}
		}
	}

	return {
		range: range || new vscode.Range(0, 0, 0, 0),
		styleBody,
		found,
		memberExpressionDetected: false,
	};
}

/**
 * Creates a Babel AST from text with standard React Native plugins
 */
export function createBabelAST(text: string): any {
	return parser.parse(text, {
		sourceType: 'module',
		plugins: ['jsx', 'typescript', 'decorators-legacy'],
	});
}

/**
 * Processes dynamic props array by removing commas and trimming
 */
export function processDynamicPropsArray(dynamicProps: string[]): string[] {
	return dynamicProps.map((l) => l.replace(/,$/, '').trim()).filter((l) => l);
}

/**
 * Processes style body with comment extraction and property parsing
 */
export function processStyleBody(
	styleBody: string,
	text: string,
	document: vscode.TextDocument,
	rangeStart: number,
	rangeEnd: number
): {
	cleanedStyleBody: string;
	comments: any[];
	staticProps: string[];
	dynamicProps: string[];
	staticPropsFormatted: string;
	dynamicPropsArray: string[];
	commentTracker: CommentTracker;
} {
	const commentTracker = new CommentTracker(
		text,
		document,
		rangeStart,
		rangeEnd
	);
	const { cleanedStyleBody, comments } =
		commentTracker.extractComments(styleBody);

	const { staticProps, dynamicProps } = parseStyleProperties(cleanedStyleBody);
	const staticPropsFormatted = formatPropsForStatic(staticProps);

	// Process dynamic props and restore their comments
	let dynamicPropsArray = processDynamicPropsArray(dynamicProps);
	if (ConfigManager.preserveComments) {
		dynamicPropsArray = commentTracker.restoreCommentsToInlineProperties(
			dynamicPropsArray,
			comments
		);
	}

	return {
		cleanedStyleBody,
		comments,
		staticProps,
		dynamicProps,
		staticPropsFormatted,
		dynamicPropsArray,
		commentTracker,
	};
}

/**
 * Creates style object text with optional comment restoration
 */
export function createStyleObjectWithComments(
	styleName: string,
	staticPropsFormatted: string,
	comments: any[],
	commentTracker: CommentTracker
): string {
	let styleObjectText = createStyleObjectText(styleName, staticPropsFormatted);

	if (ConfigManager.preserveComments) {
		styleObjectText = commentTracker.restoreCommentsToStyleSheet(
			styleObjectText,
			comments
		);
	}

	return styleObjectText;
}
