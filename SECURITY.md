# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this VS Code extension, please send an email to mheddogh@gmail.com. All security vulnerabilities will be promptly addressed.

Please do not disclose security-related issues publicly until they have been addressed by the maintainers.

## Security Considerations

This extension:

- Processes JavaScript/TypeScript code locally within VS Code
- Does not send any code or data to external servers
- Only reads and modifies files that are explicitly opened and edited by the user
- Uses the Babel parser to parse JavaScript/TypeScript syntax safely

## Safe Usage Guidelines

- Only use this extension on trusted React Native projects
- Review any auto-generated StyleSheet code before committing
- Be cautious when using on files with complex or untrusted JavaScript expressions
