export const ExtractStrings = {
	duplicateStyleSheet: (duplicateName: string) =>
		`There are multiple StyleSheets named '${duplicateName}'. Please ensure StyleSheet names are unique.`,
	styleNameAlreadyExists: (styleName: string) =>
		`Style '${styleName}' already exists. Please choose a different name.`,
	styleNameInvalid: (styleName: string) =>
		`Style name '${styleName}' is invalid. Use only letters, numbers, and underscores, and do not start with a number.`,
	successfullyExtracted: (styleName: string) =>
		`Style '${styleName}' extracted!`,
	multipleSuccessfullyExtracted: (count: number) =>
		`Extracted ${count} style${count > 1 ? 's' : ''}`,
	inputBoxPrompt: 'Enter a name for this style',
	styleBlockNotFound:
		'No style block found in the JSX element containing the cursor.',
	noStylesToExtract: 'No style objects found to extract.',
	parseFailed: 'Failed to parse file for extraction.',
	parseFailedDynamic: 'Failed to parse style for dynamic props.',
	emptyStyleObject: 'Style object is empty. Nothing to extract.',
	allStylesDynamic:
		'All style properties are dynamic. No static styles to extract.',
	memberExpressionDetected:
		'This style is already extracted to a StyleSheet. Select an inline style object to extract instead.',
};
