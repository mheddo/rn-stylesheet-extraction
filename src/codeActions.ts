import * as vscode from 'vscode';

export class StyleSheetCodeActionProvider implements vscode.CodeActionProvider {
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		const actions: vscode.CodeAction[] = [];

		// Check if we're in a JSX file
		if (!this.isReactNativeFile(document)) {
			return actions;
		}

		// Check if there's inline style at cursor position
		const lineText = document.lineAt(range.start.line).text;
		if (this.hasInlineStyle(lineText)) {
			// Add quick fix for extracting style
			const extractAction = new vscode.CodeAction(
				'Extract inline style to StyleSheet',
				vscode.CodeActionKind.RefactorExtract
			);
			extractAction.command = {
				title: 'Extract Style',
				command: 'rn-stylesheet-extraction.extractStyle',
			};
			extractAction.isPreferred = true;
			actions.push(extractAction);

			// Add quick fix for extracting all styles
			const extractAllAction = new vscode.CodeAction(
				'Extract all inline styles in file',
				vscode.CodeActionKind.RefactorExtract
			);
			extractAllAction.command = {
				title: 'Extract All Styles',
				command: 'rn-stylesheet-extraction.extractAllStyles',
			};
			actions.push(extractAllAction);
		}

		return actions;
	}

	private isReactNativeFile(document: vscode.TextDocument): boolean {
		const languageId = document.languageId;
		const isJsxFile = [
			'javascript',
			'javascriptreact',
			'typescript',
			'typescriptreact',
		].includes(languageId);

		if (!isJsxFile) {
			return false;
		}

		// Check if file contains React Native imports or components
		const text = document.getText();
		return (
			/from\s+['"]react-native['"]/.test(text) ||
			/import.*react-native/.test(text) ||
			/\b(View|Text|ScrollView|TouchableOpacity|Image|StyleSheet)\b/.test(text)
		);
	}

	private hasInlineStyle(lineText: string): boolean {
		return /style\s*=\s*\{\{/.test(lineText) || /style\s*=\s*\[/.test(lineText);
	}
}
