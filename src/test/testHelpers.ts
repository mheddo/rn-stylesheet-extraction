import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Helpers for mocking VS Code UI (shared across test files)
export let origInfo: typeof vscode.window.showInformationMessage;
export let origError: typeof vscode.window.showErrorMessage;
export let origInput: typeof vscode.window.showInputBox;

export let infoMessage: string = '';
export let errorMessage: string = '';
export let inputBoxValue: string | undefined = undefined;

export async function openTempDocument(
	content: string,
	language: string = 'typescript'
) {
	const tmpDir = os.tmpdir();
	const ext = language === 'typescript' ? 'ts' : language;
	const tmpFile = path.join(
		tmpDir,
		`rn-stylesheet-extraction-test-${Date.now()}-${Math.random()
			.toString(36)
			.slice(2)}.${ext}`
	);
	fs.writeFileSync(tmpFile, content);
	const doc = await vscode.workspace.openTextDocument(tmpFile);
	await vscode.window.showTextDocument(doc, {
		preview: true,
		preserveFocus: true,
	});
	return { doc, tmpFile };
}

export async function closeAllEditors() {
	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
}

export function mockMessages() {
	origInfo = vscode.window.showInformationMessage;
	origError = vscode.window.showErrorMessage;
	origInput = vscode.window.showInputBox;
	vscode.window.showInformationMessage = (msg: string) => {
		infoMessage = msg;
		return Promise.resolve(undefined);
	};
	vscode.window.showErrorMessage = (msg: string) => {
		errorMessage = msg;
		return Promise.resolve(undefined);
	};
	vscode.window.showInputBox = (options?: vscode.InputBoxOptions) => {
		if (typeof inputBoxValue !== 'undefined') {
			return Promise.resolve(inputBoxValue);
		}
		if (options && typeof options.value === 'string') {
			return Promise.resolve(options.value);
		}
		return Promise.resolve(undefined);
	};
}

export function restoreMessages() {
	vscode.window.showInformationMessage = origInfo;
	vscode.window.showErrorMessage = origError;
	vscode.window.showInputBox = origInput;
	infoMessage = '';
	errorMessage = '';
	inputBoxValue = undefined;
}

export async function setCursorTo(doc: vscode.TextDocument, search: string) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('No active editor');
	}
	const text = doc.getText();
	const idx = text.indexOf(search);
	if (idx === -1) {
		throw new Error('Text not found: ' + search);
	}
	const pos = doc.positionAt(idx);
	editor.selection = new vscode.Selection(pos, pos);
}

export async function extractAllStylesAndGetText(
	codeBlock: string
): Promise<string> {
	const { doc } = await openTempDocument(codeBlock, 'typescript');
	await vscode.commands.executeCommand(
		'rn-stylesheet-extraction.extractAllStyles'
	);
	return await getDocumentText(doc);
}

export async function extractSingleStyleAndGetText(
	codeBlock: string,
	cursorAtText: string,
	styleName?: string
): Promise<string> {
	const { doc } = await openTempDocument(codeBlock, 'typescript');
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('No active editor');
	}
	await setCursorTo(doc, cursorAtText);
	vscode.window.showInputBox = () => Promise.resolve(styleName || 'myStyle');
	await vscode.commands.executeCommand('rn-stylesheet-extraction.extractStyle');

	return await getDocumentText(doc);
}

export async function singleExtractDefaultInputBoxText(
	codeBlock: string,
	cursorAtText: string
): Promise<string | undefined> {
	const { doc } = await openTempDocument(codeBlock, 'typescript');
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('No active editor');
	}
	await setCursorTo(doc, cursorAtText);
	// Capture the input of the input box
	// Patch showInputBox to capture the default value if no input is set
	vscode.window.showInputBox = (options?: vscode.InputBoxOptions) => {
		if (typeof inputBoxValue !== 'undefined') {
			return Promise.resolve(inputBoxValue);
		}
		if (options && typeof options.value === 'string') {
			return Promise.resolve(options.value);
		}
		return Promise.resolve(undefined);
	};

	// Trigger the command that opens the input box
	let result: string | undefined = undefined;
	const origShowInputBox = vscode.window.showInputBox;
	vscode.window.showInputBox = (options?: vscode.InputBoxOptions) => {
		if (options && typeof options.value === 'string') {
			result = options.value;
			return Promise.resolve(options.value);
		}
		return Promise.resolve(undefined);
	};
	await vscode.commands.executeCommand('rn-stylesheet-extraction.extractStyle');
	vscode.window.showInputBox = origShowInputBox;
	return result;
}

export async function getDocumentText(doc: vscode.TextDocument) {
	await doc.save();
	return doc.getText();
}
