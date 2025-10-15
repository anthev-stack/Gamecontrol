# Contributing to GameControl

First off, thank you for considering contributing to GameControl! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **A clear and descriptive title**
- **A detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repository**
2. **Create a new branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test your changes thoroughly**
5. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/Gamecontrol.git
cd Gamecontrol

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Set up database
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await over callbacks

## Testing

Before submitting a PR:

- [ ] Test all functionality you changed
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Check for console errors
- [ ] Ensure no TypeScript errors
- [ ] Test authentication flows
- [ ] Test server CRUD operations

## Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests after the first line

Examples:
```
Add server restart functionality

- Implement restart button in ServerCard
- Add restart API endpoint
- Update server status handling

Fixes #123
```

## Project Structure Guidelines

- **API Routes** → `app/api/`
- **Pages** → `app/[page-name]/page.tsx`
- **Components** → `components/`
- **Utilities** → `lib/`
- **Types** → `types/`
- **Database** → `prisma/`

## Adding New Features

### Adding a New Game Type

1. Update `prisma/schema.prisma` enum:
```prisma
enum GameType {
  CS2
  MINECRAFT
  RUST
  NEW_GAME  // Add here
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add-new-game
```

3. Update `components/ServerCard.tsx` gameIcons
4. Update `components/ServerModal.tsx` gameOptions

### Adding New API Endpoints

1. Create route file: `app/api/[endpoint]/route.ts`
2. Implement GET, POST, PATCH, DELETE as needed
3. Add authentication checks
4. Handle errors properly
5. Update relevant components

## Documentation

- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment changes
- Add JSDoc comments for complex functions
- Update type definitions as needed

## Questions?

Feel free to open an issue with the "question" label.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GameControl! 🚀

