import * as vscode from 'vscode';
import { ExtractStrings } from './constants';
import { ConfigManager } from './config';
import { StyleSheetCodeActionProvider } from './codeActions';
import {
	findExistingStyleSheets,
	getTargetStyleSheet,
	collectExistingStyleNames,
	formatPropsForStatic,
	parseStyleProperties,
	addStyleSheetAutoImport,
	generateUniqueStyleName,
	createStyleReplacement,
	createStyleObjectText,
	handleStyleReplacement,
	findStyleAttributeAtCursor,
	findJSXElementWithStyleAtCursor,
	findAllStyleAttributes,
	calculateIndentation,
	createBabelAST,
	processDynamicPropsArray,
	processStyleBody,
	createStyleObjectWithComments,
} from './extractionUtils';

/**
 * Determines the insertion position for a new StyleSheet based on the extractionLocation configuration
 */
function getStyleSheetInsertionPosition(
	document: vscode.TextDocument,
	text: string
): vscode.Position {
	const extractionLocation = ConfigManager.extractionLocation;

	switch (extractionLocation) {
		case 'Top':
			return new vscode.Position(0, 0);

		case 'After imports': {
			const importRegex =
				/^[ \t]*import\s+([\s\S]*?)from\s+['"]([^'"]+)['"];?\s*$/gm;
			let lastImportEnd = 0;
			let match: RegExpExecArray | null;

			while ((match = importRegex.exec(text)) !== null) {
				lastImportEnd = match.index! + match[0].length;
			}

			if (lastImportEnd > 0) {
				// Position after the last import with a newline
				const position = document.positionAt(lastImportEnd);
				return position;
			} else {
				// No imports found, insert at top
				return new vscode.Position(0, 0);
			}
		}

		case 'Bottom':
		default:
			// Default behavior - insert at the end of the file
			return new vscode.Position(document.lineCount, 0);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('RN StyleSheet Extraction extension activated');

	// Set initial context for menu visibility
	updateContextMenuVisibility();

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
		(event) => {
			if (
				event.affectsConfiguration('rnStylesheetExtraction.showContextMenu')
			) {
				updateContextMenuVisibility();
			}
		}
	);

	function updateContextMenuVisibility() {
		const showContextMenu = ConfigManager.showContextMenu;
		vscode.commands.executeCommand(
			'setContext',
			'rnStylesheetExtraction.showContextMenu',
			showContextMenu
		);
	}

	const disposable = vscode.commands.registerCommand(
		'rn-stylesheet-extraction.extractStyle',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const document = editor.document;
			const cursorPos = editor.selection.active;
			const text = document.getText();

			let found = false;
			let styleBody = '';
			let range: vscode.Range | undefined = undefined;
			let memberExpressionDetected = false;

			try {
				const ast = createBabelAST(text); // First, try to find if the cursor is directly within a style attribute
				const directMatch = findStyleAttributeAtCursor(
					text,
					document,
					cursorPos,
					ast
				);
				if (directMatch.found || directMatch.memberExpressionDetected) {
					found = directMatch.found;
					styleBody = directMatch.styleBody;
					range = directMatch.range;
					memberExpressionDetected = directMatch.memberExpressionDetected;
				}

				// If not found directly in style attribute, look for the most specific JSX element containing cursor
				if (!found && !memberExpressionDetected) {
					const elementMatch = findJSXElementWithStyleAtCursor(
						text,
						document,
						cursorPos,
						ast
					);
					found = elementMatch.found;
					styleBody = elementMatch.styleBody;
					range = elementMatch.range;
				}
			} catch (err) {
				console.error('Babel parse error during style extraction:', err);
			}

			// Check if MemberExpression was detected, and if so, show message and exit
			if (memberExpressionDetected) {
				vscode.window.showInformationMessage(
					ExtractStrings.memberExpressionDetected
				);
				return;
			}

			if (!found || !range) {
				vscode.window.showInformationMessage(ExtractStrings.styleBlockNotFound);
				return;
			}

			// Secondly, determine default style name
			const styleText = document.getText(range);
			// Exit if empty or invalid
			if (!styleBody || styleBody.trim() === '' || styleBody.trim() === '{}') {
				vscode.window.showInformationMessage(ExtractStrings.emptyStyleObject);
				return;
			}

			const styleSheets = findExistingStyleSheets(text);
			const targetStyleSheet = getTargetStyleSheet(styleSheets);
			const existingStyleNames = collectExistingStyleNames(styleSheets);
			const defaultStyleName = generateUniqueStyleName(existingStyleNames);
			let styleName: string | undefined;
			const validStyleName = (name: string) =>
				/^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
			while (true) {
				styleName = await vscode.window.showInputBox({
					prompt: ExtractStrings.inputBoxPrompt,
					value: defaultStyleName,
				});
				if (!styleName) {
					return;
				}
				if (!validStyleName(styleName)) {
					vscode.window.showErrorMessage(
						ExtractStrings.styleNameInvalid(styleName)
					);
					continue;
				}
				if (existingStyleNames.includes(styleName)) {
					vscode.window.showErrorMessage(
						ExtractStrings.styleNameAlreadyExists(styleName)
					);
				} else {
					break;
				}
			}

			// Parse style and separate static/dynamic props
			// Extract comments for proper parsing (always needed)
			const {
				cleanedStyleBody,
				comments,
				staticProps,
				dynamicProps,
				staticPropsFormatted,
				dynamicPropsArray,
				commentTracker,
			} = processStyleBody(
				styleBody,
				text,
				document,
				document.offsetAt(range.start),
				document.offsetAt(range.end)
			);

			// If cleanedStyleBody is just whitespace, empty, or '{}', skip parsing
			if (
				!cleanedStyleBody ||
				cleanedStyleBody.trim() === '' ||
				cleanedStyleBody.trim() === '{}'
			) {
				vscode.window.showInformationMessage(ExtractStrings.emptyStyleObject);
				return;
			}

			if (staticProps.length === 0 && dynamicProps.length === 0) {
				vscode.window.showInformationMessage(ExtractStrings.parseFailedDynamic);
				return;
			}

			// Check if there are any static properties to extract
			if (staticProps.length === 0) {
				vscode.window.showInformationMessage(ExtractStrings.allStylesDynamic);
				return;
			}

			// Handle indentation of element
			let baseIndent = '';
			let indentArray = '';
			let indentObject = '';
			if (range) {
				const indentation = calculateIndentation(document, range.start.line);
				baseIndent = indentation.baseIndent;
				indentArray = indentation.indentArray;
				indentObject = indentation.indentObject;
			}

			// Determine which variable name to use for inline usage
			let styleVarName = ConfigManager.preferredStyleSheetName;
			if (targetStyleSheet) {
				styleVarName = targetStyleSheet.name;
			} else if (styleSheets.length > 1) {
				// If multiple and no preferred name, create with preferred name
				styleVarName = ConfigManager.preferredStyleSheetName;
			}

			let styleObjectText = createStyleObjectWithComments(
				styleName,
				staticPropsFormatted,
				comments,
				commentTracker
			);

			let edit = new vscode.WorkspaceEdit();

			// Auto-import StyleSheet if missing
			if (ConfigManager.autoImportStyleSheet) {
				addStyleSheetAutoImport(edit, document, text);
			}

			// Insert style into the correct StyleSheet
			if (targetStyleSheet) {
				// Find the position of the closing brace of the style object
				const styleObjStart =
					targetStyleSheet.start +
					text.slice(targetStyleSheet.start).indexOf('{') +
					1;
				const styleObjEnd = styleObjStart + targetStyleSheet.body.length;
				const insertPos = document.positionAt(styleObjEnd - 1); // before the closing }
				edit.insert(document.uri, insertPos, '\n' + styleObjectText);
			} else {
				// If multiple StyleSheets and no configured one, create a new one using the configured location
				const insertPos = getStyleSheetInsertionPosition(document, text);
				const newSheet = `\nconst ${ConfigManager.preferredStyleSheetName} = StyleSheet.create({\n${styleObjectText}\n});\n`;
				edit.insert(document.uri, insertPos, newSheet);
			}

			// Replace inline style last
			const originalStyleText = document.getText(range);
			handleStyleReplacement(
				edit,
				document,
				range,
				originalStyleText,
				styleVarName,
				styleName,
				dynamicPropsArray,
				baseIndent,
				indentArray,
				indentObject
			);

			await vscode.workspace.applyEdit(edit);
			vscode.window.showInformationMessage(
				ExtractStrings.successfullyExtracted(styleName)
			);
		}
	);

	// Extract All Inline Styles Command
	const extractAllDisposable = vscode.commands.registerCommand(
		'rn-stylesheet-extraction.extractAllStyles',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const document = editor.document;
			const text = document.getText();

			const styleSheets = findExistingStyleSheets(text);

			// Check for duplicate StyleSheet names
			const styleSheetNameCount: Record<string, number> = {};
			for (const sheet of styleSheets) {
				styleSheetNameCount[sheet.name] =
					(styleSheetNameCount[sheet.name] || 0) + 1;
			}
			const duplicateName = Object.keys(styleSheetNameCount).find(
				(name) => styleSheetNameCount[name] > 1
			);
			if (duplicateName) {
				vscode.window.showInformationMessage(
					ExtractStrings.duplicateStyleSheet(duplicateName)
				);
				return;
			}

			// Parse for all JSX style={{...}} attributes
			let ast;
			try {
				ast = createBabelAST(text);
			} catch (err) {
				vscode.window.showErrorMessage(ExtractStrings.parseFailed);
				return;
			}

			// Find all inline style attributes
			const styleTargets = findAllStyleAttributes(text, document, ast);

			if (styleTargets.length === 0) {
				vscode.window.showInformationMessage(ExtractStrings.noStylesToExtract);
				return;
			}

			// Find all StyleSheet.create variable names and their bodies
			const existingStyleSheets = findExistingStyleSheets(text);
			const targetStyleSheet = getTargetStyleSheet(existingStyleSheets);
			const existingStyleNames = collectExistingStyleNames(existingStyleSheets);

			// Generate unique style names
			const styleNames: string[] = [];
			for (let i = 0; i < styleTargets.length; ++i) {
				const name = generateUniqueStyleName(existingStyleNames, styleNames);
				styleNames.push(name);
			}

			// Use the correct variable name for inline usages
			let styleVarName = ConfigManager.preferredStyleSheetName;
			if (targetStyleSheet) {
				styleVarName = targetStyleSheet.name;
			}

			let edit = new vscode.WorkspaceEdit();
			const staticStyleObjects: string[] = [];
			const dynamicReplacements: { idx: number; replacement: string }[] = [];

			for (let i = 0; i < styleTargets.length; ++i) {
				const {
					styleBody,
					range,
					styleText,
					baseIndent,
					indentArray,
					indentObject,
				} = styleTargets[i];
				const styleName = styleNames[i];

				// Extract comments and parse style properties
				const {
					cleanedStyleBody,
					comments,
					staticProps,
					dynamicProps,
					staticPropsFormatted,
					dynamicPropsArray,
					commentTracker,
				} = processStyleBody(
					styleBody,
					text,
					document,
					document.offsetAt(range.start),
					document.offsetAt(range.end)
				);

				// Skip this style if it has no static properties to extract
				if (staticProps.length === 0) {
					continue;
				}

				const replacement = createStyleReplacement(
					styleVarName,
					styleName,
					dynamicPropsArray,
					baseIndent,
					indentArray,
					indentObject
				);

				const styleObjectText = createStyleObjectWithComments(
					styleName,
					staticPropsFormatted,
					comments,
					commentTracker
				);

				staticStyleObjects.push(styleObjectText);
				dynamicReplacements.push({ idx: i, replacement });

				const originalStyleText = styleText;
				handleStyleReplacement(
					edit,
					document,
					range,
					originalStyleText,
					styleVarName,
					styleName,
					dynamicPropsArray,
					baseIndent,
					indentArray,
					indentObject
				);
			}

			// Insert style objects into StyleSheet
			if (staticStyleObjects.length > 0) {
				if (targetStyleSheet) {
					// Insert before the closing brace of the target StyleSheet
					const styleObjStart =
						targetStyleSheet.start +
						text.slice(targetStyleSheet.start).indexOf('{') +
						1;
					const styleObjEnd = styleObjStart + targetStyleSheet.body.length;
					const insertPos = document.positionAt(styleObjEnd - 1);
					edit.insert(
						document.uri,
						insertPos,
						'\n' + staticStyleObjects.join('\n')
					);
				} else {
					const insertPos = getStyleSheetInsertionPosition(document, text);
					const newSheet = `\nconst ${
						ConfigManager.preferredStyleSheetName
					} = StyleSheet.create({\n${staticStyleObjects.join('\n')}\n});\n`;
					edit.insert(document.uri, insertPos, newSheet);
				}

				// Auto-import StyleSheet if missing
				addStyleSheetAutoImport(edit, document, text);
			}

			if (staticStyleObjects.length === 0) {
				vscode.window.showInformationMessage(ExtractStrings.allStylesDynamic);
				return;
			}

			await vscode.workspace.applyEdit(edit);
			vscode.window.showInformationMessage(
				ExtractStrings.multipleSuccessfullyExtracted(staticStyleObjects.length)
			);
		}
	);

	context.subscriptions.push(disposable);
	context.subscriptions.push(extractAllDisposable);
	context.subscriptions.push(configChangeDisposable);

	const codeActionProvider = vscode.languages.registerCodeActionsProvider(
		['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
		new StyleSheetCodeActionProvider(),
		{
			providedCodeActionKinds: [vscode.CodeActionKind.RefactorExtract],
		}
	);
	context.subscriptions.push(codeActionProvider);
}

export function deactivate() {
	console.log('RN StyleSheet Extraction extension deactivated');
}
