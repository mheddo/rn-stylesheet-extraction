export const noStyleSheetMultipleProps = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ backgroundColor: 'yellow', height: 50 }} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
`;

export const noStyleSheetSingleProp = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<View style={{ backgroundColor: 'red', width: 100 }} />
	);
}
`;

export const noStyleSheetNoImport = `
import React from 'react';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
`;

export const noReactNativeImportWithExistingStyleSheet = `
import React from 'react';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const noStyleSheetImportWithExistingStyleSheet = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const existingStyleSheetWithDefaultName = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const existingStyleSheetWithNonDefaultName = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={customStylesName.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const customStylesName = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const threeExistingStyleSheetWithIncludingDefaultNameV1 = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={customStylesName1.myStyle1} />
			<View style={customStylesName2.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
const customStylesName1 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
const customStylesName2 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'blue',
		width: 50,
	},
});
`;

export const threeExistingStyleSheetWithIncludingDefaultNameV2 = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={customStylesName1.myStyle1} />
			<View style={customStylesName2.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const customStylesName1 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
const customStylesName2 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'blue',
		width: 50,
	},
});
`;

export const threeExistingStyleSheetWithIncludingDefaultNameV3 = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={customStylesName1.myStyle1} />
			<View style={customStylesName2.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const customStylesName1 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
const customStylesName2 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'blue',
		width: 50,
	},
});
const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const threeExistingStyleSheetWithoutDefaultName = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={customStylesName1.myStyle1} />
			<View style={customStylesName2.myStyle1} />
			<View style={customStylesName3.myStyle1} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const customStylesName1 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
const customStylesName2 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'blue',
		width: 50,
	},
});
const customStylesName3 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const alreadyExtractedCode = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={customStylesName1.myStyle1} />
			<View style={customStylesName2.myStyle1} />
			<View style={customStylesName3.myStyle1} />
		</>
	);
}
const customStylesName1 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
const customStylesName2 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'blue',
		width: 50,
	},
});
const customStylesName3 = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
`;

export const myStyle2AlreadyExtracted = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={styles.myStyle2} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
	myStyle2: {
		backgroundColor: 'yellow',
		height: 50,
	},
});
`;

export const emptyStyleSheet = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ backgroundColor: 'yellow', height: 50 }} />
			<View style={{ color: 'green', height: 100 }} />
		</>
	);
}
const styles = StyleSheet.create({
});`;

export const multilineInlineStyles = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ 
				backgroundColor: 'red', 
				width: 100 ,
				height: 200,
				marginVertical: 8,
				alignItems: 'flex-end',
				justifyContent: 'flex-start',
			}} />
			<View style={{ 
				backgroundColor: 'green', 
				width: 200 ,
				height: 100,
				marginHorizontal: 8,
				alignItems: 'flex-start',
				justifyContent: 'flex-end',
			}} />
			<View style={{ 
				backgroundColor: 'yellow', 
				width: 150 ,
				height: 150,
				margin: 8,
				alignItems: 'flex-end',
				justifyContent: 'flex-end',
			}} />
		</>
	);
};
`;

export const duplicateNamedStyleSheets = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={styles.myStyle2} />
			<View style={{ backgroundColor: 'yellow', width: 150 }} />
			<View style={{ backgroundColor: 'blue', width: 120 }} />
		</>
	);
};

const customStyle = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});
const customStyle = StyleSheet.create({
	myStyle2: {
		backgroundColor: 'green',
		width: 200,
	},
});
`;

export const duplicateNamedStylesExist = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={styles.myStyle1} />
			<View style={styles.myStyle2} />
			<View style={{ backgroundColor: 'yellow', width: 150 }} />
			<View style={{ backgroundColor: 'blue', width: 120 }} />
		</>
	);
};

const customStyle = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
	myStyle1: {
		backgroundColor: 'green',
		width: 200,
	},
});
`;

export const twoJSXElementsWithMissingStyleSheet = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ backgroundColor: 'yellow', height: 50 }} />
			<View style={{ backgroundColor: 'green', height: 100 }} />
		</>
	);
}
export function SecondComponent() {
	return (
		<>
			<View style={{ backgroundColor: 'black', width: 25 }} />
			<View style={{ backgroundColor: 'white', height: 75 }} />
			<View style={{ backgroundColor: 'orange', height: 125 }} />
		</>
	);
}
`;

export const deeplyNestedJSX = `
import React from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
export default function App() {
	return (
		<SafeAreaView>
			<ScrollView>
				<View style={{ padding: 20 }}>
					<View style={{ marginVertical: 10 }}>
						<View style={{ flexDirection: 'row' }}>
							<View style={{ flex: 1, backgroundColor: 'red' }}>
								<AnimatedView
									id="ID"
									accessible={true}
									accessibilityLabel="test accessibility label"
									style={{
										backgroundColor: 'red',
										width: 100,
										height: 200,
										marginVertical: 8,
										alignItems: 'flex-end',
										justifyContent: 'flex-start',
									}}
									testID="testID"
									onLayout={() => {}}
								/** End tag*/>
									<View style={{ borderRadius: 8, backgroundColor: 'blue'}}>
										<View style={{ margin: 2, height: 50 }} />
									</View>
								</AnimatedView>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
`;

export const stylesWithJSExpressions = `
import React from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const MARGIN = 10;

export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: width * 0.5 }} />
			<View style={{ backgroundColor: 'yellow', margin: MARGIN * 2 }} />
			<View style={{ color: 'green', height: Math.floor(100 * 1.5) }} />
		</>
	);
}
`;

export const reallyMalformedStyles = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ backgroundColor: 'yellow', height: !@#$%^&*() }} />
		</>
	);
}
`;

export const arrayCaseStyleNoStyleSheet = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<View
			style={[
				config[colorScheme!],
				{ flex: 1, height: '100%', width: '100%' },
				props.style,
			]}
		/>
	);
}
`;

export const allDynamicStylesSingle = `
import React from 'react';
import { View } from 'react-native';

const isWideScreen = true;
const rightHandMode = false;

export default function App() {
	return (
		<View
			style={{
				flexDirection: isWideScreen
					? rightHandMode
						? 'row'
						: 'row-reverse'
					: 'column',
			}}
		>
		</View>
	);
}
`;

export const allDynamicStylesMultiple = `
import React from 'react';
import { View } from 'react-native';

const isVisible = true;
const theme = 'dark';
const screenWidth = 375;

export default function App() {
	return (
		<>
			<View
				style={{
					opacity: isVisible ? 1 : 0,
					backgroundColor: theme === 'dark' ? '#000' : '#fff',
				}}
			>
			</View>
			<View
				style={{
					width: screenWidth * 0.8,
					height: Math.floor(screenWidth / 2),
				}}
			>
			</View>
		</>
	);
}
`;

export const mixedStaticAndDynamicStyles = `
import React from 'react';
import { View } from 'react-native';

const isWideScreen = true;
const rightHandMode = false;

export default function App() {
	return (
		<View
			style={{
				backgroundColor: 'red',
				padding: 10,
				flexDirection: isWideScreen
					? rightHandMode
						? 'row'
						: 'row-reverse'
					: 'column',
			}}
		>
		</View>
	);
}
`;

export const extractAllStyleSheetCode = `const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
	myStyle2: {
		backgroundColor: 'yellow',
		height: 50,
	},
	myStyle3: {
		color: 'green',
		height: 100,
	},
});`;

export const extractedMultilineStyleSheetCode = `const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
		height: 200,
		marginVertical: 8,
		alignItems: 'flex-end',
		justifyContent: 'flex-start',
	},
	myStyle2: {
		backgroundColor: 'green',
		width: 200,
		height: 100,
		marginHorizontal: 8,
		alignItems: 'flex-start',
		justifyContent: 'flex-end',
	},
	myStyle3: {
		backgroundColor: 'yellow',
		width: 150,
		height: 150,
		margin: 8,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
	},
});`;

export const extractedWhenDuplicateStyleNames = `const customStyle = StyleSheet.create({
        myStyle1: {
                backgroundColor: 'red',
                width: 100,
        },
        myStyle1: {
                backgroundColor: 'green',
                width: 200,
        },
        myStyle2: {
                backgroundColor: 'yellow',
                width: 150,
        },
        myStyle3: {
                backgroundColor: 'blue',
                width: 120,
        },
});`;

export const extractedWhenTwoComponentsExist = `const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
	myStyle2: {
		backgroundColor: 'yellow',
		height: 50,
	},
	myStyle3: {
		backgroundColor: 'green',
		height: 100,
	},
	myStyle4: {
		backgroundColor: 'black',
		width: 25,
	},
	myStyle5: {
		backgroundColor: 'white',
		height: 75,
	},
	myStyle6: {
		backgroundColor: 'orange',
		height: 125,
	},
});`;

export const extractSingleStyleSheetCode = `const styles = StyleSheet.create({
	myStyle1: {
		backgroundColor: 'red',
		width: 100,
	},
});`;

export const extractArrayEdgeCaseStyleSheetCode = `const styles = StyleSheet.create({
	myStyle1: {
		flex: 1,
		height: '100%',
		width: '100%',
	},
});`;

export const simpleViewWithInlineStyle = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return <View style={{ backgroundColor: 'red', width: 100 }} />;
}`;

export const multipleViewsWithInlineStyles = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return (
		<>
			<View style={{ backgroundColor: 'red', width: 100 }} />
			<View style={{ backgroundColor: 'blue', height: 50 }} />
		</>
	);
}`;

export const viewWithConflictingStyleNames = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	btn1: { color: 'black' },
	btn3: { fontSize: 16 },
});

export default function App() {
	return <View style={{ backgroundColor: 'red', width: 100 }} />;
}`;

export const existingStyleSheetWithConfigurableName = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const otherStyles = StyleSheet.create({
	existing1: { color: 'black' },
});

const themeStyles = StyleSheet.create({
	existing2: { fontSize: 16 },
});

export default function App() {
	return <View style={{ backgroundColor: 'red', width: 100 }} />;
}`;

export const complexConflictScenario = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const otherStyles = StyleSheet.create({
	item1: { color: 'black' },
});

const listStyles = StyleSheet.create({
	item2: { fontSize: 16 },
	item4: { fontWeight: 'bold' },
});

export default function App() {
	return <View style={{ backgroundColor: 'red', width: 100 }} />;
}`;

export const simpleViewNoStyleSheetImport = `
import React from 'react';
import { View } from 'react-native';
export default function App() {
	return <View style={{ backgroundColor: 'red', width: 100 }} />;
}`;

export const memberExpressionWithInlineStyles = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const TestComponent = () => {
	return (
		<View
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: 'white',
			}}
		>
			<View>
				<View
					style={{
						marginVertical: 8,
						alignItems: 'flex-end',
						justifyContent: 'flex-start',
						flexDirection: 'row',
					}}
				>
				</View>
			</View>
			<View
				style={styles.myStyle1}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	myStyle1: {
		flex: 1,
		backgroundColor: 'beige',
	},
});

export default TestComponent;`;

export const onlyMemberExpressions = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const TestComponent = () => {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.content} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: 50,
	},
	content: {
		backgroundColor: 'blue',
	},
});

export default TestComponent;`;

export const sortPropertiesSingleExtract = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ zIndex: 10, backgroundColor: 'red', fontSize: 16, alignItems: 'center' }}>
			Content
		</View>
	);
}`;

export const sortPropertiesExtractAll = `
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
	return (
		<View style={{ zIndex: 10, backgroundColor: 'red', padding: 20 }}>
			<Text style={{ fontWeight: 'bold', fontSize: 16, color: 'blue' }}>Hello</Text>
		</View>
	);
}`;

export const sortPropertiesSingleProperty = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ backgroundColor: 'red' }}>
			Content
		</View>
	);
}`;

export const sortPropertiesComplexNames = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ 
			'z-index': 10,
			'background-color': 'red',
			'font-size': 16,
			'align-items': 'center'
		}}>
			Content
		</View>
	);
}`;

export const sortPropertiesMixedNaming = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ 
			zIndex: 10,
			'background-color': 'red',
			fontSize: 16,
			'align-items': 'center'
		}}>
			Content
		</View>
	);
}`;

export const sortPropertiesDynamicMixed = `
import React from 'react';
import { View } from 'react-native';

export default function App({ isVisible }) {
	return (
		<View style={{ 
			zIndex: 10,
			backgroundColor: 'red',
			opacity: isVisible ? 1 : 0,
			fontSize: 16
		}}>
			Content
		</View>
	);
}`;

export const extractionLocationBasicComponent = `
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
	return (
		<View style={{ backgroundColor: 'red', width: 100 }}>
			<Text style={{ fontSize: 16, color: 'blue' }}>Hello</Text>
		</View>
	);
}
`;

export const extractionLocationWithImports = `
import React from 'react';
import { View, Text } from 'react-native';
import { CustomComponent } from './CustomComponent';
import * as Utils from '../utils';

export default function App() {
	return (
		<View style={{ backgroundColor: 'red', width: 100 }}>
			<Text style={{ fontSize: 16, color: 'blue' }}>Hello</Text>
		</View>
	);
}
`;

export const extractionLocationEmptyFile = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ backgroundColor: 'red', width: 100 }} />
	);
}
`;

export const extractionLocationComplexComponent = `
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CONSTANTS = {
	DEFAULT_COLOR: '#333',
	PRIMARY_COLOR: '#007AFF'
};

export default function App() {
	const [count, setCount] = useState(0);
	
	const handlePress = () => {
		setCount(count + 1);
	};

	return (
		<NavigationContainer>
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<Text style={{ fontSize: 20, fontWeight: 'bold' }}>Counter: {count}</Text>
				<TouchableOpacity style={{ padding: 15, backgroundColor: 'blue' }} onPress={handlePress}>
					<Text style={{ color: 'white', textAlign: 'center' }}>Increment</Text>
				</TouchableOpacity>
			</View>
		</NavigationContainer>
	);
}

const helperFunction = () => {
	return 'helper';
};
`;

export const extractionLocationNoImportsCode = `
export default function App() {
	return (
		<View style={{ backgroundColor: 'red', width: 100 }} />
	);
}
`;

export const extractionLocationSingleImportCode = `import React from 'react';
import { View } from 'react-native';

export default function App() {
	return <View style={{ backgroundColor: 'red' }} />;
}`;

export const extractionLocationMultilineImportCode = `import React from 'react';
import {
	View,
	Text,
	StyleSheet
} from 'react-native';

export default function App() {
	return <View style={{ backgroundColor: 'red' }} />;
}`;

export const styleBodyWithSingleLineComments = `
			// This is a comment before backgroundColor
			backgroundColor: 'red',
			padding: 10, // Inline comment
			// Comment before margin
			margin: 5
		`;

export const styleBodyWithBlockComments = `
			/* This is a block comment */
			backgroundColor: 'red',
			/* Multi-line
			   block comment */
			padding: 10,
			margin: 5 /* inline block comment */
		`;

export const styleBodyWithMixedComments = `
			// yolo
			flex: 1 /* todo: hi */,
			// holo
			backgroundColor: 'beige', // bye
			/*bolo 
			paddingBottom: insets.bottom,
			*/
		`;

export const styleBodyWithComplexMultilineComment = `{
		// yolo
		flex: 1 /* todo: hi */,
		// holo
		backgroundColor: 'beige', // bye
		/*bolo 
		paddingBottom: insets.bottom,
		*/
	}`;

export const styleBodyWithNestedComments = `
			// Header comment for entire block
			/* Multi-line header comment
			   spanning multiple lines */
			backgroundColor: 'red',
			padding: 10
		`;

export const sourceCodeWithInlineComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // This is a comment before backgroundColor
        backgroundColor: 'red',
        padding: 10, // Inline comment
        // Comment before margin
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithBlockComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        /* Block comment before backgroundColor */
        backgroundColor: 'red',
        padding: 10, /* Inline block comment */
        /* Another block comment */
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithMixedComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // Single line comment
        backgroundColor: 'red',
        /* Block comment */
        padding: 10, // Inline single line
        margin: 5 /* Inline block */
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithArrayStyleComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={[
        {
          // First object comment
          backgroundColor: 'red',
          padding: 10 // Inline in first object
        },
        {
          /* Second object comment */
          margin: 5,
          borderRadius: 8
        }
      ]}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithCommentsAndDynamicProps = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  const dynamicColor = 'blue';
  
  return (
    <View
      style={{
        // Static property with comment
        backgroundColor: 'red',
        // Dynamic property with comment
        color: dynamicColor,
        padding: 10 // Another static property
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const styleObjectTextBasic = `\tmyStyle: {
\t\tbackgroundColor: 'red',
\t\tpadding: 10,
\t},`;

export const styleSheetContentWithComments = `\tmyStyle1: {
\t\t// holo
\t\tbackgroundColor: 'beige', // bye
\t\t// yolo
\t\tflex: 1, /* todo: hi */
\t},`;

export const sourceCodeWithMultiLineCommentAfterProperty = `
const styles = StyleSheet.create({
  // This is a comment
  marginTop: 20, /* this comment should be
  on the next line*/
  // This is another comment
  marginBottom: 20
});
`;

export const sourceCodeWithMultiLineCommentBeforeProperty = `
const styles = StyleSheet.create({
  // This is a comment
  /* this comment should be
  on the next line*/marginTop: 20,
  // This is another comment
  marginBottom: 20
});
`;

export const sourceCodeWithNestedMultilineComment = `
const styles = StyleSheet.create({
  // Comment above
  fontSize: 16, /* Start /* nested */ end */
  // Comment below
  fontWeight: 'bold'
});
`;

export const sourceCodeWithCommentBetweenProperties = `
const styles = StyleSheet.create({
  width: 100,
  // Important comment
  height: 200
});
`;

export const sourceCodeWithInlineCommentAfterValue = `
const styles = StyleSheet.create({
  backgroundColor: 'red', // This is red
  color: 'blue' // This is blue
});
`;

export const sourceCodeWithMultilineCommentBeforeClosing = `
const styles = StyleSheet.create({
  margin: 10
  /* Final comment
     Multiple lines */
});
`;

export const sourceCodeWithCommentAfterLastProperty = `
const styles = StyleSheet.create({
  padding: 15 // Last property comment
});
`;

export const sourceCodeWithMixedCommentTypes = `
import React from 'react';
import { View } from 'react-native';

function TestComponent({ isActive, theme }) {
  return (
    <View
      style={{
        // Static styles
        backgroundColor: 'red',
        padding: 10,
        // Dynamic styles below
        opacity: isActive ? 1 : 0.5,
        /* Theme-based color */
        color: theme.textColor,
        // More static styles
        margin: 5,
        borderRadius: 8
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithMalformedComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // Unclosed block comment /* but this continues
        backgroundColor: 'red',
        padding: 10,
        // Double slash comment // with another slash
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithCodeLikeComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // backgroundColor: 'blue', // This is commented out
        backgroundColor: 'red',
        /* 
         * padding: 20,
         * margin: 10,
         * The above are commented out properties
         */
        padding: 15,
        // if (condition) { margin: 10 } else { margin: 5 }
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithLongComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        /* This is an extremely long comment that spans many lines and contains a lot of information about the styling decisions made here. It includes details about the design system, accessibility considerations, cross-platform compatibility notes, performance implications, and references to the design documentation. This comment is intentionally very long to test how the comment tracking system handles large amounts of text within comments. */
        backgroundColor: 'red',
        // Another very long single-line comment that goes on and on and contains lots of details about this specific property and why it was chosen and what alternatives were considered and rejected
        padding: 10
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithQuotesAndEscapes = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // Comment with "double quotes" and 'single quotes'
        backgroundColor: 'red',
        /* Comment with escaped characters: \\n \\t \\" \\' */
        padding: 10,
        // Comment with template literals: \`Hello \${name}\`
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithConditionalComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // @if iOS
        backgroundColor: 'red',
        // @endif
        // @if android
        // backgroundColor: 'blue',
        // @endif
        padding: 10,
        /* @TODO: Implement dark mode
           @FIXME: This breaks on small screens
           @NOTE: Design approved on 2023-10-01 */
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeForPerformanceTest = `
import React from 'react';
import { View } from 'react-native';

export default function App() {
	return (
		<View style={{ level: 1 }}>
			<View style={{ level: 2 }}>
				<View style={{ level: 3 }}>
					<View style={{ level: 4 }}>
						<View style={{ level: 5 }}>
							<View style={{ level: 6 }}>
								<View style={{ level: 7 }}>
									<View style={{ level: 8 }}>
										<View style={{ level: 9 }}>
											<View style={{ level: 10, final: true }}>
												Deep content
											</View>
										</View>
									</View>
								</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}
`;

export const sourceCodeWithSimpleBlockComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        /* This is a block comment */
        backgroundColor: 'red',
        /* Multi-line
           block comment */
        padding: 10,
        margin: 5 /* inline block comment */
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;
`;

export const sourceCodeWithMixedCommentTypesSimple = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View>
      <View
        style={{
          // Comment for first style
          backgroundColor: 'red',
          padding: 10 // Inline comment
        }}
      />
      <View
        style={{
          /* Block comment for second style */
          color: 'blue',
          margin: 5
        }}
      />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithCommentsInComplexExpressions = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // Dynamic padding
        padding: 10 + 5,
        /* Static background */
        backgroundColor: 'red',
        // Complex expression
        width: Math.max(100, 200)
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithCommentsAtStart = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // Header comment for the entire style block
        /* Multi-line comment at the very beginning
           describing this style object */
        backgroundColor: 'red',
        padding: 10,
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithCommentsAtEnd = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        backgroundColor: 'red',
        padding: 10,
        margin: 5,
        // Footer comment at the end
        /* Multi-line footer comment
           at the very end of the style block */
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithCommentsBetweenProperties = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        backgroundColor: 'red',
        
        // Comment between properties
        padding: 10,
        
        /* Block comment between properties
           with multiple lines */
        margin: 5,
        
        // Another comment
        borderRadius: 8
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithMultipleInlineComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        backgroundColor: 'red', // Primary color /* Brand color */
        padding: 10, // Standard padding
        margin: 5 /* Margin value */
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithNestedBlockComments = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        /* Outer comment start
           backgroundColor: 'red', // This is commented out
           This is still part of the comment
        */
        backgroundColor: 'blue',
        /* Another block comment
           with multiple lines
           describing the padding */
        padding: 10
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithCommentsWithSpecialChars = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        // TODO: Fix this @author John Doe #123
        backgroundColor: 'red',
        /* NOTE: This value is calculated as:
           width = (100% - 20px) / 2
           See: https://example.com/docs */
        padding: 10,
        // WARNING! Don't change this value!!!
        margin: 5
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithVariousCommentPlacements = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View>
      <View
        style={{
          // First style block comment
          backgroundColor: 'red',
          padding: 10 // Inline comment 1
        }}
      />
      <View
        style={{
          /* Second style block comment */
          color: 'blue',
          margin: 5,
          // End comment for second block
        }}
      />
      <View
        style={{
          borderRadius: 8, /* Inline block comment */
          // Comment before last property
          fontSize: 16
        }}
      />
    </View>
  );
}

export default TestComponent;`;

export const sourceCodeWithEmptyCommentsAndWhitespace = `
import React from 'react';
import { View } from 'react-native';

function TestComponent() {
  return (
    <View
      style={{
        //
        backgroundColor: 'red',
        /*  */
        padding: 10,
        // 
        margin: 5,
        /*



        */
        borderRadius: 8
      }}
    >
      <View />
    </View>
  );
}

export default TestComponent;`;

export const styleBodyWithFooterComments = `
			backgroundColor: 'red',
			padding: 10,
			// Footer comment
			/* Multi-line footer comment */
		`;

export const styleBodyWithNestedBlockComments = `
			/* This is a complex comment
			   backgroundColor: 'red', // This is inside the comment
			   Still part of the comment */
			backgroundColor: 'blue',
			padding: 10
		`;

export const styleBodyWithMultipleInlineComments = `
			backgroundColor: 'red', // Primary color /* Brand color */
			padding: 10, // Standard padding
			margin: 5 /* Margin value */
		`;

export const styleBodyWithEmptyComments = `
			//
			backgroundColor: 'red',
			/*  */
			padding: 10,
			// 
			margin: 5,
			/*



			*/
			borderRadius: 8
		`;

export const styleBodyWithMixedInlineComments = `
			backgroundColor: 'red', // Primary color /* Brand color */
			padding: 10 /* Standard */ // More info
		`;

export const styleBodyWithUrlComments = `
			// TODO: Fix this @author John #123
			backgroundColor: 'red',
			/* URL: https://example.com/docs?param=value&other=123 */
			padding: 10,
			// WARNING!!! Don't change!!!
			margin: 5
		`;

export const styleBodyForComplexExpressions = `
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'black',
			opacity: anim.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 0.2],
			}),
		`;

export const styleBodyWithSpanningBlockComment = `
				// yolo
				flex: 1 /* todo: hi */,
				// holo
				backgroundColor: 'beige' /*bolo 
				paddingBottom: insets.bottom,
				*/,
		`;

export const createMockDocument = () =>
	({
		offsetAt: () => 0,
	} as any);
