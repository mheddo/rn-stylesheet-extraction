import * as vscode from 'vscode';

export interface ExtensionConfig {
	defaultStyleName: string;
	preferredStyleSheetName: string;
	autoImportStyleSheet: boolean;
	showContextMenu: boolean;
	sortStyleProperties: boolean;
	preserveComments: boolean;
	extractionLocation: 'Bottom' | 'Top' | 'After imports';
}

export class ConfigManager {
	private static readonly SECTION = 'rnStylesheetExtraction';

	static getConfig(): ExtensionConfig {
		const config = vscode.workspace.getConfiguration(this.SECTION);

		return {
			defaultStyleName: config.get('defaultStyleName', 'myStyle'),
			preferredStyleSheetName: config.get('preferredStyleSheetName', 'styles'),
			autoImportStyleSheet: config.get('autoImportStyleSheet', true),
			showContextMenu: config.get('showContextMenu', true),
			sortStyleProperties: config.get('sortStyleProperties', false),
			preserveComments: config.get('preserveComments', true),
			extractionLocation: config.get('extractionLocation', 'Bottom'),
		};
	}

	static get defaultStyleName(): string {
		return this.getConfig().defaultStyleName;
	}

	static get preferredStyleSheetName(): string {
		return this.getConfig().preferredStyleSheetName;
	}

	static get autoImportStyleSheet(): boolean {
		return this.getConfig().autoImportStyleSheet;
	}

	static get showContextMenu(): boolean {
		return this.getConfig().showContextMenu;
	}

	static get sortStyleProperties(): boolean {
		return this.getConfig().sortStyleProperties;
	}

	static get preserveComments(): boolean {
		return this.getConfig().preserveComments;
	}

	static get extractionLocation(): 'Bottom' | 'Top' | 'After imports' {
		return this.getConfig().extractionLocation;
	}

	static async updateConfig(
		key: keyof ExtensionConfig,
		value: any,
		target?: vscode.ConfigurationTarget
	) {
		const config = vscode.workspace.getConfiguration(this.SECTION);
		await config.update(
			key,
			value,
			target || vscode.ConfigurationTarget.Global
		);
	}
}
