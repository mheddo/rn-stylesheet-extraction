# Contributing to React Native StyleSheet Extraction

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- VS Code 1.104.0 or higher
- Git

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/rn-stylesheet-extraction.git
   cd rn-stylesheet-extraction
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development**

   ```bash
   npm run watch  # Compile TypeScript in watch mode
   ```

4. **Test your changes**
   - Press `F5` in VS Code to launch a new Extension Development Host
   - Open a React Native project in the new window
   - Test your changes

## 🧪 Testing

### Running Tests

```bash
npm test           # Run all tests
npm run pretest    # Compile and lint before testing
```

### Test Structure

- `src/test/singleExtract.test.ts` - Tests for single style extraction
- `src/test/extractAll.test.ts` - Tests for extract all functionality
- `src/test/edgeCases.test.ts` - Edge cases and error handling
- `src/test/config.test.ts` - Configuration option tests
- `src/test/performance.test.ts` - Performance tests
- `src/test/integration.test.ts` - Integration tests

### Adding New Tests

When adding features, please include comprehensive tests:

1. Happy path scenarios
2. Edge cases
3. Error conditions
4. Performance considerations (for complex features)

## 📝 Code Style

### TypeScript Guidelines

- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing Guidelines

- Use descriptive test names that explain the behavior
- Group related tests in suites
- Use the existing test helpers in `testHelpers.ts`
- Mock VS Code APIs appropriately

### Commit Messages

Use conventional commit format:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `test:` test additions/modifications
- `refactor:` code refactoring
- `perf:` performance improvements

Example: `feat: add support for styled-components detection`

## 🐛 Bug Reports

When reporting bugs, please include:

1. Extension version
2. VS Code version
3. Operating system
4. Sample code that reproduces the issue
5. Expected vs actual behavior
6. Steps to reproduce

## ✨ Feature Requests

For feature requests, please:

1. Check if the feature already exists
2. Describe the use case clearly
3. Provide examples of how it would work
4. Consider backward compatibility

## 🔧 Architecture Overview

### Core Components

- `extension.ts` - Main extension entry point and command handlers
- `codeActions.ts` - Quick fix providers for inline style suggestions
- `config.ts` - Configuration management
- `constants.ts` - String constants and messages
- `commentTracker.ts` - Comment extraction and restoration

### Key Features

- **AST Parsing**: Uses Babel to parse JavaScript/TypeScript
- **Style Detection**: Smart detection of inline styles vs dynamic properties
- **Code Generation**: Generates clean StyleSheet.create() blocks
- **Import Management**: Automatically handles react-native imports

### Extension Points

When adding features, consider:

- Configuration options (add to `config.ts` and `package.json`)
- New commands (register in `extension.ts` and `package.json`)
- Error handling (use `console.error` for debugging)
- Test coverage (add comprehensive tests)

## 📦 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run package` to test packaging
4. Create a pull request
5. After merge, the CI will handle publishing

## 🤝 Code of Conduct

- Be respectful
- Focus on constructive feedback
- Help others learn and grow
- Follow the existing code patterns

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to React Native StyleSheet Extraction! 🎉
