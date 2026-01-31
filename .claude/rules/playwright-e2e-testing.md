# AI Rules for fiszki

fiszki is a web application that enables the automatic generation of flashcards using artificial intelligence. The aim of the project is to significantly speed up and simplify the process of creating fiches, enabling users to quickly transform the text they enter (copy-paste) into high-quality flashcards for learning.

## TESTING

### Guidelines for E2E

#### PLAYWRIGHT

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs

