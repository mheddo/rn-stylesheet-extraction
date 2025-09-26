# Change Log

All notable changes to the React Native StyleSheet Extraction extension will be documented in this file.

## [0.0.1] - Initial Release

### Added

- **Smart Style Extraction Engine**: Extract individual inline styles or all styles in a file with intelligent cursor detection
- **Static vs Dynamic Property Separation**: Automatically identifies and separates static properties (like `backgroundColor: 'red'`) from dynamic ones (like `opacity: isVisible ? 1 : 0`)
- **Advanced Array Style Support**: Handles both simple `style={{...}}` and complex `style={[styles.base, {...}]}` patterns seamlessly
- **Intelligent Comment Preservation**: Extracts and restores all comment types (single-line, block, multi-line) with proper positioning and indentation
- **Automatic StyleSheet Import Management**: Adds or updates `import { StyleSheet } from 'react-native'` statements intelligently
- **Smart Naming System**: Generates unique style names with conflict detection across multiple StyleSheets
- **Flexible StyleSheet Placement**: Configure where StyleSheets are created - at top, bottom, or after imports
- **Complex Expression Handling**: Processes nested objects, ternary operators, function calls, and complex JavaScript expressions
- **Multiple StyleSheet Support**: Works with existing StyleSheets, merges intelligently, handles naming conflicts
- **7 Comprehensive Configuration Options**: Customize default names, auto-import behavior, property sorting, comment preservation, extraction location, and UI elements
- **Developer-Friendly Interface**: Keyboard shortcuts (`Cmd+Shift+E`, `Cmd+Shift+A`), context menu integration, and command palette access
- **Robust Error Handling**: Graceful handling of malformed styles, parse errors, and edge cases with user-friendly messages
- **Language Support**: Full support for JavaScript, JSX, TypeScript, and TSX files with React Native projects
- **Performance Optimized**: Handles large files and deeply nested JSX structures efficiently
- **Production-Ready Quality**: 119 comprehensive tests covering all features, edge cases, and configuration scenarios
